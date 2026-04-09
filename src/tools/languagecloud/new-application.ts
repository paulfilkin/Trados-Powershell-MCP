import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerNewApplicationTool(server: McpServer): void {
  server.tool(
    "lc_new_application",
    "Create a new application in Language Cloud. Applications are used for API integrations.",
    {
      name:              z.string().describe("Application name"),
      description:       z.string().optional().describe("Application description"),
      enable_api_access: z.boolean().optional().describe("Enable API access (default: true)"),
      service_user_id:   z.string().optional().describe("Existing service user ID to associate"),
    },
    async (params) => {
      try {
        const optionalArgs = [
          params.description                    ? `-description ${psStr(params.description)}`           : "",
          params.enable_api_access !== undefined ? `-enableApiAccess $${params.enable_api_access}`      : "",
          params.service_user_id                ? `-serviceUserId ${psStr(params.service_user_id)}`     : "",
        ].filter(Boolean).join(" `\n            ");

        const script = `
          $result = New-Application -accessKey $accessKey \`
            -name ${psStr(params.name)} \`
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
