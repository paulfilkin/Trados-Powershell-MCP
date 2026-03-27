import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ps7 } from "../../executors/ps7.js";

export function registerListFileTypeConfigurationsTool(server: McpServer): void {
  server.tool(
    "lc_list_file_type_configurations",
    "List all file type configurations in Language Cloud. " +
    "Use this to discover file type configuration names or IDs for lc_new_project.",
    {},
    async () => {
      try {
        const script = `
          $configs = Get-AllFileTypeConfigurations -accessKey $accessKey
          @{ fileTypeConfigurations = @($configs) } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
