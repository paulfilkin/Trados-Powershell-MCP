import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerTranslationLookupTool(server: McpServer): void {
  server.tool(
    "lc_translation_lookup",
    "Perform a TM lookup for a given text segment against the TMs associated with a translation engine. " +
    "Returns translation proposals with match scores.",
    {
      content:                z.string().describe("Source text to look up"),
      source_language:        z.string().describe("Source language code (e.g. en-US)"),
      target_language:        z.string().describe("Target language code (e.g. de-DE)"),
      translation_engine_id:  z.string().describe("Translation engine ID (from lc_list_translation_engines)"),
      minimum_match_value:    z.number().optional().describe("Minimum match percentage (default: toolkit default)"),
    },
    async (params) => {
      try {
        const settingsArg = params.minimum_match_value !== undefined
          ? `-settings @{ translationMemory = @{ minimumMatchValue = ${params.minimum_match_value} } }`
          : "";

        const script = `
          $result = Invoke-TranslationLookup -accessKey $accessKey \`
            -content ${psStr(params.content)} \`
            -sourceLanguage ${psStr(params.source_language)} \`
            -targetLanguage ${psStr(params.target_language)} \`
            -translationEngineId ${psStr(params.translation_engine_id)} \`
            ${settingsArg}
          @{ lookupResult = $result } | ConvertTo-Json -Depth 10 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
