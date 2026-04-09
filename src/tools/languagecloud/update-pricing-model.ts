import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psJsonParam, roundPricingDecimals } from "../../executors/common.js";

export function registerUpdatePricingModelTool(server: McpServer): void {
  server.tool(
    "lc_update_pricing_model",
    "Update an existing pricing model in Language Cloud.",
    {
      pricing_model_id:                 z.string().describe("Pricing model ID (from lc_list_pricing_models)"),
      name:                             z.string().optional().describe("New name"),
      description:                      z.string().optional().describe("New description"),
      currency_code:                    z.string().optional().describe("New currency code"),
      language_direction_pricing_json:  z.string().optional().describe("JSON array of per-language-direction pricing"),
      additional_costs_json:            z.string().optional().describe("JSON array of additional costs"),
    },
    async (params) => {
      try {
        // Round pricing rate values to 3dp (LC API constraint)
        const ldpJson = params.language_direction_pricing_json
          ? JSON.stringify(roundPricingDecimals(JSON.parse(params.language_direction_pricing_json)))
          : undefined;
        const acJson = params.additional_costs_json
          ? JSON.stringify(roundPricingDecimals(JSON.parse(params.additional_costs_json)))
          : undefined;

        const args = [
          `-pricingModelId ${psStr(params.pricing_model_id)}`,
          params.name                           ? `-name ${psStr(params.name)}`                                                      : "",
          params.description                    ? `-description ${psStr(params.description)}`                                        : "",
          params.currency_code                  ? `-currencyCode ${psStr(params.currency_code)}`                                     : "",
          ldpJson                               ? `-languageDirectionPricing ${psJsonParam(ldpJson)}` : "",
          acJson                                ? `-additionalCosts ${psJsonParam(acJson)}`                    : "",
        ].filter(Boolean).join(" `\n            ");

        const script = `
          $result = Update-PricingModel -accessKey $accessKey \`
            ${args}
          @{ pricingModel = $result } | ConvertTo-Json -Depth 8 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
