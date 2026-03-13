import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psPath } from "../../executors/common.js";

export function registerNewProjectTool(server: McpServer): void {
  server.tool(
    "lc_new_project",
    "Create a new Language Cloud project. " +
    "Use lc_list_project_templates to find template names, lc_list_workflows for workflow names, " +
    "and lc_list_translation_engines for engine names.",
    {
      name:               z.string().describe("Project name"),
      due_date:           z.string().describe("Due date (YYYY-MM-DD)"),
      due_time:           z.string().describe("Due time (HH:MM, e.g. 17:00)"),
      files_path:         z.string().describe("Path to the folder containing source files"),
      template_name:      z.string().optional().describe("Project template name or ID"),
      source_language:    z.string().optional().describe("Source language code - overrides template if provided"),
      target_languages:   z.string().optional().describe("Comma-separated target language codes - overrides template if provided"),
      translation_engine: z.string().optional().describe("Translation engine name or ID"),
      workflow:           z.string().optional().describe("Workflow name or ID"),
      description:        z.string().optional().describe("Project description"),
    },
    async (params) => {
      try {
        const optionalArgs = [
          params.template_name      ? `-projectTemplateIdOrName   ${psStr(params.template_name)}`      : "",
          params.source_language    ? `-sourceLanguage             ${psStr(params.source_language)}`    : "",
          params.translation_engine ? `-translationEngineIdOrName  ${psStr(params.translation_engine)}` : "",
          params.workflow           ? `-workflowIdOrName           ${psStr(params.workflow)}`           : "",
          params.description        ? `-description                ${psStr(params.description)}`        : "",
        ].filter(Boolean).join(" `\n            ");

        const targetArg = params.target_languages
          ? `-targetLanguages @(${params.target_languages.split(",").map(l => psStr(l.trim())).join(", ")})`
          : "";

        const script = `
          $project = New-Project \`
            -accessKey   $accessKey \`
            -projectName ${psStr(params.name)} \`
            -dueDate     ${psStr(params.due_date)} \`
            -dueTime     ${psStr(params.due_time)} \`
            -filesPath   ${psPath(params.files_path)} \`
            ${targetArg ? targetArg + " \`" : ""}
            ${optionalArgs}

          @{ project = $project } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
