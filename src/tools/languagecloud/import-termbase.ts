import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psPath, psStr } from "../../executors/common.js";

export function registerImportTermbaseTool(server: McpServer): void {
  server.tool(
    "lc_import_termbase",
    "Import a termbase file into a Language Cloud termbase. " +
    "Provide either termbase_name or termbase_id.",
    {
      termbase_name: z.string().optional().describe("Termbase name"),
      termbase_id:   z.string().optional().describe("Termbase ID"),
      import_file_path: z.string().describe("Path to the import file (TBX or other supported format)"),
    },
    async (params) => {
      try {
        if (!params.termbase_name && !params.termbase_id) {
          throw new Error("Provide either termbase_name or termbase_id");
        }

        const idOrName = params.termbase_id ?? params.termbase_name!;

        const script = `
          Import-Termbase \`
            -accessKey             $accessKey \`
            -termbaseIdOrName      ${psStr(idOrName)} \`
            -importFilePath        ${psPath(params.import_file_path)}

          @{ success = $true; termbase = ${psStr(idOrName)}; file = ${psPath(params.import_file_path)} } \`
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
