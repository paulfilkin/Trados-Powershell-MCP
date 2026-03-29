import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { studioPs } from "../../executors/studio-ps.js";
import { psPath, psStr } from "../../executors/common.js";

export function registerPretranslateTool(server: McpServer): void {
  server.tool(
    "studio_pretranslate",
    "Run pre-translation on a Trados Studio project against its assigned TMs. " +
    "The minimum match threshold is taken from the project's TM configuration. " +
    "Returns the task status per target language.",
    {
      project_path: z
        .string()
        .describe("Full path to the project folder (directory containing the .sdlproj file)"),
      target_language: z
        .string()
        .optional()
        .describe("Limit to one target language code (e.g. de-DE). Runs all languages if omitted."),
    },
    async (params) => {
      try {
        const langFilter = params.target_language
          ? `| Where-Object { $_.IsoAbbreviation -eq ${psStr(params.target_language)} }`
          : "";

        const script = `
          $project = Get-Project -projectDestinationPath ${psPath(params.project_path)}

          if ($null -eq $project) {
            throw "No project found at: ${psPath(params.project_path)}"
          }

          $info = $project.GetProjectInfo()
          $targetLanguages = @($info.TargetLanguages ${langFilter})

          if ($targetLanguages.Count -eq 0) {
            throw "No matching target language found in project"
          }

          $translateTask = "Sdl.ProjectApi.AutomaticTasks.Translate"

          $results = $targetLanguages | ForEach-Object {
            $lang = $_
            $targetFiles = $project.GetTargetLanguageFiles($lang)
            $guids = $targetFiles | ForEach-Object { $_.Id }
            $task = $project.RunAutomaticTask($guids, $translateTask)

            [PSCustomObject]@{
              language = $lang.DisplayName
              code     = $lang.IsoAbbreviation
              status   = $task.Status.ToString()
              messages = @($task.Messages | ForEach-Object { $_.Message })
            }
          }

          $project.Save()

          @{ results = @($results) } | ConvertTo-Json -Depth 4 -Compress
        `;

        const result = await studioPs(script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
