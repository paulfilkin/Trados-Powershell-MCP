import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerNewTmTool(server: McpServer): void {
  server.tool(
    "gs_new_tm",
    "Create a new server-based translation memory on GroupShare. " +
    "Use gs_list_tms to discover existing container names and organisations.",
    {
      name:              z.string().describe("TM name"),
      container_name:    z.string().describe("Container name"),
      organization_name: z.string().describe("Owner organisation name"),
      source_language:   z.string().describe("Source language code (e.g. en-GB)"),
      target_language:   z.string().describe("Target language code (e.g. de-DE)"),
      description:       z.string().optional().describe("Optional description"),
    },
    async (params) => {
      try {
        const descArg = params.description
          ? `-description ${psStr(params.description)}`
          : "";

        const script = `
          $container = Get-Container    -authorizationToken $authToken -containerName     ${psStr(params.container_name)}
          $org       = Get-Organization -authorizationToken $authToken -organizationName  ${psStr(params.organization_name)}

          if ($null -eq $container) {
            throw "Container not found: ${params.container_name}"
          }
          if ($null -eq $org) {
            throw "Organisation not found: ${params.organization_name}"
          }

          $langDirs = Get-LanguageDirections \`
            -authorizationToken $authToken \`
            -source             ${psStr(params.source_language)} \`
            -target             @(${psStr(params.target_language)})

          $tm = New-TM \`
            -authorizationToken $authToken \`
            -tmName             ${psStr(params.name)} \`
            -container          $container \`
            -organization       $org \`
            -languageDirections $langDirs \`
            ${descArg}

          @{ tm = $tm } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("groupshare", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
