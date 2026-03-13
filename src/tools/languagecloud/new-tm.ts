import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerNewTmTool(server: McpServer): void {
  server.tool(
    "lc_new_tm",
    "Create a new Language Cloud translation memory. " +
    "language_processing and field_template are mandatory - use lc_list_tms to see what values are in use on existing TMs.",
    {
      name:                z.string().describe("TM name"),
      source_language:     z.string().describe("Source language code (e.g. en-GB)"),
      target_language:     z.string().describe("Target language code (e.g. de-DE)"),
      language_processing: z.string().describe("Language processing rule name or ID"),
      field_template:      z.string().describe("Field template name or ID"),
      description:         z.string().optional().describe("Optional description"),
    },
    async (params) => {
      try {
        const descArg = params.description
          ? `-description ${psStr(params.description)}`
          : "";

        const script = `
          $langPair = Get-LanguagePair \`
            -accessKey       $accessKey \`
            -sourceLanguage  ${psStr(params.source_language)} \`
            -targetLanguages @(${psStr(params.target_language)})

          $tm = New-TranslationMemory \`
            -accessKey                    $accessKey \`
            -tmName                       ${psStr(params.name)} \`
            -languagePair                 $langPair \`
            -languageProcessingIdOrName   ${psStr(params.language_processing)} \`
            -fieldTemplateIdOrName        ${psStr(params.field_template)} \`
            ${descArg}

          @{ tm = $tm } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
