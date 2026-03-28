import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { studioPs } from "../../executors/studio-ps.js";
import { psPath } from "../../executors/common.js";

const STUDIO_VERSION = process.env.STUDIO_VERSION ?? "Studio18";

// Map STUDIO_VERSION env var to the folder name used on disk
function studioFolderName(): string {
  switch (STUDIO_VERSION) {
    case "Studio17": return "Studio 2022";
    case "Studio18": return "Studio 2024";
    default: return "Studio 2024";
  }
}

export function registerListTmsTool(server: McpServer): void {
  server.tool(
    "studio_list_tms",
    "List file-based TMs (.sdltm files). When a folder path is provided, searches that folder. " +
    "When no folder is provided, auto-discovers TMs from three sources: " +
    "(1) the TranslationMemoryRepository.xml in the Studio AppData folder, " +
    "(2) the default Translation Memories folder under Documents, " +
    "(3) the OneDrive Documents equivalent. " +
    "Results are deduplicated by full path. If the TM you need is not found, provide its folder path explicitly.",
    {
      folder: z
        .string()
        .optional()
        .describe("Folder path to search. If omitted, auto-discovers from standard locations."),
      recursive: z
        .boolean()
        .optional()
        .describe("Search subfolders when a folder is provided (default: false)"),
    },
    async (params) => {
      try {
        if (params.folder) {
          // Explicit folder mode - original behaviour
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
        }

        // Auto-discovery mode
        const studioFolder = studioFolderName();

        const script = `
          $allPaths = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
          $sources  = @{}

          # --- Source 1: TranslationMemoryRepository.xml ---
          $repoXmlPath = Join-Path $env:LOCALAPPDATA "Trados\\Trados Studio\\${studioFolder}\\TranslationMemoryRepository.xml"
          if (Test-Path $repoXmlPath) {
            [xml]$repoXml = Get-Content -Path $repoXmlPath -Encoding UTF8
            $repoXml.TranslationMemoryRepository.TranslationMemories.TranslationMemory | ForEach-Object {
              $p = $_.path
              if ($p -and (Test-Path $p)) {
                if ($allPaths.Add($p)) {
                  $sources[$p] = 'repository'
                }
              }
            }
          }

          # --- Source 2: Default Documents folder ---
          $docsFolder = [Environment]::GetFolderPath('MyDocuments')
          $defaultTmFolder = Join-Path $docsFolder "${studioFolder}\\Translation Memories"
          if (Test-Path $defaultTmFolder) {
            Get-ChildItem -Path $defaultTmFolder -Filter '*.sdltm' -Recurse -File | ForEach-Object {
              if ($allPaths.Add($_.FullName)) {
                $sources[$_.FullName] = 'documents'
              }
            }
          }

          # --- Source 3: OneDrive Documents folder ---
          $oneDriveDocs = Join-Path $env:USERPROFILE "OneDrive\\Documents"
          if (Test-Path $oneDriveDocs) {
            $oneDriveTmFolder = Join-Path $oneDriveDocs "${studioFolder}\\Translation Memories"
            if (Test-Path $oneDriveTmFolder) {
              Get-ChildItem -Path $oneDriveTmFolder -Filter '*.sdltm' -Recurse -File | ForEach-Object {
                if ($allPaths.Add($_.FullName)) {
                  $sources[$_.FullName] = 'onedrive'
                }
              }
            }
          }

          if ($allPaths.Count -eq 0) {
            @{
              tms     = @()
              message = 'No TMs found in standard locations. Provide a folder path to search a specific location.'
              searched = @($repoXmlPath, $defaultTmFolder, (Join-Path $oneDriveDocs "${studioFolder}\\Translation Memories"))
            } | ConvertTo-Json -Depth 3 -Compress
            return
          }

          # Open each TM to read language info
          $results = $allPaths | ForEach-Object {
            $tmPath = $_
            $sourceLang = $null
            $targetLang = $null

            try {
              $tm = Open-FileBasedTM $tmPath
              if ($null -ne $tm) {
                $sourceLang = $tm.LanguageDirection.SourceLanguage.Name
                $targetLang = $tm.LanguageDirection.TargetLanguage.Name
              }
            } catch {
              # TM file may be corrupt or locked - skip language info
            }

            [PSCustomObject]@{
              name           = [System.IO.Path]::GetFileNameWithoutExtension($tmPath)
              sourceLanguage = $sourceLang
              targetLanguage = $targetLang
              path           = $tmPath
              source         = $sources[$tmPath]
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
