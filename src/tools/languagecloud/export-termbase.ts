import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psPath, psStr } from "../../executors/common.js";

export function registerExportTermbaseTool(server: McpServer): void {
  server.tool(
    "lc_export_termbase",
    "Export a Language Cloud termbase to a file. " +
    "Provide either termbase_name or termbase_id.",
    {
      termbase_name: z.string().optional().describe("Termbase name"),
      termbase_id:   z.string().optional().describe("Termbase ID"),
      output_path:   z.string().describe("Destination path for the exported file"),
    },
    async (params) => {
      try {
        if (!params.termbase_name && !params.termbase_id) {
          throw new Error("Provide either termbase_name or termbase_id");
        }

        const idOrName = params.termbase_id ?? params.termbase_name!;

        const script = `
          Export-Termbase \`
            -accessKey        $accessKey \`
            -termbaseIdOrName ${psStr(idOrName)} \`
            -outputFilePath   ${psPath(params.output_path)}

          @{ success = $true; termbase = ${psStr(idOrName)}; outputPath = ${psPath(params.output_path)} } \`
            | ConvertTo-Json -Compress
        `;
        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
