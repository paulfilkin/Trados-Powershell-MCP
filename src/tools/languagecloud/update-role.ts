import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerUpdateRoleTool(server: McpServer): void {
  server.tool(
    "lc_update_role",
    "Update an existing role's name, description, or permissions.",
    {
      role_id:     z.string().optional().describe("Role ID"),
      role_name:   z.string().optional().describe("Role name (alternative to ID for lookup)"),
      name:        z.string().optional().describe("New name"),
      description: z.string().optional().describe("New description"),
      permissions: z.string().optional().describe("Comma-separated permission names (replaces current permissions)"),
    },
    async (params) => {
      try {
        const roleArg = params.role_id
          ? `-roleId ${psStr(params.role_id)}`
          : `-roleName ${psStr(params.role_name ?? "")}`;

        const optionalArgs = [
          params.name        ? `-name ${psStr(params.name)}`               : "",
          params.description ? `-description ${psStr(params.description)}` : "",
        ].filter(Boolean).join(" `\n            ");

        const permArg = params.permissions
          ? `-permissions @(${params.permissions.split(",").map(p => psStr(p.trim())).join(", ")})`
          : "";

        const script = `
          $result = Update-Role -accessKey $accessKey \`
            ${roleArg} \`
            ${permArg ? permArg + " `" : ""}
            ${optionalArgs}
          @{ role = $result } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
