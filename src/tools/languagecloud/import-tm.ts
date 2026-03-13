import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psPath } from "../../executors/common.js";

export function registerImportTmTool(server: McpServer): void {
  server.tool(
    "lc_import_tm",
    "Import a TMX file into a Language Cloud translation memory. Provide tm_name or tm_id.",
    {
      tm_name:          z.string().optional().describe("TM name"),
      tm_id:            z.string().optional().describe("TM ID"),
      import_file_path: z.string().describe("Path to the .tmx file"),
      source_language:  z.string().describe("Source language code (e.g. en-GB)"),
      target_language:  z.string().describe("Target language code (e.g. de-DE)"),
    },
    async (params) => {
      try {
        const tmArg = params.tm_id
          ? `-translationMemoryId ${psStr(params.tm_id)}`
          : `-translationMemoryName ${psStr(params.tm_name ?? "")}`;

        const script = `
          Import-TranslationMemory \`
            -accessKey             $accessKey \`
            ${tmArg} \`
            -importFileLocation    ${psPath(params.import_file_path)} \`
            -sourceLanguage        ${psStr(params.source_language)} \`
            -targetLanguage        ${psStr(params.target_language)}

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
