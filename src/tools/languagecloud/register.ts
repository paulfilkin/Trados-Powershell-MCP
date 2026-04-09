import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Existing tools
import { registerListCredentialsTool }              from "./list-credentials.js";
import { registerSetCredentialTool }                from "./set-credential.js";
import { registerListProjectsTool }                 from "./list-projects.js";
import { registerGetProjectTool }                   from "./get-project.js";
import { registerNewProjectTool }                   from "./new-project.js";
import { registerListProjectTemplatesTool }         from "./list-project-templates.js";
import { registerNewProjectTemplateTool }           from "./new-project-template.js";
import { registerRemoveProjectTemplateTool }        from "./remove-project-template.js";
import { registerListTmsTool }                      from "./list-tms.js";
import { registerGetTmTool }                        from "./get-tm.js";
import { registerNewTmTool }                        from "./new-tm.js";
import { registerRemoveTmTool }                     from "./remove-tm.js";
import { registerImportTmTool }                     from "./import-tm.js";
import { registerExportTmTool }                     from "./export-tm.js";
import { registerListLocationsTool }                from "./list-locations.js";
import { registerListCustomersTool }                from "./list-customers.js";
import { registerNewCustomerTool }                  from "./new-customer.js";
import { registerUpdateCustomerTool }               from "./update-customer.js";
import { registerRemoveCustomerTool }               from "./remove-customer.js";
import { registerListWorkflowsTool }                from "./list-workflows.js";
import { registerListTranslationEnginesTool }       from "./list-translation-engines.js";
import { registerListFileTypeConfigurationsTool }   from "./list-file-type-configurations.js";
import { registerListLanguageProcessingRulesTool }  from "./list-language-processing-rules.js";
import { registerListFieldTemplatesTool }            from "./list-field-templates.js";
import { registerListPricingModelsTool }             from "./list-pricing-models.js";
import { registerListScheduleTemplatesTool }         from "./list-schedule-templates.js";
import { registerListSupportedLanguagesTool }        from "./list-supported-languages.js";
import { registerListGroupsTool }                    from "./list-groups.js";
import { registerListTermbasesTool }                from "./list-termbases.js";
import { registerListUsersTool }                    from "./list-users.js";
import { registerNewTermbaseTool }                  from "./new-termbase.js";
import { registerImportTermbaseTool }               from "./import-termbase.js";
import { registerExportTermbaseTool }               from "./export-termbase.js";

// New tools - project file export
import { registerExportProjectFilesTool }            from "./export-project-files.js";
import { registerGetProjectFilesExportStatusTool }   from "./get-project-files-export-status.js";
import { registerSaveProjectFilesTool }              from "./save-project-files.js";

// New tools - task operations
import { registerGetTaskTool }                       from "./get-task.js";
import { registerListAssignedTasksTool }             from "./list-assigned-tasks.js";
import { registerAcceptTaskTool }                    from "./accept-task.js";
import { registerRejectTaskTool }                    from "./reject-task.js";
import { registerCompleteTaskTool }                  from "./complete-task.js";
import { registerReleaseTaskTool }                   from "./release-task.js";
import { registerReclaimTaskTool }                   from "./reclaim-task.js";
import { registerAssignTaskTool }                    from "./assign-task.js";
import { registerSetTaskDeadlinesTool }              from "./set-task-deadlines.js";

// New tools - TU operations
import { registerTranslationLookupTool }             from "./translation-lookup.js";
import { registerConcordanceSearchTool }             from "./concordance-search.js";
import { registerAddTranslationUnitTool }            from "./add-translation-unit.js";
import { registerUpdateTranslationUnitTool }         from "./update-translation-unit.js";

// New tools - file analysis and zip
import { registerRequestFileAnalysisTool }           from "./request-file-analysis.js";
import { registerGetFileAnalysisStatusTool }         from "./get-file-analysis-status.js";
import { registerSendZipFileTool }                   from "./send-zip-file.js";
import { registerGetZipFileStatusTool }              from "./get-zip-file-status.js";

