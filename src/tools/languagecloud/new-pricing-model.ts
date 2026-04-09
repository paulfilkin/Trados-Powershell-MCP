import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psJsonParam, roundPricingDecimals } from "../../executors/common.js";

export function registerNewPricingModelTool(server: McpServer): void {
  server.tool(
    "lc_new_pricing_model",
    "Create a new pricing model in Language Cloud.",
    {
      name:                             z.string().describe("Pricing model name"),
      currency_code:                    z.string().describe("Currency code (e.g. EUR, USD, GBP)"),
      location_id:                      z.string().optional().describe("Location ID"),
      location_name:                    z.string().optional().describe("Location name"),
      description:                      z.string().optional().describe("Description"),
      language_direction_pricing_json:  z.string().optional().describe("JSON array of per-language-direction pricing"),
      additional_costs_json:            z.string().optional().describe("JSON array of project-level additional costs"),
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
          `-name ${psStr(params.name)}`,
          `-currencyCode ${psStr(params.currency_code)}`,
          params.location_id                    ? `-locationId ${psStr(params.location_id)}`                                         : "",
          params.location_name                  ? `-locationName ${psStr(params.location_name)}`                                     : "",
          params.description                    ? `-description ${psStr(params.description)}`                                        : "",
          ldpJson                               ? `-languageDirectionPricing ${psJsonParam(ldpJson)}` : "",
          acJson                                ? `-additionalCosts ${psJsonParam(acJson)}`                    : "",
        ].filter(Boolean).join(" `\n            ");

        const script = `
          $result = New-PricingModel -accessKey $accessKey \`
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
