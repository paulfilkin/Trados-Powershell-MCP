import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { studioPs } from "../../executors/studio-ps.js";
import { psPath, psStr } from "../../executors/common.js";

export function registerAnalyzeTool(server: McpServer): void {
  server.tool(
    "studio_analyze",
    "Return word count statistics for a Trados Studio project by match category " +
    "(exact, new, fuzzy, repeated, locked). Reads pre-computed statistics from the project - " +
    "the Analysis task must have been run first. Use before quoting or planning.",
    {
      project_path: z
        .string()
        .describe("Full path to the project folder (directory containing the .sdlproj file)"),
      target_language: z
        .string()
        .optional()
        .describe("Limit to one target language code (e.g. de-DE). Returns all languages if omitted."),
    },
    async (params) => {
      try {
        const langFilter = params.target_language
          ? `| Where-Object { $_.TargetLanguage.IsoAbbreviation -eq ${psStr(params.target_language)} }`
          : "";

        const script = `
          $project = Get-Project -projectDestinationPath ${psPath(params.project_path)}

          if ($null -eq $project) {
            throw "No project found at: ${psPath(params.project_path)}"
          }

          $stats = $project.GetProjectStatistics()

          $results = $stats.TargetLanguageStatistics ${langFilter} | ForEach-Object {
            $a = $_.AnalysisStatistics
            [PSCustomObject]@{
              language = $_.TargetLanguage.DisplayName
              code     = $_.TargetLanguage.IsoAbbreviation
              exact    = [PSCustomObject]@{
                segments   = $a.Exact.Segments
                words      = $a.Exact.Words
                characters = $a.Exact.Characters
              }
              new      = [PSCustomObject]@{
                segments   = $a.New.Segments
                words      = $a.New.Words
                characters = $a.New.Characters
              }
              repeated = [PSCustomObject]@{
                segments   = $a.Repeated.Segments
                words      = $a.Repeated.Words
                characters = $a.Repeated.Characters
              }
              locked   = [PSCustomObject]@{
                segments   = $a.Locked.Segments
                words      = $a.Locked.Words
                characters = $a.Locked.Characters
              }
              fuzzy    = @($a.Fuzzy | ForEach-Object {
                [PSCustomObject]@{
                  band       = $_.Band.ToString()
                  segments   = $_.Segments
                  words      = $_.Words
                  characters = $_.Characters
                }
              })
            }
          }

          @{ statistics = @($results) } | ConvertTo-Json -Depth 6 -Compress
        `;

        const result = await studioPs(script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
