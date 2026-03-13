import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { studioPs } from "../../executors/studio-ps.js";
import { psPath, psStr } from "../../executors/common.js";

export function registerNewTmTool(server: McpServer): void {
  server.tool(
    "studio_new_tm",
    "Create a new file-based translation memory (.sdltm).",
    {
      path: z.string().describe("Full path for the new .sdltm file"),
      source_language: z.string().describe("Source language code (e.g. en-GB)"),
      target_language: z.string().describe("Target language code (e.g. de-DE)"),
      description: z.string().optional().describe("Optional description"),
    },
    async (params) => {
      try {
        const description = params.description ?? "";

        const script = `
          $tm = New-FileBasedTM \`
            -filePath          ${psPath(params.path)} \`
            -sourceLanguageName ${psStr(params.source_language)} \`
            -targetLanguageName ${psStr(params.target_language)} \`
            -description        ${psStr(description)}

          if ($null -eq $tm) {
            throw "Failed to create TM - check that the language codes are valid."
          }

          [PSCustomObject]@{
            name           = $tm.Name
            path           = $tm.FilePath
            sourceLanguage = $tm.LanguageDirection.SourceLanguage.Name
            targetLanguage = $tm.LanguageDirection.TargetLanguage.Name
          } | ConvertTo-Json -Compress
        `;

        const result = await studioPs(script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