// New tools - engine, workflow, LLM
import { registerUpdateTranslationEngineTool }       from "./update-translation-engine.js";
import { registerUpdateWorkflowTool }                from "./update-workflow.js";
import { registerListLlmConfigurationsTool }         from "./list-llm-configurations.js";

// New tools - pricing models
import { registerNewPricingModelTool }               from "./new-pricing-model.js";
import { registerUpdatePricingModelTool }            from "./update-pricing-model.js";
import { registerRemovePricingModelTool }            from "./remove-pricing-model.js";

// New tools - TM updates
import { registerUpdateTmTool }                      from "./update-tm.js";
import { registerCopyTmTool }                        from "./copy-tm.js";

// New tools - project template update
import { registerUpdateProjectTemplateTool }         from "./update-project-template.js";

// New tools - termbase update
import { registerUpdateTermbaseTool }                from "./update-termbase.js";

// New tools - termbase entries
import { registerNewTermbaseEntryTool }              from "./new-termbase-entry.js";
import { registerListTermbaseEntriesTool }           from "./list-termbase-entries.js";
import { registerGetTermbaseEntryTool }              from "./get-termbase-entry.js";
import { registerUpdateTermbaseEntryTool }           from "./update-termbase-entry.js";
import { registerRemoveTermbaseEntryTool }           from "./remove-termbase-entry.js";
import { registerRemoveAllTermbaseEntriesTool }      from "./remove-all-termbase-entries.js";
import { registerSearchTermbaseTermsTool }           from "./search-termbase-terms.js";

// New tools - termbase templates
import { registerListTermbaseTemplatesTool }          from "./list-termbase-templates.js";
import { registerNewTermbaseTemplateTool }            from "./new-termbase-template.js";
import { registerUpdateTermbaseTemplateTool }         from "./update-termbase-template.js";
import { registerRemoveTermbaseTemplateTool }         from "./remove-termbase-template.js";

// New tools - users
import { registerNewUserTool }                       from "./new-user.js";
import { registerNewServiceUserTool }                from "./new-service-user.js";
import { registerUpdateUserTool }                    from "./update-user.js";
import { registerRemoveUserTool }                    from "./remove-user.js";

// New tools - groups
import { registerNewGroupTool }                      from "./new-group.js";
import { registerUpdateGroupTool }                   from "./update-group.js";
import { registerRemoveGroupTool }                   from "./remove-group.js";

// New tools - roles
import { registerListRolesTool }                     from "./list-roles.js";
import { registerGetRoleTool }                       from "./get-role.js";
import { registerNewRoleTool }                       from "./new-role.js";
import { registerUpdateRoleTool }                    from "./update-role.js";
import { registerRemoveRoleTool }                    from "./remove-role.js";

// New tools - permissions
import { registerListPermissionsTool }               from "./list-permissions.js";

// New tools - applications
import { registerListApplicationsTool }              from "./list-applications.js";
import { registerGetApplicationTool }                from "./get-application.js";
import { registerNewApplicationTool }                from "./new-application.js";
import { registerUpdateApplicationTool }             from "./update-application.js";
import { registerRemoveApplicationTool }             from "./remove-application.js";

