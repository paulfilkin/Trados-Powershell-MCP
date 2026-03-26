import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { studioPs } from "../../executors/studio-ps.js";

/** Map STUDIO_VERSION env var (e.g. "Studio18") to the Documents folder name (e.g. "Studio 2024"). */
const VERSION_FOLDER_MAP: Record<string, string> = {
  Studio17: "Studio 2022",
  Studio18: "Studio 2024",
};

const STATUS_MAP: Record<string, string> = {
  InProgress: "Started",
  Completed:  "Completed",
  Archived:   "Archived",
};

export function registerListProjectsTool(server: McpServer): void {
  server.tool(
    "studio_list_projects",
    "List all Trados Studio file-based projects registered for the current user. " +
    "Returns name, status, creation date, and project folder path.",
    {
      status: z
        .enum(["InProgress", "Completed", "Archived"])
        .optional()
        .describe("Filter by project status"),
    },
    async (params) => {
      try {
        const studioVersion = process.env.STUDIO_VERSION ?? "Studio18";
        const folderName = VERSION_FOLDER_MAP[studioVersion] ?? "Studio 2024";

        const statusFilter = params.status
          ? `| Where-Object { $_.ProjectInfo.Status -eq '${STATUS_MAP[params.status]}' }`
          : "";

        const script = `
          $docsFolder  = [Environment]::GetFolderPath('MyDocuments')
          $xmlPath     = Join-Path $docsFolder '${folderName}\\Projects\\projects.xml'

          if (-not (Test-Path $xmlPath)) {
            @{ projects = @() } | ConvertTo-Json -Compress
            return
          }

          [xml]$xml = Get-Content -Path $xmlPath -Encoding UTF8
          $items = $xml.ProjectServer.Projects.ProjectListItem

          if ($null -eq $items) {
            @{ projects = @() } | ConvertTo-Json -Compress
            return
          }

          $items = @($items)
          $projectsFolder = Split-Path $xmlPath

          $results = $items ${statusFilter} | ForEach-Object {
            $info = $_.ProjectInfo
            $projFilePath = $_.ProjectFilePath
            if ([System.IO.Path]::IsPathRooted($projFilePath)) {
              $fullPath = $projFilePath
            } else {
              $fullPath = Join-Path $projectsFolder $projFilePath
            }
            $folderPath = Split-Path $fullPath

            [PSCustomObject]@{
              name      = $info.Name
              status    = $info.Status
              createdAt = $info.CreatedAt
              path      = $folderPath
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
