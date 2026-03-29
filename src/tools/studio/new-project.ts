import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { studioPs } from "../../executors/studio-ps.js";
import { psPath, psStr } from "../../executors/common.js";

export function registerNewProjectTool(server: McpServer): void {
  server.tool(
    "studio_new_project",
    "Create a new Trados Studio file-based project. " +
    "BEFORE calling this tool you MUST: " +
    "(1) Ask the user for the project name and project location (output_path) if not already provided. " +
    "Suggest a project name based on the source filename. " +
    "Call studio_list_projects to discover common project locations and suggest one. " +
    "(2) If a TM is mentioned by name, call studio_list_tms first (with no folder argument) to find its path " +
    "using case-insensitive substring matching. " +
    "(3) If no TM is specified, call studio_list_tms to check for TMs matching the language pair and suggest them. " +
    "source_path accepts either a single file or a folder. When a single file is provided, only that file " +
    "is added to the project - not the entire contents of its parent folder. " +
    "If output_path already contains files, a subfolder named after the project is created automatically. " +
    "A project template (.sdltpl) can be provided via template_path. When a template is used, " +
    "source_language and target_languages are optional as the template defines them.",
    {
      name: z.string().describe("Project name"),
      output_path: z.string().describe("Folder where the project will be created. If non-empty, a subfolder named after the project is created inside it."),
      source_path: z.string().describe("Path to a single source file OR a folder of source files"),
      source_language: z.string().optional().describe("Source language code (e.g. en-GB). Required unless a template is provided."),
      target_languages: z.string().optional().describe("Comma-separated target language codes (e.g. de-DE,fr-FR). Required unless a template is provided."),
      template_path: z.string().optional().describe("Path to a project template (.sdltpl). When provided, source_language and target_languages are optional."),
      tm_path: z.string().optional().describe("Path to a .sdltm file to assign to the project. Use studio_list_tms to find TMs by name."),
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
        // Validate: either template or explicit languages must be provided
        if (!params.template_path && (!params.source_language || !params.target_languages)) {
          return {
            content: [{ type: "text", text: "Error: source_language and target_languages are required when no template_path is provided." }],
            isError: true,
          };
        }

        const taskSequence = params.task_sequence ?? "Prepare without project TM";

        // Build optional language params (only when explicitly provided)
        const sourceLangBlock = params.source_language
          ? `-sourceLanguage ${psStr(params.source_language)}`
          : "";

        let targetLangsBlock = "";
        if (params.target_languages) {
          const targetLangs = params.target_languages
            .split(",")
            .map(l => l.trim())
            .filter(l => l.length > 0);
          const targetLangsPs = targetLangs.map(l => psStr(l)).join(",");
          targetLangsBlock = `-targetLanguages @(${targetLangsPs})`;
        }

        const templateBlock = params.template_path
          ? `-projectReference ${psPath(params.template_path)}`
          : "";

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
          # --- Resolve source_path: file or folder ---
          $sourcePath = ${psPath(params.source_path)}
          $stagingFolder = $null

          if (-not (Test-Path $sourcePath)) {
            throw "Source path not found: $sourcePath"
          }

          if (Test-Path $sourcePath -PathType Leaf) {
            # Single file - create a temp staging folder containing only this file
            $stagingFolder = Join-Path $env:TEMP "trados-mcp-staging-$([guid]::NewGuid().ToString('N'))"
            New-Item -Path $stagingFolder -ItemType Directory -Force | Out-Null
            Copy-Item -Path $sourcePath -Destination $stagingFolder -Force
            $srcFolder = $stagingFolder
          } else {
            $srcFolder = $sourcePath
          }

          # --- Resolve output_path: create subfolder if non-empty ---
          $outputPath = ${psPath(params.output_path)}
          if (Test-Path $outputPath) {
            $existingItems = @(Get-ChildItem -Path $outputPath -ErrorAction SilentlyContinue)
            if ($existingItems.Count -gt 0) {
              # Non-empty directory - create a subfolder named after the project
              $outputPath = Join-Path $outputPath ${psStr(params.name)}
              if (Test-Path $outputPath) {
                $subItems = @(Get-ChildItem -Path $outputPath -ErrorAction SilentlyContinue)
                if ($subItems.Count -gt 0) {
                  throw "Project subfolder '$outputPath' already exists and contains $($subItems.Count) item(s). Provide an empty location or remove the existing subfolder."
                }
              } else {
                New-Item -Path $outputPath -ItemType Directory -Force | Out-Null
              }
            }
          } else {
            # Create the output directory - New-Project requires it to exist.
            New-Item -Path $outputPath -ItemType Directory -Force | Out-Null
          }

          try {
            $result = New-Project \`
              -projectName        ${psStr(params.name)} \`
              -projectDestination $outputPath \`
              -sourceFilesFolder  $srcFolder \`
              ${sourceLangBlock} \`
              ${targetLangsBlock} \`
              -taskSequenceName   ${psStr(taskSequence)} \`
              ${templateBlock} \`
              ${tmBlock} \`
              ${dueDateBlock} \`
              ${descriptionBlock}
          } finally {
            # Clean up staging folder if we created one
            if ($null -ne $stagingFolder -and (Test-Path $stagingFolder)) {
              Remove-Item -Path $stagingFolder -Recurse -Force -ErrorAction SilentlyContinue
            }
          }

          # New-Project does not throw on failure - it returns a report.
          # Check for the .sdlproj file to confirm success.
          $projFile = Get-ChildItem -Path $outputPath -Filter '*.sdlproj' -File -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
          if (-not $projFile) {
            # Surface whatever New-Project returned so the error is visible.
            $detail = if ($null -ne $result) { $result | Out-String } else { '(no output from New-Project)' }
            throw "Project creation failed. New-Project output: $detail"
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
