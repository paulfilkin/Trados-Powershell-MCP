import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerConcordanceSearchTool(server: McpServer): void {
  server.tool(
    "lc_concordance_search",
    "Perform a concordance search against TMs associated with a translation engine. " +
    "Finds partial matches within stored segments.",
    {
      content:                z.string().describe("Text to search for"),
      source_language:        z.string().describe("Source language code (e.g. en-US)"),
      target_language:        z.string().describe("Target language code (e.g. de-DE)"),
      translation_engine_id:  z.string().describe("Translation engine ID (from lc_list_translation_engines)"),
      target_only:            z.boolean().optional().describe("Search only in target segments (default: false)"),
    },
    async (params) => {
      try {
        const targetOnlyArg = params.target_only !== undefined
          ? `-targetOnly $${params.target_only}`
          : "";

        const script = `
          $result = Invoke-ConcordanceSearch -accessKey $accessKey \`
            -content ${psStr(params.content)} \`
            -sourceLanguage ${psStr(params.source_language)} \`
            -targetLanguage ${psStr(params.target_language)} \`
            -translationEngineId ${psStr(params.translation_engine_id)} \`
            ${targetOnlyArg}
          @{ concordanceResult = $result } | ConvertTo-Json -Depth 10 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
