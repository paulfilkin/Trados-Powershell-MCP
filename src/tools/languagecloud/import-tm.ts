import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psPath } from "../../executors/common.js";

export function registerImportTmTool(server: McpServer): void {
  server.tool(
    "lc_import_tm",
    "Import a TMX file into a Language Cloud translation memory. Provide tm_name or tm_id. " +
    "Optional parameters control how duplicate and unknown content is handled during import.",
    {
      tm_name:                       z.string().optional().describe("TM name"),
      tm_id:                         z.string().optional().describe("TM ID"),
      import_file_path:              z.string().describe("Path to the .tmx file"),
      source_language:               z.string().describe("Source language code (e.g. en-GB)"),
      target_language:               z.string().describe("Target language code (e.g. de-DE)"),
      import_as_plain_text:          z.boolean().optional().describe("Import as plain text, stripping formatting (default: false)"),
      export_invalid_tus:            z.boolean().optional().describe("Export invalid translation units to a separate file (default: false)"),
      trigger_recompute_statistics:  z.boolean().optional().describe("Recompute TM statistics after import (default: true)"),
      target_segments_differ_option: z.string().optional().describe("How to handle TUs where target differs: addNew, overwrite, keepExisting, mergeIntoExisting"),
      unknown_fields_option:         z.string().optional().describe("How to handle unknown fields: addToTranslationMemory, ignore, skipTranslationUnit"),
      confirmation_levels:           z.string().optional().describe("Comma-separated confirmation levels to import: translated, approvedTranslation, approvedSignOff, draft, rejectedTranslation, rejectedSignOff. Imports all levels if omitted."),
    },
    async (params) => {
      try {
        const tmArg = params.tm_id
          ? `-translationMemoryId ${psStr(params.tm_id)}`
          : `-translationMemoryName ${psStr(params.tm_name ?? "")}`;

        const optionalArgs = [
          params.import_as_plain_text !== undefined
            ? `-importAsPlainText $${params.import_as_plain_text}`
            : "",
          params.export_invalid_tus !== undefined
            ? `-exportInvalidTranslationUnits $${params.export_invalid_tus}`
            : "",
          params.trigger_recompute_statistics !== undefined
            ? `-triggerRecomputeStatistics $${params.trigger_recompute_statistics}`
            : "",
          params.target_segments_differ_option
            ? `-targetSegmentsDifferOption ${psStr(params.target_segments_differ_option)}`
            : "",
          params.unknown_fields_option
            ? `-unknownFieldsOption ${psStr(params.unknown_fields_option)}`
            : "",
        ].filter(Boolean).join(" `\n            ");

        const confirmationArg = params.confirmation_levels
          ? `-onlyImportSegmentsWithConfirmationLevels @(${params.confirmation_levels.split(",").map(l => psStr(l.trim())).join(", ")})`
          : "";

        const script = `
          Import-TranslationMemory \`
            -accessKey             $accessKey \`
            ${tmArg} \`
            -importFileLocation    ${psPath(params.import_file_path)} \`
            -sourceLanguage        ${psStr(params.source_language)} \`
            -targetLanguage        ${psStr(params.target_language)} \`
            ${confirmationArg ? confirmationArg + " `" : ""}
            ${optionalArgs}

          @{ imported = $true; path = ${psStr(params.import_file_path)} } | ConvertTo-Json -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
