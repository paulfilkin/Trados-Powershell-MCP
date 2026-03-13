import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerListTmsTool(server: McpServer): void {
  server.tool(
    "gs_list_tms",
    "List translation memories on the GroupShare server. " +
    "If container_name is provided the list is filtered to that container; otherwise all TMs are returned.",
    {
      container_name: z.string().optional().describe("Filter to TMs within a specific container"),
    },
    async (params) => {
      try {
        const script = params.container_name
          ? `
            $container = Get-Container -authorizationToken $authToken -containerName ${psStr(params.container_name)}
            if ($null -eq $container) {
              throw "Container not found: ${params.container_name}"
            }
            $tms = Get-TMsByContainer -authorizationToken $authToken -container $container
            @{ tms = @($tms) } | ConvertTo-Json -Depth 5 -Compress
          `
          : `
            $tms = Get-AllTMs -authorizationToken $authToken
            @{ tms = @($tms) } | ConvertTo-Json -Depth 5 -Compress
          `;

        const result = await ps7("groupshare", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
