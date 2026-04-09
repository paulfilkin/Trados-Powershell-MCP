import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerUpdateTmTool(server: McpServer): void {
  server.tool(
    "lc_update_tm",
    "Update an existing Language Cloud TM's name, description, copyright, languages, or associated rules.",
    {
      tm_id:                z.string().optional().describe("TM ID"),
      tm_name:              z.string().optional().describe("TM name (alternative to ID for lookup)"),
      name:                 z.string().optional().describe("New name"),
      description:          z.string().optional().describe("New description"),
      copyright:            z.string().optional().describe("New copyright"),
      source_language:      z.string().optional().describe("New source language code"),
      target_languages:     z.string().optional().describe("Comma-separated new target language codes"),
      language_processing:  z.string().optional().describe("Language processing rule name or ID"),
      field_template:       z.string().optional().describe("Field template name or ID"),
    },
    async (params) => {
      try {
        const tmArg = params.tm_id
          ? `-translationMemoryId ${psStr(params.tm_id)}`
          : `-translationMemoryName ${psStr(params.tm_name ?? "")}`;

        const optionalArgs = [
          params.name                ? `-name ${psStr(params.name)}`                                          : "",
          params.description         ? `-description ${psStr(params.description)}`                            : "",
          params.copyright           ? `-copyRight ${psStr(params.copyright)}`                                : "",
          params.source_language     ? `-sourceLanguage ${psStr(params.source_language)}`                     : "",
          params.language_processing ? `-languageProcessingIdOrName ${psStr(params.language_processing)}`     : "",
          params.field_template      ? `-fieldTemplateIdOrName ${psStr(params.field_template)}`               : "",
        ].filter(Boolean).join(" `\n            ");

        const targetArg = params.target_languages
          ? `-targetLanguages @(${params.target_languages.split(",").map(l => psStr(l.trim())).join(", ")})`
          : "";

        const script = `
          Update-TranslationMemory -accessKey $accessKey \`
            ${tmArg} \`
            ${targetArg ? targetArg + " `" : ""}
            ${optionalArgs}
          @{ updated = $true } | ConvertTo-Json -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
