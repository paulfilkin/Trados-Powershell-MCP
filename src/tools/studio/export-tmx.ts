import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { studioPs } from "../../executors/studio-ps.js";
import { psPath } from "../../executors/common.js";

export function registerExportTmxTool(server: McpServer): void {
  server.tool(
    "studio_export_tmx",
    "Export a file-based translation memory (.sdltm) to TMX format.",
    {
      tm_path: z.string().describe("Path to the .sdltm file"),
      output_path: z.string().describe("Destination path for the .tmx file"),
    },
    async (params) => {
      try {
        const script = `
          $tmPath     = ${psPath(params.tm_path)}
          $outputPath = ${psPath(params.output_path)}

          if (-not (Test-Path $tmPath)) {
            throw "TM not found: $tmPath"
          }

          Export-Tmx -exportFilePath $outputPath -tmPath $tmPath

          [PSCustomObject]@{
            status     = "Exported"
            tmPath     = $tmPath
            outputPath = $outputPath
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
