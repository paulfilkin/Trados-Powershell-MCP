import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerUpdateRoleToUserTool(server: McpServer): void {
  server.tool(
    "gs_update_role_to_user",
    "Add or remove a role assignment for a GroupShare user within an organisation.",
    {
      username: z.string().describe("Username to assign or unassign the role"),
      role_name: z.string().describe("Name of the role to add or remove"),
      organization_name: z.string().describe("Organisation context for the role assignment"),
      update_mode: z.enum(["Add", "Remove"]).describe("Add or Remove the role"),
    },
    async (params) => {
      try {
        const script = `
          $user = Get-User -authorizationToken $authToken \`
            -userName ${psStr(params.username)}

          if ($null -eq $user) {
            throw "User not found: ${psStr(params.username)}"
          }

          $org = Get-Organization -authorizationToken $authToken \`
            -organizationName ${psStr(params.organization_name)}

          if ($null -eq $org) {
            throw "Organisation not found: ${psStr(params.organization_name)}"
          }

          $role = Get-Role -authorizationToken $authToken \`
            -roleName ${psStr(params.role_name)}

          if ($null -eq $role) {
            throw "Role not found: ${psStr(params.role_name)}"
          }

          $updated = Update-RoleToUser \`
            -authorizationToken $authToken \`
            -user         $user \`
            -role         $role \`
            -organization $org \`
            -updateMode   ${psStr(params.update_mode)}

          @{
            success      = $true
            userName     = ${psStr(params.username)}
            roleName     = ${psStr(params.role_name)}
            organization = ${psStr(params.organization_name)}
            updateMode   = ${psStr(params.update_mode)}
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
