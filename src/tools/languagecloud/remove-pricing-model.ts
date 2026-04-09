import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerRemovePricingModelTool(server: McpServer): void {
  server.tool(
    "lc_remove_pricing_model",
    "Delete a pricing model from Language Cloud. " +
    "The pricing model must not be in use by any active project template.",
    {
      pricing_model_id: z.string().describe("Pricing model ID (from lc_list_pricing_models)"),
    },
    async (params) => {
      try {
        const script = `
          $result = Remove-PricingModel -accessKey $accessKey -pricingModelId ${psStr(params.pricing_model_id)}
          @{ removed = $true; pricingModelId = ${psStr(params.pricing_model_id)}; message = "$result" } | ConvertTo-Json -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
