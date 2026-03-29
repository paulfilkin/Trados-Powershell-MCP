import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerMoveOrganizationResourcesTool(server: McpServer): void {
  server.tool(
    "gs_move_organization_resources",
    "Move all resources from one GroupShare organisation to another. " +
    "Retrieves resources from the source organisation via Get-AllOrganizationResources, " +
    "then moves them to the target organisation. Use with caution.",
    {
      source_organization_name: z.string().describe("Organisation to move resources from"),
      target_organization_name: z.string().describe("Organisation to move resources to"),
    },
    async (params) => {
      try {
        const script = `
          $sourceOrg = Get-Organization -authorizationToken $authToken \`
            -organizationName ${psStr(params.source_organization_name)}

          if ($null -eq $sourceOrg) {
            throw "Source organisation not found: ${psStr(params.source_organization_name)}"
          }

          $targetOrg = Get-Organization -authorizationToken $authToken \`
            -organizationName ${psStr(params.target_organization_name)}

          if ($null -eq $targetOrg) {
            throw "Target organisation not found: ${psStr(params.target_organization_name)}"
          }

          $resources = @(Get-AllOrganizationResources -authorizationToken $authToken \`
            -organization $sourceOrg)

          if ($resources.Count -eq 0) {
            throw "No resources found in source organisation: ${psStr(params.source_organization_name)}"
          }

          Move-OrganizationResources \`
            -authorizationToken $authToken \`
            -resources       $resources \`
            -newOrganization $targetOrg

          @{
            success            = $true
            resourcesMoved     = $resources.Count
            sourceOrganization = ${psStr(params.source_organization_name)}
            targetOrganization = ${psStr(params.target_organization_name)}
          } | ConvertTo-Json -Compress
        `;
        const result = await ps7("groupshare", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
