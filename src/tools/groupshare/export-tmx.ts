import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psPath } from "../../executors/common.js";

export function registerExportTmxTool(server: McpServer): void {
  server.tool(
    "gs_export_tmx",
    "Export a server-based GroupShare translation memory to TMX. " +
    "The output path must end in .tmx.gz - the toolkit enforces this extension.",
    {
      tm_name:         z.string().describe("TM name"),
      output_path:     z.string().describe("Destination path - must end in .tmx.gz"),
      source_language: z.string().describe("Source language code (e.g. en-GB)"),
      target_language: z.string().describe("Target language code (e.g. de-DE)"),
    },
    async (params) => {
      try {
        if (!params.output_path.endsWith(".tmx.gz")) {
          return {
            content: [{ type: "text", text: "Error: output_path must end in .tmx.gz" }],
            isError: true,
          };
        }

        const script = `
          $tm = Get-TM -authorizationToken $authToken -tmName ${psStr(params.tm_name)}
          if ($null -eq $tm) {
            throw "TM not found: ${params.tm_name}"
          }
          Export-TMX \`
            -authorizationToken $authToken \`
            -tm                 $tm \`
            -sourceLanguage     ${psStr(params.source_language)} \`
            -targetLanguage     ${psStr(params.target_language)} \`
            -outputPath         ${psPath(params.output_path)}
          @{ exported = $true; path = ${psStr(params.output_path)} } | ConvertTo-Json -Compress
        `;

        const result = await ps7("groupshare", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
