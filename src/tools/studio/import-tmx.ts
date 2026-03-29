import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { studioPs } from "../../executors/studio-ps.js";
import { psPath } from "../../executors/common.js";

export function registerImportTmxTool(server: McpServer): void {
  server.tool(
    "studio_import_tmx",
    "Import a TMX file into an existing file-based translation memory (.sdltm).",
    {
      tm_path: z.string().describe("Path to the .sdltm file"),
      tmx_path: z.string().describe("Path to the .tmx file to import"),
    },
    async (params) => {
      try {
        const script = `
          $tmPath  = ${psPath(params.tm_path)}
          $tmxPath = ${psPath(params.tmx_path)}

          if (-not (Test-Path $tmPath)) {
            throw "TM not found: $tmPath"
          }
          if (-not (Test-Path $tmxPath)) {
            throw "TMX file not found: $tmxPath"
          }

          Import-Tmx -importFilePath $tmxPath -tmPath $tmPath

          [PSCustomObject]@{
            status  = "Imported"
            tmPath  = $tmPath
            tmxPath = $tmxPath
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
