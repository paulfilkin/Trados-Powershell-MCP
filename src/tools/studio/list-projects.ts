import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { studioPs } from "../../executors/studio-ps.js";

const STATUS_MAP: Record<string, string> = {
  InProgress: "InProgress",
  Completed:  "Completed",
  Archived:   "Archived",
};

export function registerListProjectsTool(server: McpServer): void {
  server.tool(
    "studio_list_projects",
    "List all Trados Studio file-based projects registered for the current user. " +
    "Returns name, status, source language, target languages, creation date, and .sdlproj path.",
    {
      status: z
        .enum(["InProgress", "Completed", "Archived"])
        .optional()
        .describe("Filter by project status"),
    },
    async (params) => {
      try {
        // STUDIO_VERSION is e.g. "Studio18" - strip the prefix to get the folder number.
        const studioVersion = process.env.STUDIO_VERSION ?? "Studio18";
        const versionNumber = studioVersion.replace(/^Studio/i, "");

        const statusFilter = params.status
          ? `| Where-Object { $_.Status -eq ${JSON.stringify(STATUS_MAP[params.status])} }`
          : "";

        // NOTE: The exact XML structure of projects.xml may need adjusting against a
        // real installation. Field names here are based on the SDL SDK documentation:
        //   Root element:  ArrayOfProjectListItemInfo
        //   Each item:     ProjectListItemInfo
        //     .ProjectInfo.Name
        //     .ProjectInfo.Status          ("InProgress" | "Completed" | "Archived")
        //     .ProjectInfo.SourceLanguageCode
        //     .ProjectInfo.TargetLanguageCodes.string[]
        //     .ProjectInfo.CreatedAt
        //     .PhysicalPath                (full path to .sdlproj)
        const script = `
          $versionNumber = '${versionNumber}'
          $xmlPath = Join-Path $env:APPDATA "Trados\\Trados Studio\\$versionNumber\\projects.xml"

          if (-not (Test-Path $xmlPath)) {
            @{ projects = @() } | ConvertTo-Json -Compress
            return
          }

          [xml]$xml = Get-Content -Path $xmlPath -Encoding UTF8
          $items = $xml.ArrayOfProjectListItemInfo.ProjectListItemInfo

          if ($null -eq $items) {
            @{ projects = @() } | ConvertTo-Json -Compress
            return
          }

          # Normalise to array in case there is only one item (PowerShell unwraps single-element arrays)
          $items = @($items)

          $results = $items ${statusFilter} | ForEach-Object {
            $info = $_.ProjectInfo
            $targets = if ($info.TargetLanguageCodes -and $info.TargetLanguageCodes.string) {
              @($info.TargetLanguageCodes.string)
            } else {
              @()
            }
            [PSCustomObject]@{
              name            = $info.Name
              status          = $info.Status
              sourceLanguage  = $info.SourceLanguageCode
              targetLanguages = $targets
              createdAt       = $info.CreatedAt
              path            = $_.PhysicalPath
            }
          }

          @{ projects = @($results) } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await studioPs(script, { bare: true });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
