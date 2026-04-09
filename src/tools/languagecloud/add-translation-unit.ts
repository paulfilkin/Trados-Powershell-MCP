import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psJsonParam } from "../../executors/common.js";

export function registerAddTranslationUnitTool(server: McpServer): void {
  server.tool(
    "lc_add_translation_unit",
    "Add a new translation unit (source and target segment pair) to the TMs associated with a translation engine.",
    {
      content:                z.string().describe("Translation unit content (XLIFF or structured string with source and target)"),
      translation_engine_id:  z.string().describe("Translation engine ID"),
      settings_json:          z.string().optional().describe("Optional JSON string with settings, e.g. {\"fields\":[{\"name\":\"Client\",\"values\":[\"Acme\"]}],\"ifTargetSegmentsDiffer\":\"addNew\"}"),
    },
    async (params) => {
      try {
        const args = [
          `-content ${psStr(params.content)}`,
          `-translationEngineId ${psStr(params.translation_engine_id)}`,
          params.settings_json ? `-settings ${psJsonParam(params.settings_json)}` : "",
        ].filter(Boolean).join(" `\n            ");

        const script = `
          $result = Add-TranslationUnit -accessKey $accessKey \`
            ${args}
          @{ translationUnit = $result } | ConvertTo-Json -Depth 10 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
