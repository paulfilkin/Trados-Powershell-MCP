import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psJsonParam } from "../../executors/common.js";

export function registerUpdateTranslationEngineTool(server: McpServer): void {
  server.tool(
    "lc_update_translation_engine",
    "Update a translation engine's name, description, and/or definition. " +
    "The definition includes language pair definitions (with TM/TB/MT/LLM resources), " +
    "the resource sequence, and adjacent language penalty.",
    {
      translation_engine_id: z.string().describe("Translation engine ID (from lc_list_translation_engines)"),
      name:                  z.string().optional().describe("New name"),
      description:           z.string().optional().describe("New description"),
      definition_json:       z.string().optional().describe("JSON string representing the full engine definition"),
    },
    async (params) => {
      try {
        const args = [
          `-translationEngineId ${psStr(params.translation_engine_id)}`,
          params.name           ? `-name ${psStr(params.name)}`                  : "",
          params.description    ? `-description ${psStr(params.description)}`    : "",
          params.definition_json ? `-definition ${psJsonParam(params.definition_json)}` : "",
        ].filter(Boolean).join(" `\n            ");

        const script = `
          $result = Update-TranslationEngine -accessKey $accessKey \`
            ${args}
          @{ translationEngine = $result } | ConvertTo-Json -Depth 10 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
