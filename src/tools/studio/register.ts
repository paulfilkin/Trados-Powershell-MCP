import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerListProjectsTool }  from "./list-projects.js";
import { registerGetProjectTool }    from "./get-project.js";
import { registerNewProjectTool }    from "./new-project.js";
import { registerRemoveProjectTool } from "./remove-project.js";
import { registerAnalyzeTool }       from "./analyze.js";
import { registerExportPackageTool } from "./export-package.js";
import { registerImportPackageTool } from "./import-package.js";
import { registerPretranslateTool }  from "./pretranslate.js";
import { registerListTmsTool }       from "./list-tms.js";
import { registerNewTmTool }         from "./new-tm.js";
import { registerImportTmxTool }     from "./import-tmx.js";
import { registerExportTmxTool }     from "./export-tmx.js";

export function registerStudioTools(server: McpServer): void {
  registerListProjectsTool(server);
  registerGetProjectTool(server);
  registerNewProjectTool(server);
  registerRemoveProjectTool(server);
  registerAnalyzeTool(server);
  registerExportPackageTool(server);
  registerImportPackageTool(server);
  registerPretranslateTool(server);
  registerListTmsTool(server);
  registerNewTmTool(server);
  registerImportTmxTool(server);
  registerExportTmxTool(server);
}