export function registerLanguageCloudTools(server: McpServer) {
  // Credentials
  registerListCredentialsTool(server);
  registerSetCredentialTool(server);

  // Projects
  registerListProjectsTool(server);
  registerGetProjectTool(server);
  registerNewProjectTool(server);

  // Project templates
  registerListProjectTemplatesTool(server);
  registerNewProjectTemplateTool(server);
  registerRemoveProjectTemplateTool(server);
  registerUpdateProjectTemplateTool(server);

  // Project file export
  registerExportProjectFilesTool(server);
  registerGetProjectFilesExportStatusTool(server);
  registerSaveProjectFilesTool(server);

  // Task operations
  registerGetTaskTool(server);
  registerListAssignedTasksTool(server);
  registerAcceptTaskTool(server);
  registerRejectTaskTool(server);
  registerCompleteTaskTool(server);
  registerReleaseTaskTool(server);
  registerReclaimTaskTool(server);
  registerAssignTaskTool(server);
  registerSetTaskDeadlinesTool(server);

  // TMs
  registerListTmsTool(server);
  registerGetTmTool(server);
  registerNewTmTool(server);
  registerRemoveTmTool(server);
  registerImportTmTool(server);
  registerExportTmTool(server);
  registerUpdateTmTool(server);
  registerCopyTmTool(server);

  // TU operations
  registerTranslationLookupTool(server);
  registerConcordanceSearchTool(server);
  registerAddTranslationUnitTool(server);
  registerUpdateTranslationUnitTool(server);

  // File analysis and zip
  registerRequestFileAnalysisTool(server);
  registerGetFileAnalysisStatusTool(server);
  registerSendZipFileTool(server);
  registerGetZipFileStatusTool(server);

  // Locations
  registerListLocationsTool(server);

  // Customers
  registerListCustomersTool(server);
  registerNewCustomerTool(server);
  registerUpdateCustomerTool(server);
  registerRemoveCustomerTool(server);

  // Workflows
  registerListWorkflowsTool(server);
  registerUpdateWorkflowTool(server);

  // Translation engines
  registerListTranslationEnginesTool(server);
  registerUpdateTranslationEngineTool(server);

  // LLM configurations
  registerListLlmConfigurationsTool(server);

  // File type configurations
  registerListFileTypeConfigurationsTool(server);

  // Language processing rules
  registerListLanguageProcessingRulesTool(server);

  // Field templates
  registerListFieldTemplatesTool(server);

  // Pricing models
  registerListPricingModelsTool(server);
  registerNewPricingModelTool(server);
  registerUpdatePricingModelTool(server);
  registerRemovePricingModelTool(server);

  // Schedule templates
  registerListScheduleTemplatesTool(server);

  // Supported languages
  registerListSupportedLanguagesTool(server);

  // Groups
  registerListGroupsTool(server);
  registerNewGroupTool(server);
  registerUpdateGroupTool(server);
  registerRemoveGroupTool(server);

  // Termbases
  registerListTermbasesTool(server);
  registerNewTermbaseTool(server);
  registerImportTermbaseTool(server);
  registerExportTermbaseTool(server);
  registerUpdateTermbaseTool(server);

  // Termbase entries
  registerNewTermbaseEntryTool(server);
  registerListTermbaseEntriesTool(server);
  registerGetTermbaseEntryTool(server);
  registerUpdateTermbaseEntryTool(server);
  registerRemoveTermbaseEntryTool(server);
  registerRemoveAllTermbaseEntriesTool(server);
  registerSearchTermbaseTermsTool(server);

  // Termbase templates
  registerListTermbaseTemplatesTool(server);
  registerNewTermbaseTemplateTool(server);
  registerUpdateTermbaseTemplateTool(server);
  registerRemoveTermbaseTemplateTool(server);

  // Users
  registerListUsersTool(server);
  registerNewUserTool(server);
  registerNewServiceUserTool(server);
  registerUpdateUserTool(server);
  registerRemoveUserTool(server);

  // Roles
  registerListRolesTool(server);
  registerGetRoleTool(server);
  registerNewRoleTool(server);
  registerUpdateRoleTool(server);
  registerRemoveRoleTool(server);

  // Permissions
  registerListPermissionsTool(server);

  // Applications
  registerListApplicationsTool(server);
  registerGetApplicationTool(server);
  registerNewApplicationTool(server);
  registerUpdateApplicationTool(server);
  registerRemoveApplicationTool(server);
}
