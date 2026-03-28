import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { studioPs } from "../../executors/studio-ps.js";
import { psPath, psStr } from "../../executors/common.js";

export function registerNewProjectTool(server: McpServer): void {
  server.tool(
    "studio_new_project",
    "Create a new Trados Studio file-based project from a folder of source files. " +
    "The output_path must be an empty or non-existent directory. " +
    "Returns the project name and project folder path.",
    {
      name: z.string().describe("Project name"),
      output_path: z.string().describe("Empty or non-existent folder where the project will be created"),
      source_language: z.string().describe("Source language code (e.g. en-GB)"),
      target_languages: z.string().describe("Comma-separated target language codes (e.g. de-DE,fr-FR)"),
      source_folder: z.string().describe("Folder containing the source files to add to the project"),
      tm_path: z.string().optional().describe("Path to a .sdltm file to assign to the project"),
      due_date: z.string().optional().describe("Due date (e.g. 2025-12-31)"),
      description: z.string().optional().describe("Project description"),
      task_sequence: z.enum([
        "Prepare without project TM",
        "Prepare",
        "Analyse only",
        "Translate only",
        "Pseudo-Translate Round Trip",
      ]).optional().describe("Task sequence to run on creation (default: Prepare without project TM)"),
    },
    async (params) => {
      try {
        const targetLangs = params.target_languages
          .split(",")
          .map(l => l.trim())
          .filter(l => l.length > 0);

        const targetLangsPs = targetLangs.map(l => psStr(l)).join(",");
        const taskSequence = params.task_sequence ?? "Prepare without project TM";

        const tmBlock = params.tm_path
          ? `-pathToTms @(${psPath(params.tm_path)})`
          : "";

        const dueDateBlock = params.due_date
          ? `-projectDueDate ${psStr(params.due_date)}`
          : "";

        const descriptionBlock = params.description
          ? `-projectDescription ${psStr(params.description)}`
          : "";

        const script = `
          # Pre-flight: refuse to proceed if output_path exists and is not empty.
          # An occupied directory causes New-Project to recurse into nested sub-projects.
          $outputPath = ${psPath(params.output_path)}
          if (Test-Path $outputPath) {
            $existingItems = @(Get-ChildItem -Path $outputPath -ErrorAction SilentlyContinue)
            if ($existingItems.Count -gt 0) {
              throw "output_path '$outputPath' already exists and contains $($existingItems.Count) item(s). Provide an empty or non-existent directory - passing a non-empty folder causes recursive project creation."
            }
          }

          New-Project \`
            -projectName        ${psStr(params.name)} \`
            -projectDestination $outputPath \`
            -sourceFilesFolder  ${psPath(params.source_folder)} \`
            -sourceLanguage     ${psStr(params.source_language)} \`
            -targetLanguages    @(${targetLangsPs}) \`
            -taskSequenceName   ${psStr(taskSequence)} \`
            ${tmBlock} \`
            ${dueDateBlock} \`
            ${descriptionBlock}

          # Open the project to confirm it was created and return its details
          $projFile = Get-ChildItem -Path $outputPath -Filter '*.sdlproj' -File | Select-Object -First 1 -ExpandProperty FullName
          if (-not $projFile) {
            throw "Project creation appeared to succeed but no .sdlproj file found in: $outputPath"
          }
          $project = [Sdl.ProjectAutomation.FileBased.FileBasedProject]::new($projFile)

          $info = $project.GetProjectInfo()

          [PSCustomObject]@{
            name          = $info.Name
            projectFolder = $info.LocalProjectFolder
            sourceLanguage = $info.SourceLanguage.IsoAbbreviation
            targetLanguages = @($info.TargetLanguages | ForEach-Object { $_.IsoAbbreviation })
            status        = $info.Status.ToString()
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
