import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerUpdateProjectTemplateTool(server: McpServer): void {
  server.tool(
    "lc_update_project_template",
    "Update an existing project template's settings in Language Cloud.",
    {
      template_id:             z.string().describe("Project template ID (from lc_list_project_templates)"),
      name:                    z.string().optional().describe("New name"),
      description:             z.string().optional().describe("New description"),
      source_language:         z.string().optional().describe("Source language code"),
      target_languages:        z.string().optional().describe("Comma-separated target language codes"),
      translation_engine:      z.string().optional().describe("Translation engine name or ID"),
      workflow:                z.string().optional().describe("Workflow name or ID"),
      file_type_configuration: z.string().optional().describe("File type configuration name or ID"),
      location_id:             z.string().optional().describe("Location ID"),
    },
    async (params) => {
      try {
        const optionalArgs = [
          params.name                    ? `-name ${psStr(params.name)}`                                          : "",
          params.description             ? `-description ${psStr(params.description)}`                            : "",
          params.source_language         ? `-sourceLanguage ${psStr(params.source_language)}`                     : "",
          params.translation_engine      ? `-translationEngineIdOrName ${psStr(params.translation_engine)}`       : "",
          params.workflow                ? `-workflowIdOrName ${psStr(params.workflow)}`                          : "",
          params.file_type_configuration ? `-fileTypeConfigurationIdOrName ${psStr(params.file_type_configuration)}` : "",
          params.location_id             ? `-locationId ${psStr(params.location_id)}`                             : "",
        ].filter(Boolean).join(" `\n            ");

        const targetArg = params.target_languages
          ? `-targetLanguages @(${params.target_languages.split(",").map(l => psStr(l.trim())).join(", ")})`
          : "";

        const script = `
          Update-ProjectTemplate -accessKey $accessKey \`
            -projectTemplateId ${psStr(params.template_id)} \`
            ${targetArg ? targetArg + " `" : ""}
            ${optionalArgs}
          @{ updated = $true; templateId = ${psStr(params.template_id)} } | ConvertTo-Json -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
