import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerCopyTmTool(server: McpServer): void {
  server.tool(
    "lc_copy_tm",
    "Duplicate a translation memory. " +
    "The copy is created in the same location with ' (copy)' appended to the name.",
    {
      tm_id:   z.string().optional().describe("TM ID"),
      tm_name: z.string().optional().describe("TM name"),
    },
    async (params) => {
      try {
        const tmArg = params.tm_id
          ? `-translationMemoryId ${psStr(params.tm_id)}`
          : `-translationMemoryName ${psStr(params.tm_name ?? "")}`;

        const script = `
          $result = Copy-TranslationMemory -accessKey $accessKey ${tmArg}
          @{ copied = $true; result = $result } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
