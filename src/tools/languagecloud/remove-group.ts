import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerRemoveGroupTool(server: McpServer): void {
  server.tool(
    "lc_remove_group",
    "Delete a group from Language Cloud.",
    {
      group_id:   z.string().optional().describe("Group ID"),
      group_name: z.string().optional().describe("Group name"),
    },
    async (params) => {
      try {
        const grpArg = params.group_id
          ? `-groupId ${psStr(params.group_id)}`
          : `-groupName ${psStr(params.group_name ?? "")}`;

        const script = `
          $result = Remove-Group -accessKey $accessKey ${grpArg}
          @{ removed = $true; message = "$result" } | ConvertTo-Json -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
