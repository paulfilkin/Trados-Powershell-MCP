import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ps7 } from "../../executors/ps7.js";

export function registerListSupportedLanguagesTool(server: McpServer): void {
  server.tool(
    "lc_list_supported_languages",
    "List all languages supported by Language Cloud. Returns language code, English name, " +
    "script direction, and whether the code is neutral (region-independent). " +
    "Useful for discovering valid language codes before creating projects, TMs, or termbases.",
    {},
    async () => {
      try {
        const script = `
          $langs = Get-SupportedLanguages -accessKey $accessKey
          @{ languages = @($langs.items) } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
