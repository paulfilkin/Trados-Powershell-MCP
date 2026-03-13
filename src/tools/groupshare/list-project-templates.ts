import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ps7 } from "../../executors/ps7.js";

export function registerListProjectTemplatesTool(server: McpServer): void {
  server.tool(
    "gs_list_project_templates",
    "List all project templates available on the GroupShare server. " +
    "Use this to discover template names for gs_new_project.",
    {},
    async () => {
      try {
        const script = `
          $templates = Get-AllProjectTemplates -authorizationToken $authToken
          @{ templates = @($templates) } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("groupshare", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
