import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ps7 } from "../../executors/ps7.js";

export function registerListLlmConfigurationsTool(server: McpServer): void {
  server.tool(
    "lc_list_llm_configurations",
    "List all LLM configurations for the account. " +
    "Each configuration includes the provider type (azureOpenAI or awsBedrock), " +
    "model name, and whether it is the default or active configuration.",
    {},
    async () => {
      try {
        const script = `
          $configs = Get-AllLlmConfigurations -accessKey $accessKey
          @{ llmConfigurations = @($configs) } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
