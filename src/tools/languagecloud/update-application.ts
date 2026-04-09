import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerUpdateApplicationTool(server: McpServer): void {
  server.tool(
    "lc_update_application",
    "Update an existing application's properties.",
    {
      application_id:    z.string().optional().describe("Application ID"),
      application_name:  z.string().optional().describe("Application name (alternative to ID for lookup)"),
      name:              z.string().optional().describe("New name"),
      description:       z.string().optional().describe("New description"),
      enable_api_access: z.boolean().optional().describe("Enable or disable API access"),
      service_user_id:   z.string().optional().describe("Service user ID to associate"),
      regenerate_secret: z.boolean().optional().describe("Regenerate the client secret (default: false)"),
    },
    async (params) => {
      try {
        const appArg = params.application_id
          ? `-applicationId ${psStr(params.application_id)}`
          : `-applicationName ${psStr(params.application_name ?? "")}`;

        const optionalArgs = [
          params.name                            ? `-name ${psStr(params.name)}`                        : "",
          params.description                     ? `-description ${psStr(params.description)}`          : "",
          params.enable_api_access !== undefined  ? `-enableApiAccess $${params.enable_api_access}`     : "",
          params.service_user_id                 ? `-serviceUserId ${psStr(params.service_user_id)}`    : "",
          params.regenerate_secret !== undefined  ? `-regenerateSecret $${params.regenerate_secret}`    : "",
        ].filter(Boolean).join(" `\n            ");

        const script = `
          $result = Update-Application -accessKey $accessKey \`
            ${appArg} \`
            ${optionalArgs}
          @{ application = $result } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
