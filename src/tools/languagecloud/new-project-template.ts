import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerNewProjectTemplateTool(server: McpServer): void {
  server.tool(
    "lc_new_project_template",
    "Create a new project template in Language Cloud. " +
    "Use lc_list_locations for location IDs, lc_list_file_type_configurations for file type config names, " +
    "lc_list_translation_engines for engine names, and lc_list_workflows for workflow names.",
    {
      name:                    z.string().describe("Template name"),
      location_id:             z.string().describe("Location ID to scope the template to (from lc_list_locations)"),
      source_language:         z.string().describe("Source language code (e.g. en-US)"),
      target_languages:        z.string().describe("Comma-separated target language codes (e.g. de-DE,fr-FR)"),
      file_type_configuration: z.string().describe("File type configuration name or ID"),
      translation_engine:      z.string().describe("Translation engine name or ID"),
      workflow:                z.string().describe("Workflow name or ID"),
    },
    async (params) => {
      try {
        const targetLangs = params.target_languages
          .split(",")
          .map(l => psStr(l.trim()))
          .join(", ");

        const script = `
          $template = New-ProjectTemplate \`
            -accessKey                      $accessKey \`
            -projectTemplateName            ${psStr(params.name)} \`
            -locationId                     ${psStr(params.location_id)} \`
            -sourceLanguage                 ${psStr(params.source_language)} \`
            -targetLanguages                @(${targetLangs}) \`
            -fileTypeConfigurationIdOrName  ${psStr(params.file_type_configuration)} \`
            -translationEngineIdOrName      ${psStr(params.translation_engine)} \`
            -workflowIdOrName               ${psStr(params.workflow)}

          @{ template = $template } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
