import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psPath } from "../../executors/common.js";

export function registerExportTmTool(server: McpServer): void {
  server.tool(
    "lc_export_tm",
    "Export a Language Cloud translation memory to TMX. Provide tm_name or tm_id.",
    {
      tm_name:         z.string().optional().describe("TM name"),
      tm_id:           z.string().optional().describe("TM ID"),
      output_path:     z.string().describe("Destination path for the exported TMX file"),
      source_language: z.string().describe("Source language code (e.g. en-GB)"),
      target_language: z.string().describe("Target language code (e.g. de-DE)"),
    },
    async (params) => {
      try {
        const tmArg = params.tm_id
          ? `-translationMemoryId ${psStr(params.tm_id)}`
          : `-translationMemoryName ${psStr(params.tm_name ?? "")}`;

        const script = `
          Export-TranslationMemory \`
            -accessKey       $accessKey \`
            ${tmArg} \`
            -outputFilePath  ${psPath(params.output_path)} \`
            -sourceLanguage  ${psStr(params.source_language)} \`
            -targetLanguage  ${psStr(params.target_language)}

          @{ exported = $true; path = ${psStr(params.output_path)} } | ConvertTo-Json -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
