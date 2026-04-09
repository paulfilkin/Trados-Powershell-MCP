import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerNewGroupTool(server: McpServer): void {
  server.tool(
    "lc_new_group",
    "Create a new group in Language Cloud.",
    {
      name:          z.string().describe("Group name"),
      description:   z.string().optional().describe("Group description"),
      location_id:   z.string().optional().describe("Location ID"),
      location_name: z.string().optional().describe("Location name"),
      role_ids:      z.string().optional().describe("Comma-separated role IDs to assign at the home location"),
      user_ids:      z.string().optional().describe("Comma-separated user IDs to add as members"),
    },
    async (params) => {
      try {
        const optionalArgs = [
          params.description   ? `-description ${psStr(params.description)}`    : "",
          params.location_id   ? `-locationId ${psStr(params.location_id)}`     : "",
          params.location_name ? `-locationName ${psStr(params.location_name)}` : "",
        ].filter(Boolean).join(" `\n            ");

        const roleArg = params.role_ids
          ? `-roleIds @(${params.role_ids.split(",").map(id => psStr(id.trim())).join(", ")})`
          : "";

        const userArg = params.user_ids
          ? `-userIds @(${params.user_ids.split(",").map(id => psStr(id.trim())).join(", ")})`
          : "";

        const script = `
          $result = New-Group -accessKey $accessKey \`
            -name ${psStr(params.name)} \`
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
