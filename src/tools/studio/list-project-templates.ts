import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { studioPs } from "../../executors/studio-ps.js";

export function registerListProjectTemplatesTool(server: McpServer): void {
  server.tool(
    "studio_list_project_templates",
    "List all project templates registered in Trados Studio. " +
    "Returns name, file path, language directions, default project location, and task sequence for each template. " +
    "Use this to discover templates before calling studio_new_project with a template_path.",
    {},
    async () => {
      try {
        const script = `
          [DependencyResolver.ReflectionHelper]::CallEnsurePluginRegistryIsCreated(
            [Sdl.ProjectAutomation.FileBased.FileBasedProject])

          $app = [Sdl.ProjectApi.ApplicationFactory]::CreateApplication()
          $provider = $app.AllProjectsProviders[0]
          $templates = $app.GetProjectsProvider($provider, $null).ProjectTemplates

          $results = $templates | ForEach-Object {
            $langDirs = @($_.LanguageDirections | ForEach-Object {
              [PSCustomObject]@{
                sourceLanguage = $_.SourceLanguage.IsoAbbreviation
                targetLanguage = $_.TargetLanguage.IsoAbbreviation
              }
            })

            [PSCustomObject]@{
              name            = $_.Name
              filePath        = $_.FilePath
              description     = $_.Description
              projectLocation = $_.ProjectLocation
              taskSequence    = $_.StartTaskTemplate.ToString()
              languageDirections = $langDirs
            }
          }

          @{ templates = @($results) } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await studioPs(script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
