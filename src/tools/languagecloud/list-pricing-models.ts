import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ps7 } from "../../executors/ps7.js";

export function registerListPricingModelsTool(server: McpServer): void {
  server.tool(
    "lc_list_pricing_models",
    "List all pricing models in Language Cloud.",
    {},
    async () => {
      try {
        const script = `
          $models = Get-AllPricingModels -accessKey $accessKey
          @{ pricingModels = @($models) } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
