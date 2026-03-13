import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ps7 } from "../../executors/ps7.js";

export function registerListWorkflowsTool(server: McpServer): void {
  server.tool(
    "lc_list_workflows",
    "List all workflows available in Language Cloud. Use this to discover workflow names for lc_new_project.",
    {},
    async () => {
      try {
        const script = `
          $workflows = Get-AllWorkflows -accessKey $accessKey
          @{ workflows = @($workflows) } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
