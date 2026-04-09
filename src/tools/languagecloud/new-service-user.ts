import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerNewServiceUserTool(server: McpServer): void {
  server.tool(
    "lc_new_service_user",
    "Create a new service user for API integrations and automated processes.",
    {
      name:          z.string().describe("Display name for the service user"),
      description:   z.string().optional().describe("Description of the service user's purpose"),
      location_id:   z.string().optional().describe("Location ID"),
      location_name: z.string().optional().describe("Location name"),
      group_ids:     z.string().optional().describe("Comma-separated group IDs"),
    },
    async (params) => {
      try {
        const optionalArgs = [
          params.description   ? `-description ${psStr(params.description)}`    : "",
          params.location_id   ? `-locationId ${psStr(params.location_id)}`     : "",
          params.location_name ? `-locationName ${psStr(params.location_name)}` : "",
        ].filter(Boolean).join(" `\n            ");

        const groupArg = params.group_ids
          ? `-groupIds @(${params.group_ids.split(",").map(id => psStr(id.trim())).join(", ")})`
          : "";

        const script = `
          $result = New-ServiceUser -accessKey $accessKey \`
            -name ${psStr(params.name)} \`
            ${groupArg ? groupArg + " `" : ""}
            ${optionalArgs}
          @{ serviceUser = $result } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
