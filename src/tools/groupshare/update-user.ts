import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerUpdateUserTool(server: McpServer): void {
  server.tool(
    "gs_update_user",
    "Update an existing GroupShare user's properties. Only the fields provided are changed.",
    {
      username: z.string().describe("Username of the user to update"),
      email: z.string().optional().describe("New email address"),
      display_name: z.string().optional().describe("New display name"),
      new_password: z.string().optional().describe("New password"),
      description: z.string().optional().describe("New description"),
    },
    async (params) => {
      try {
        const emailBlock       = params.email        ? `-emailAddress ${psStr(params.email)}`          : "";
        const displayBlock     = params.display_name ? `-displayName  ${psStr(params.display_name)}`   : "";
        const passwordBlock    = params.new_password ? `-password     ${psStr(params.new_password)}`   : "";
        const descriptionBlock = params.description  ? `-description  ${psStr(params.description)}`    : "";

        const script = `
          $user = Get-User -authorizationToken $authToken \`
            -userName ${psStr(params.username)}

          if ($null -eq $user) {
            throw "User not found: ${psStr(params.username)}"
          }

          $updated = Update-User \`
            -authorizationToken $authToken \`
            -user         $user \`
            ${emailBlock} \`
            ${displayBlock} \`
            ${passwordBlock} \`
            ${descriptionBlock}

          [PSCustomObject]@{
            uniqueId    = $updated.UniqueId
            userName    = $updated.Name
            displayName = $updated.DisplayName
            email       = $updated.EmailAddress
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
