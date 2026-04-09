import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psPath } from "../../executors/common.js";

export function registerSendZipFileTool(server: McpServer): void {
  server.tool(
    "lc_send_zip_file",
    "Upload a ZIP archive for server-side file extraction. " +
    "Poll with lc_get_zip_file_status for completion and to retrieve extracted file IDs.",
    {
      file_path: z.string().describe("Local path to the .zip file"),
    },
    async (params) => {
      try {
        const script = `
          $result = Send-ZipFile -accessKey $accessKey -filePath ${psPath(params.file_path)}
          @{ zipFile = $result } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
