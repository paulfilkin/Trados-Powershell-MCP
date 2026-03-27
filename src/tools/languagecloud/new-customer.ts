import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerNewCustomerTool(server: McpServer): void {
  server.tool(
    "lc_new_customer",
    "Create a new customer in Language Cloud. " +
    "The customer is scoped to a location - use lc_list_locations to find the parent location ID. " +
    "Creating a customer also creates a corresponding child location (may take a few seconds to appear).",
    {
      name:        z.string().describe("Customer name"),
      location_id: z.string().describe("Parent location ID (from lc_list_locations)"),
    },
    async (params) => {
      try {
        const script = `
          $customer = New-Customer \`
            -accessKey    $accessKey \`
            -customerName ${psStr(params.name)} \`
            -locationId   ${psStr(params.location_id)}

          @{ customer = $customer } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
