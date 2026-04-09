import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerGetZipFileStatusTool(server: McpServer): void {
  server.tool(
    "lc_get_zip_file_status",
    "Poll the status of a ZIP file extraction. " +
    "When complete, returns the list of extracted files with their IDs and paths.",
    {
      file_id: z.string().describe("File ID from lc_send_zip_file"),
    },
    async (params) => {
      try {
        const script = `
          $status = Get-ZipFileStatus -accessKey $accessKey -fileId ${psStr(params.file_id)}
          @{ fileStatus = $status } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
