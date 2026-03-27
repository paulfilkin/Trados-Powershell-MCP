import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerUpdateCustomerTool(server: McpServer): void {
  server.tool(
    "lc_update_customer",
    "Update an existing customer's properties in Language Cloud. " +
    "Currently supports updating the RAG (Red/Amber/Green) status.",
    {
      customer_id: z.string().describe("Customer ID (from lc_list_customers)"),
      rag_status:  z.string().optional().describe("RAG status: red, amber, green"),
    },
    async (params) => {
      try {
        const optionalArgs = [
          params.rag_status ? `-ragStatus ${psStr(params.rag_status)}` : "",
        ].filter(Boolean).join(" ");

        const script = `
          Update-Customer \`
            -accessKey  $accessKey \`
            -customerId ${psStr(params.customer_id)} \`
            ${optionalArgs}

          @{ updated = $true; customerId = ${psStr(params.customer_id)} } | ConvertTo-Json -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
