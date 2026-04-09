import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerSearchTermbaseTermsTool(server: McpServer): void {
  server.tool(
    "lc_search_termbase_terms",
    "Search for terms in a termbase by source language. " +
    "Supports normal (exact), linguistic (stemming-based), and fuzzy search types.",
    {
      termbase_id:          z.string().describe("Termbase ID"),
      source_language_code: z.string().describe("Source language code (e.g. en-US)"),
      search:               z.string().optional().describe("Text to search for (max 100 characters)"),
      search_type:          z.string().optional().describe("Search type: normal (default), linguistic, fuzzy"),
      target_language_code: z.string().optional().describe("Target language code to filter results by"),
      skip:                 z.number().optional().describe("Items to skip for pagination"),
      top:                  z.number().optional().describe("Items per page (1-100)"),
    },
    async (params) => {
      try {
        const optionalArgs = [
          params.search               ? `-search ${psStr(params.search)}`                         : "",
          params.search_type          ? `-searchType ${psStr(params.search_type)}`                 : "",
          params.target_language_code ? `-targetLanguageCode ${psStr(params.target_language_code)}` : "",
          params.skip !== undefined   ? `-skip ${params.skip}`                                    : "",
          params.top !== undefined    ? `-top ${params.top}`                                      : "",
        ].filter(Boolean).join(" `\n            ");

        const script = `
          $results = Search-TermbaseTerms -accessKey $accessKey \`
            -termbaseId ${psStr(params.termbase_id)} \`
            -sourceLanguageCode ${psStr(params.source_language_code)} \`
            ${optionalArgs}
          @{ searchResults = $results } | ConvertTo-Json -Depth 10 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
