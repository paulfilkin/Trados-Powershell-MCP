import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ps7 } from "../../executors/ps7.js";

export function registerListTmsTool(server: McpServer): void {
  server.tool(
    "lc_list_tms",
    "List all translation memories in Language Cloud.",
    {},
    async () => {
      try {
        const script = `
          $tms = Get-AllTranslationMemories -accessKey $accessKey
          @{ tms = @($tms) } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
