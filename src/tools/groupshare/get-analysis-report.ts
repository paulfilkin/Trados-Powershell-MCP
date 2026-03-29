import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psPath } from "../../executors/common.js";

export function registerGetAnalysisReportTool(server: McpServer): void {
  server.tool(
    "gs_get_analysis_report",
    "Save and return the analysis report for a GroupShare project. " +
    "Optionally filter to a single target language.",
    {
      project_id:    z.string().optional().describe("Project ID (preferred)"),
      project_name:  z.string().optional().describe("Project name (used if ID not provided)"),
      output_path:   z.string().describe("Destination path for the report file"),
      language_code: z.string().optional().describe("Target language code; all languages if omitted"),
    },
    async (params) => {
      try {
        const lookup = params.project_id
          ? `$project = Get-Project -authorizationToken $authToken -projectId ${psStr(params.project_id)}`
          : `$project = Get-Project -authorizationToken $authToken -projectName ${psStr(params.project_name ?? "")}`;

        const langArg = params.language_code
          ? `-languageCode ${psStr(params.language_code)}`
          : "";

        const script = `
          ${lookup}
          if ($null -eq $project) {
            throw "Project not found"
          }
          $report = Get-AnalysisReports \`
            -authorizationToken $authToken \`
            -project            $project \`
            -outputFile         ${psPath(params.output_path)} \`
            ${langArg}
          @{ report = $report; path = ${psStr(params.output_path)} } | ConvertTo-Json -Depth 8 -Compress
        `;

        const result = await ps7("groupshare", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
