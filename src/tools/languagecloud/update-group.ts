import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerUpdateGroupTool(server: McpServer): void {
  server.tool(
    "lc_update_group",
    "Update an existing group's properties. Specify the group by ID or name.",
    {
      group_id:    z.string().optional().describe("Group ID"),
      group_name:  z.string().optional().describe("Group name (alternative to ID for lookup)"),
      name:        z.string().optional().describe("New name"),
      description: z.string().optional().describe("New description"),
      role_ids:    z.string().optional().describe("Comma-separated role IDs (replaces current assignments)"),
      user_ids:    z.string().optional().describe("Comma-separated user IDs (replaces current membership)"),
    },
    async (params) => {
      try {
        const grpArg = params.group_id
          ? `-groupId ${psStr(params.group_id)}`
          : `-groupName ${psStr(params.group_name ?? "")}`;

        const optionalArgs = [
          params.name        ? `-name ${psStr(params.name)}`               : "",
          params.description ? `-description ${psStr(params.description)}` : "",
        ].filter(Boolean).join(" `\n            ");

        const roleArg = params.role_ids
          ? `-roleIds @(${params.role_ids.split(",").map(id => psStr(id.trim())).join(", ")})`
          : "";

        const userArg = params.user_ids
          ? `-userIds @(${params.user_ids.split(",").map(id => psStr(id.trim())).join(", ")})`
          : "";

        const script = `
          $result = Update-Group -accessKey $accessKey \`
            ${grpArg} \`
            ${roleArg ? roleArg + " `" : ""}
            ${userArg ? userArg + " `" : ""}
            ${optionalArgs}
          @{ group = $result } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
