import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerRequestFileAnalysisTool(server: McpServer): void {
  server.tool(
    "lc_request_file_analysis",
    "Request word count analysis for files. " +
    "Returns an operation ID to poll with lc_get_file_analysis_status.",
    {
      file_ids:               z.string().describe("Comma-separated file IDs to analyse"),
      source_language:        z.string().describe("Source language code"),
      target_language:        z.string().describe("Target language code"),
      translation_engine_id:  z.string().optional().describe("Translation engine ID for match analysis"),
    },
    async (params) => {
      try {
        const fileIdsArray = params.file_ids.split(",").map(id => psStr(id.trim())).join(", ");
        const engineArg = params.translation_engine_id
          ? `-translationEngineId ${psStr(params.translation_engine_id)}`
          : "";

        const script = `
          $result = Request-FileAnalysis -accessKey $accessKey \`
            -fileIds @(${fileIdsArray}) \`
            -sourceLanguage ${psStr(params.source_language)} \`
            -targetLanguage ${psStr(params.target_language)} \`
            ${engineArg}
          @{ analysis = $result } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
