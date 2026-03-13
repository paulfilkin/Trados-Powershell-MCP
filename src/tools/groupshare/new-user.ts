import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerNewUserTool(server: McpServer): void {
  server.tool(
    "gs_new_user",
    "Create a new user on the GroupShare server. " +
    "Use gs_list_organizations to find the organisation name and gs_list_roles (or gs_new_role) to find the role name. " +
    "The user type must be one of: SDLUser, WindowsUser, CustomUser, IdpUser.",
    {
      username: z.string().describe("Username (login name)"),
      password: z.string().describe("Initial password"),
      email: z.string().optional().describe("Email address"),
      display_name: z.string().describe("Display name"),
      user_type: z.enum(["SDLUser", "WindowsUser", "CustomUser", "IdpUser"])
        .describe("User type"),
      organization_name: z.string().describe("Organisation to add the user to"),
      role_name: z.string().describe("Role to assign to the user (e.g. Administrator, Translator)"),
    },
    async (params) => {
      try {
        const emailBlock = params.email
          ? `-emailAddress ${psStr(params.email)}`
          : "";

        const script = `
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

          $user = New-User \`
            -authorizationToken $authToken \`
            -userName     ${psStr(params.username)} \`
            -password     ${psStr(params.password)} \`
            -displayName  ${psStr(params.display_name)} \`
            -userType     ${psStr(params.user_type)} \`
            -organization $org \`
            -role         $role \`
            ${emailBlock}

          [PSCustomObject]@{
            uniqueId     = $user.UniqueId
            userName     = $user.Name
            displayName  = $user.DisplayName
            email        = $user.EmailAddress
            userType     = $user.UserType
            organization = $user.OrganizationId
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
