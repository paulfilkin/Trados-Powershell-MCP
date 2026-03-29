import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { studioPs } from "../../executors/studio-ps.js";
import { psPath, psStr } from "../../executors/common.js";

export function registerExportPackageTool(server: McpServer): void {
  server.tool(
    "studio_export_package",
    "Create a translation package (.sdlppx) from a Trados Studio project for sending to a linguist. " +
    "If target_language is omitted, one package per target language is created in the output folder.",
    {
      project_path: z
        .string()
        .describe("Full path to the project folder (directory containing the .sdlproj file)"),
      output_path: z
        .string()
        .describe(
          "Destination path for the .sdlppx file, or a folder path when exporting all languages"
        ),
      target_language: z
        .string()
        .optional()
        .describe("Export one target language only (e.g. de-DE)"),
      include_tm: z
        .boolean()
        .optional()
        .describe("Include project TM in package (default: false)"),
    },
    async (params) => {
      try {
        const includeTm = params.include_tm === true;
        const langFilter = params.target_language
          ? `| Where-Object { $_.IsoAbbreviation -eq ${psStr(params.target_language)} }`
          : "";

        const script = `
          $project = Get-Project -projectDestinationPath ${psPath(params.project_path)}

          if ($null -eq $project) {
            throw "No project found at: ${psPath(params.project_path)}"
          }

          $info        = $project.GetProjectInfo()
          $targetLangs = @($info.TargetLanguages ${langFilter})

          if ($targetLangs.Count -eq 0) {
            throw "No matching target language found in project"
          }

          $today = Get-Date

          # Build package options directly (Get-PackageOptions is not exported from the module)
          $packageOptions = New-Object Sdl.ProjectAutomation.Core.ProjectPackageCreationOptions
          $packageOptions.IncludeAutoSuggestDictionaries      = $false
          $packageOptions.IncludeMainTranslationMemories      = ${includeTm ? "$true" : "$false"}
          $packageOptions.IncludeTermbases                    = $false
          $packageOptions.ProjectTranslationMemoryOptions     = [Sdl.ProjectAutomation.Core.ProjectTranslationMemoryPackageOptions]::UseExisting
          $packageOptions.RecomputeAnalysisStatistics         = $false
          $packageOptions.RemoveAutomatedTranslationProviders = $true

          $packages = $targetLangs | ForEach-Object {
            $lang      = Get-Language $_.IsoAbbreviation
            $taskFiles = Get-TaskFileInfoFiles -language $lang -project $project

            if ($null -eq $taskFiles -or $taskFiles.Count -eq 0) {
              return [PSCustomObject]@{
                language = $_.DisplayName
                code     = $_.IsoAbbreviation
                status   = "Skipped - no task files"
                path     = $null
              }
            }

            # Determine the output path for this language
            $outPath = ${psPath(params.output_path)}
            if ($targetLangs.Count -gt 1) {
              $outPath = Join-Path $outPath ($_.IsoAbbreviation + ".sdlppx")
            }
            if (-not $outPath.EndsWith(".sdlppx")) {
              $outPath = $outPath + ".sdlppx"
            }

            $task    = $project.CreateManualTask("Translate", "MCP", ($today.AddDays(1)), $taskFiles)
            $package = $project.CreateProjectPackage($task.Id, "package", "Created by MCP", $packageOptions, $null, $null)
            $project.SavePackageAs($package.PackageId, $outPath)

            [PSCustomObject]@{
              language = $_.DisplayName
              code     = $_.IsoAbbreviation
              status   = "Created"
              path     = $outPath
            }
          }

          @{ packages = @($packages) } | ConvertTo-Json -Depth 4 -Compress
        `;

        const result = await studioPs(script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
