import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ps7 } from "../../executors/ps7.js";

export function registerListProjectTemplatesTool(server: McpServer): void {
  server.tool(
    "lc_list_project_templates",
    "List all project templates in Language Cloud. Use this to discover template names for lc_new_project.",
    {},
    async () => {
      try {
        const script = `
          $templates = Get-AllProjectTemplates -accessKey $accessKey
          @{ templates = @($templates) } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
