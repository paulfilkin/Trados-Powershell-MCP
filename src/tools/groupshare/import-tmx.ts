import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psPath } from "../../executors/common.js";

export function registerImportTmxTool(server: McpServer): void {
  server.tool(
    "gs_import_tmx",
    "Import a TMX file into a server-based GroupShare translation memory.",
    {
      tm_name:         z.string().describe("TM name"),
      tmx_path:        z.string().describe("Path to the .tmx file"),
      source_language: z.string().describe("Source language code (e.g. en-GB)"),
      target_language: z.string().describe("Target language code (e.g. de-DE)"),
    },
    async (params) => {
      try {
        const script = `
          $tm = Get-TM -authorizationToken $authToken -tmName ${psStr(params.tm_name)}
          if ($null -eq $tm) {
            throw "TM not found: ${params.tm_name}"
          }
          Import-TMX \`
            -authorizationToken $authToken \`
            -tm                 $tm \`
            -sourceLanguage     ${psStr(params.source_language)} \`
            -targetLanguage     ${psStr(params.target_language)} \`
            -tmxPath            ${psPath(params.tmx_path)}
          @{ imported = $true; tmName = ${psStr(params.tm_name)} } | ConvertTo-Json -Compress
        `;

        const result = await ps7("groupshare", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
