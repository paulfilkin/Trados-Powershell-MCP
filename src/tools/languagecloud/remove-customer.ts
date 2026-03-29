import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerRemoveCustomerTool(server: McpServer): void {
  server.tool(
    "lc_remove_customer",
    "Delete a customer from Language Cloud. " +
    "Child customers must be removed before their parent. " +
    "Any resources (projects, TMs, termbases) still associated with the customer's location must be removed first.",
    {
      customer_id: z.string().describe("Customer ID (from lc_list_customers)"),
    },
    async (params) => {
      try {
        const script = `
          $result = Remove-Customer -accessKey $accessKey -customerId ${psStr(params.customer_id)}
          @{ removed = $true; customerId = ${psStr(params.customer_id)}; message = "$result" } | ConvertTo-Json -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
