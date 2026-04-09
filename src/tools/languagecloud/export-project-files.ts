import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerExportProjectFilesTool(server: McpServer): void {
  server.tool(
    "lc_export_project_files",
    "Trigger an export of target files from a Language Cloud project as a ZIP archive. " +
    "Returns an export ID - poll with lc_get_project_files_export_status until complete, " +
    "then download with lc_save_project_files.",
    {
      project_id:              z.string().describe("Project ID (from lc_list_projects or lc_get_project)"),
      include_reference_files: z.boolean().optional().describe("Include reference files in the export (default: false)"),
      include_versions:        z.string().optional().describe("Target file versions to include (default: currentVersion)"),
      target_languages:        z.string().optional().describe("Comma-separated target language codes to filter the export"),
      download_flat:           z.boolean().optional().describe("Flatten folder structure in the ZIP (default: false)"),
    },
    async (params) => {
      try {
        const optionalArgs = [
          params.include_reference_files !== undefined
            ? `-includeReferenceFiles $${params.include_reference_files}`
            : "",
          params.include_versions
            ? `-includeVersions ${psStr(params.include_versions)}`
            : "",
          params.download_flat !== undefined
            ? `-downloadFlat $${params.download_flat}`
            : "",
        ].filter(Boolean).join(" `\n            ");

        const targetArg = params.target_languages
          ? `-targetLanguages @(${params.target_languages.split(",").map(l => psStr(l.trim())).join(", ")})`
          : "";

        const script = `
          $result = Export-ProjectFiles \`
            -accessKey $accessKey \`
            -projectId ${psStr(params.project_id)} \`
            ${targetArg ? targetArg + " `" : ""}
            ${optionalArgs}

          @{ export = $result } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
