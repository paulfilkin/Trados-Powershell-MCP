import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { studioPs } from "../../executors/studio-ps.js";
import { psPath } from "../../executors/common.js";

export function registerListTmsTool(server: McpServer): void {
  server.tool(
    "studio_list_tms",
    "List file-based TMs (.sdltm files) found in a specified folder. " +
    "Returns name, source language, target language, and file path.",
    {
      folder: z.string().describe("Folder path to search"),
      recursive: z
        .boolean()
        .optional()
        .describe("Search subfolders (default: false)"),
    },
    async (params) => {
      try {
        const recurse = params.recursive === true ? "-Recurse" : "";

        const script = `
          $folder = ${psPath(params.folder)}

          if (-not (Test-Path $folder)) {
            throw "Folder not found: $folder"
          }

          $files = Get-ChildItem -Path $folder -Filter '*.sdltm' ${recurse} -File

          $results = $files | ForEach-Object {
            $tmPath = $_.FullName
            $tm = Open-FileBasedTM $tmPath
            $sourceLang = $null
            $targetLang = $null

            if ($null -ne $tm) {
              $sourceLang = $tm.LanguageDirection.SourceLanguage.Name
              $targetLang = $tm.LanguageDirection.TargetLanguage.Name
            }

            [PSCustomObject]@{
              name           = $_.BaseName
              sourceLanguage = $sourceLang
              targetLanguage = $targetLang
              path           = $tmPath
            }
          }

          @{ tms = @($results) } | ConvertTo-Json -Depth 3 -Compress
        `;

        const result = await studioPs(script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
