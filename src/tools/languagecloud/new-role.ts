import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerNewRoleTool(server: McpServer): void {
  server.tool(
    "lc_new_role",
    "Create a new custom role with specified permissions. " +
    "Use lc_list_permissions to discover available permission names.",
    {
      name:        z.string().describe("Role name"),
      description: z.string().optional().describe("Role description"),
      permissions: z.string().optional().describe("Comma-separated permission names (use lc_list_permissions to discover)"),
    },
    async (params) => {
      try {
        const optionalArgs = [
          params.description ? `-description ${psStr(params.description)}` : "",
        ].filter(Boolean).join(" ");

        const permArg = params.permissions
          ? `-permissions @(${params.permissions.split(",").map(p => psStr(p.trim())).join(", ")})`
          : "";

        const script = `
          $result = New-Role -accessKey $accessKey \`
            -name ${psStr(params.name)} \`
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
