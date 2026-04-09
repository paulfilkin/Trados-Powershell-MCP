import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psJsonParam } from "../../executors/common.js";

export function registerUpdateWorkflowTool(server: McpServer): void {
  server.tool(
    "lc_update_workflow",
    "Update a workflow's name, description, and/or task configurations.",
    {
      workflow_id:               z.string().describe("Workflow ID (from lc_list_workflows)"),
      name:                      z.string().optional().describe("New name"),
      description:               z.string().optional().describe("New description"),
      task_configurations_json:  z.string().optional().describe("JSON array string defining task configurations"),
    },
    async (params) => {
      try {
        const args = [
          `-workflowId ${psStr(params.workflow_id)}`,
          params.name                     ? `-name ${psStr(params.name)}`                                        : "",
          params.description              ? `-description ${psStr(params.description)}`                          : "",
          params.task_configurations_json ? `-taskConfigurations ${psJsonParam(params.task_configurations_json)}` : "",
        ].filter(Boolean).join(" `\n            ");

        const script = `
          $result = Update-Workflow -accessKey $accessKey \`
            ${args}
          @{ workflow = $result } | ConvertTo-Json -Depth 10 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
