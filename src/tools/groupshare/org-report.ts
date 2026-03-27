import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerOrgReportTool(server: McpServer): void {
  server.tool(
    "gs_org_report",
    "Generate a comprehensive report for a GroupShare organisation. " +
    "Gathers child organisations, projects (with status summary), containers, " +
    "TMs per container, project templates, and users in a single call. " +
    "Set include_sub_organizations to true to include projects from child organisations.",
    {
      organization_name:       z.string().describe("Organisation name to report on"),
      include_sub_organizations: z.boolean().optional().describe("Include projects from child organisations (default: true)"),
      max_projects:            z.number().int().positive().optional().describe("Maximum number of projects to return in detail (default: 100)"),
      max_users:               z.number().int().positive().optional().describe("Maximum number of users to return (default: 100)"),
    },
    async (params) => {
      try {
        const includeSubOrgs = params.include_sub_organizations !== false ? "$true" : "$false";
        const maxProjects = params.max_projects ?? 100;
        const maxUsers = params.max_users ?? 100;

        const script = `
          # Look up the target organisation
          $org = Get-Organization -authorizationToken $authToken -organizationName ${psStr(params.organization_name)}
          if ($null -eq $org) { throw "Organisation not found: ${params.organization_name}" }

          $orgPath = $org.Path

          # --- Child organisations ---
          $allOrgs = Get-AllOrganizations -authorizationToken $authToken
          $childOrgs = @($allOrgs) | Where-Object {
            $_.Path -ne $orgPath -and $_.Path.StartsWith($orgPath + '/')
          } | ForEach-Object {
            [PSCustomObject]@{
              name = $_.Name
              path = $_.Path
            }
          }

          # --- Projects ---
          $projects = Get-AllProjects -authorizationToken $authToken -organization $org \`
            -includeSubOrganizations ${includeSubOrgs} \`
            -defaultPublishDates $false -defaultDueDates $false

          $projectTotal = @($projects).Count

          # Status summary
          $statusSummary = @($projects) | Group-Object -Property Status | ForEach-Object {
            [PSCustomObject]@{ status = $_.Name; count = $_.Count }
          } | Sort-Object -Property count -Descending

          # Language summary
          $langSummary = @($projects) | Group-Object -Property SourceLanguage | ForEach-Object {
            [PSCustomObject]@{ language = $_.Name; count = $_.Count }
          } | Sort-Object -Property count -Descending

          # Project list (capped)
          $projectList = @($projects) | Select-Object -First ${maxProjects} | ForEach-Object {
            [PSCustomObject]@{
              name             = $_.Name
              status           = $_.Status
              organizationName = $_.OrganizationName
              sourceLanguage   = $_.SourceLanguage
              targetLanguage   = $_.TargetLanguage
              createdAt        = $_.CreatedAt
            }
          }

          # --- Containers and TMs ---
          $allContainers = Get-AllContainers -authorizationToken $authToken
          $orgContainers = @($allContainers) | Where-Object { $_.OwnerId -eq $org.UniqueId }

          $allTMs = $null
          $tmsByContainer = @()
          if (@($orgContainers).Count -gt 0) {
            $allTMs = Get-AllTMs -authorizationToken $authToken
            $tmsByContainer = @($orgContainers) | ForEach-Object {
              $container = $_
              $containerTMs = @($allTMs) | Where-Object { $_.ContainerId -eq $container.ContainerId }
              [PSCustomObject]@{
                containerName = $container.DisplayName
                containerId   = $container.ContainerId
                tmCount       = @($containerTMs).Count
                tms           = @($containerTMs | ForEach-Object {
                  [PSCustomObject]@{
                    name = $_.Name
                  }
                })
              }
            }
          }

          # --- Project templates ---
          $allTemplates = Get-AllProjectTemplates -authorizationToken $authToken
          $orgTemplates = @($allTemplates) | Where-Object { $_.OrganizationId -eq $org.UniqueId } | ForEach-Object {
            [PSCustomObject]@{
              name = $_.Name
            }
          }

          # --- Users ---
          $users = Get-AllUsers -authorizationToken $authToken -organization $org -maxLimit ${maxUsers}
          $userList = @($users) | ForEach-Object {
            [PSCustomObject]@{
              displayName = $_.DisplayName
              userName    = $_.Name
              email       = $_.EmailAddress
              userType    = $_.UserType
            }
          }

          # --- Assemble report ---
          @{
            organization = [PSCustomObject]@{
              name = $org.Name
              path = $org.Path
              id   = $org.UniqueId.ToString()
            }
            childOrganizations = [PSCustomObject]@{
              count = @($childOrgs).Count
              items = @($childOrgs)
            }
            projects = [PSCustomObject]@{
              total         = $projectTotal
              returnedCount = @($projectList).Count
              statusSummary = @($statusSummary)
              languageSummary = @($langSummary)
              items         = @($projectList)
            }
            containers = [PSCustomObject]@{
              count = @($orgContainers).Count
              items = @($tmsByContainer)
            }
            projectTemplates = [PSCustomObject]@{
              count = @($orgTemplates).Count
              items = @($orgTemplates)
            }
            users = [PSCustomObject]@{
              count = @($userList).Count
              items = @($userList)
            }
          } | ConvertTo-Json -Depth 10 -Compress
        `;

        const result = await ps7("groupshare", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
