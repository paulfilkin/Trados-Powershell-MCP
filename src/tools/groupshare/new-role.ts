import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerNewRoleTool(server: McpServer): void {
  server.tool(
    "gs_new_role",
    "Create a new role on the GroupShare server. " +
    "Permissions are looked up by display name via Get-Permissions. " +
    "If no permission names are provided the role is created with all available permissions. " +
    "Use gs_list_organizations to see available organisations.",
    {
      name: z.string().describe("Role name"),
      permissions: z.string().optional()
        .describe("Comma-separated permission display names (e.g. 'Add Library,Delete Library'). Leave blank to include all permissions."),
    },
    async (params) => {
      try {
        const permsBlock = params.permissions
          ? `$permissions = Get-Permissions -authorizationToken $authToken \`
               -permissionNames @(${params.permissions.split(",").map(p => psStr(p.trim())).join(",")})`
          : `$permissions = Get-Permissions -authorizationToken $authToken`;

        const script = `
          ${permsBlock}

          if ($null -eq $permissions -or $permissions.Count -eq 0) {
            throw "No matching permissions found"
          }

          $role = New-Role \`
            -authorizationToken $authToken \`
            -roleName     ${psStr(params.name)} \`
            -permissions  @($permissions)

          [PSCustomObject]@{
            uniqueId    = $role.UniqueId
            name        = $role.Name
            permissions = @($role.Permissions | ForEach-Object { $_.DisplayName })
          } | ConvertTo-Json -Depth 3 -Compress
        `;
        const result = await ps7("groupshare", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
