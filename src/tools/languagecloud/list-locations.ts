import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ps7 } from "../../executors/ps7.js";

export function registerListLocationsTool(server: McpServer): void {
  server.tool(
    "lc_list_locations",
    "List all locations in Language Cloud. Locations are the organisational hierarchy. " +
    "Use this to discover location IDs for lc_new_project, lc_new_tm, lc_new_termbase, " +
    "lc_new_project_template, and lc_new_customer.",
    {},
    async () => {
      try {
        const script = `
          $locations = Get-AllLocations -accessKey $accessKey
          @{ locations = @($locations) } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
