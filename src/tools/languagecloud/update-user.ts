import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerUpdateUserTool(server: McpServer): void {
  server.tool(
    "lc_update_user",
    "Update an existing user's details. Specify the user by ID or email.",
    {
      user_id:     z.string().optional().describe("User ID"),
      user_email:  z.string().optional().describe("User email (alternative to ID for lookup)"),
      name:        z.string().optional().describe("Display name (service users)"),
      description: z.string().optional().describe("Description (service users)"),
      first_name:  z.string().optional().describe("First name (human users)"),
      last_name:   z.string().optional().describe("Last name (human users)"),
      group_ids:   z.string().optional().describe("Comma-separated group IDs (replaces current assignments)"),
    },
    async (params) => {
      try {
        const userArg = params.user_id
          ? `-userId ${psStr(params.user_id)}`
          : `-userEmail ${psStr(params.user_email ?? "")}`;

        const optionalArgs = [
          params.name        ? `-name ${psStr(params.name)}`               : "",
          params.description ? `-description ${psStr(params.description)}` : "",
          params.first_name  ? `-firstName ${psStr(params.first_name)}`    : "",
          params.last_name   ? `-lastName ${psStr(params.last_name)}`      : "",
        ].filter(Boolean).join(" `\n            ");

        const groupArg = params.group_ids
          ? `-groupIds @(${params.group_ids.split(",").map(id => psStr(id.trim())).join(", ")})`
          : "";

        const script = `
          $result = Update-User -accessKey $accessKey \`
            ${userArg} \`
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
