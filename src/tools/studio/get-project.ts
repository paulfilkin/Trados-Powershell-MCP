import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { studioPs } from "../../executors/studio-ps.js";
import { psPath } from "../../executors/common.js";

export function registerGetProjectTool(server: McpServer): void {
  server.tool(
    "studio_get_project",
    "Open an existing Trados Studio project and return its details - language pairs, " +
    "bilingual files, and TM assignments. Optionally includes pre-computed analysis statistics.",
    {
      project_path: z
        .string()
        .describe("Full path to the project folder (directory containing the .sdlproj file)"),
      include_statistics: z
        .boolean()
        .optional()
        .describe("Include analysis statistics (default: false)"),
    },
    async (params) => {
      try {
        const includeStats = params.include_statistics === true;

        const script = `
          $project = Get-Project -projectDestinationPath ${psPath(params.project_path)}

          if ($null -eq $project) {
            throw "No project found at: ${psPath(params.project_path)}"
          }

          $info = $project.GetProjectInfo()

          $targetLanguages = $info.TargetLanguages | ForEach-Object {
            $lang = $_
            $files = $project.GetTargetLanguageFiles($lang) | ForEach-Object {
              [PSCustomObject]@{
                name   = $_.Name
                role   = $_.Role.ToString()
                status = $_.AnalysisStatistics.Status.ToString()
                path   = $_.LocalFilePath
              }
            }
            [PSCustomObject]@{
              language = $lang.DisplayName
              code     = $lang.IsoAbbreviation
              files    = @($files)
            }
          }

          $tmConfig = $project.GetTranslationProviderConfiguration()
          $tms = $tmConfig.Entries | ForEach-Object {
            [PSCustomObject]@{
              uri = $_.MainTranslationProvider.Uri.ToString()
            }
          }

          $result = [PSCustomObject]@{
            name             = $info.Name
            description      = $info.Description
            status           = $info.Status.ToString()
            sourceLanguage   = $info.SourceLanguage.DisplayName
            sourceLanguageCode = $info.SourceLanguage.IsoAbbreviation
            projectFolder    = $info.LocalProjectFolder
            dueDate          = if ($info.DueDate) { $info.DueDate.ToString("o") } else { $null }
            targetLanguages  = @($targetLanguages)
            translationProviders = @($tms)
          }

          ${includeStats ? `
          $stats = $project.GetProjectStatistics()
          $result | Add-Member -NotePropertyName statistics -NotePropertyValue (
            $stats.TargetLanguageStatistics | ForEach-Object {
              [PSCustomObject]@{
                language  = $_.TargetLanguage.DisplayName
                code      = $_.TargetLanguage.IsoAbbreviation
                exact     = [PSCustomObject]@{ words = $_.AnalysisStatistics.Exact.Words; segments = $_.AnalysisStatistics.Exact.Segments }
                new       = [PSCustomObject]@{ words = $_.AnalysisStatistics.New.Words; segments = $_.AnalysisStatistics.New.Segments }
                fuzzy     = [PSCustomObject]@{ words = $_.AnalysisStatistics.Fuzzy.Words; segments = $_.AnalysisStatistics.Fuzzy.Segments }
                repeated  = [PSCustomObject]@{ words = $_.AnalysisStatistics.Repeated.Words; segments = $_.AnalysisStatistics.Repeated.Segments }
              }
            }
          )` : ""}

          $result | ConvertTo-Json -Depth 6 -Compress
        `;

        const result = await studioPs(script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
