import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerNewUserTool(server: McpServer): void {
  server.tool(
    "lc_new_user",
    "Create a new human user in Language Cloud. The user receives an invitation email.",
    {
      email:         z.string().describe("User's email address"),
      location_id:   z.string().optional().describe("Location ID"),
      location_name: z.string().optional().describe("Location name"),
      group_ids:     z.string().optional().describe("Comma-separated group IDs to assign the user to"),
    },
    async (params) => {
      try {
        const optionalArgs = [
          params.location_id   ? `-locationId ${psStr(params.location_id)}`     : "",
          params.location_name ? `-locationName ${psStr(params.location_name)}` : "",
        ].filter(Boolean).join(" `\n            ");

        const groupArg = params.group_ids
          ? `-groupIds @(${params.group_ids.split(",").map(id => psStr(id.trim())).join(", ")})`
          : "";

        const script = `
          $result = New-User -accessKey $accessKey \`
            -email ${psStr(params.email)} \`
            ${groupArg ? groupArg + " `" : ""}
            ${optionalArgs}
          @{ user = $result } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
