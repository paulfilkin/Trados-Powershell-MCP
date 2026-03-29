import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ps7 } from "../../executors/ps7.js";

export function registerListTermbasesTool(server: McpServer): void {
  server.tool(
    "lc_list_termbases",
    "List all termbases in Language Cloud.",
    {},
    async () => {
      try {
        const script = `
          $termbases = Get-AllTermbases -accessKey $accessKey
          @{ termbases = @($termbases) } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
