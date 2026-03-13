import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ps7 } from "../../executors/ps7.js";

export function registerListTranslationEnginesTool(server: McpServer): void {
  server.tool(
    "lc_list_translation_engines",
    "List all translation engines configured in Language Cloud. Use this to discover engine names for lc_new_project.",
    {},
    async () => {
      try {
        const script = `
          $engines = Get-AllTranslationEngines -accessKey $accessKey
          @{ translationEngines = @($engines) } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
