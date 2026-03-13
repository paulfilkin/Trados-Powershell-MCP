# Trados PowerShell MCP Server

An MCP (Model Context Protocol) server that lets Claude Desktop manage Trados translation projects through natural language. Instead of clicking through menus in Trados Studio, GroupShare, or Language Cloud, you can describe what you want to do and Claude handles it.

---

## What it does

The server exposes three groups of tools, one for each RWS PowerShell toolkit:

**Trados Studio** (`studio_*`)
Work with file-based projects on your local machine - create projects, run analysis, pre-translate against TMs, export and import translation packages, and manage file-based translation memories.

**GroupShare** (`gs_*`)
Manage projects on a GroupShare server - list and create projects, export and import packages, get analysis reports, download project files, manage translation memories, and handle users, roles, and organisations.

**Language Cloud** (`lc_*`)
Automate Language Cloud workflows - create and manage projects, translation memories, and termbases, and browse available templates, workflows, translation engines, and users.

You don't need all three. The server detects which tools to register based on what you configure at installation time, so Claude Desktop only shows you what is actually usable in your environment.

---

## What you need

**Always required**
- [Node.js](https://nodejs.org/) LTS (v20 or later) on your PATH
- [Claude Desktop](https://claude.ai/download) (latest version)

**For Studio tools**
- Trados Studio Professional 2022 or 2024 (Freelance/Starter do not include the Project Automation API)
- [Trados Studio PowerShell Toolkit](https://github.com/RWS/Sdl-studio-powershell-toolkit) installed locally

**For GroupShare tools**
- Access to a GroupShare server
- PowerShell 7 (`winget install Microsoft.PowerShell`)
- [GroupShare API PowerShell Toolkit](https://github.com/RWS/groupshare-api-powershell-toolkit) installed locally

**For Language Cloud tools**
- An RWS Language Cloud or Trados Enterprise account with an application configured (Client ID, Client Secret, Tenant ID - found under Account → Integrations → Applications)
- PowerShell 7
- [Language Cloud PowerShell Toolkit](https://github.com/RWS/language-cloud-powershell-toolkit) installed locally

---

## Installation

### Option 1 - Install the pre-built extension

1. Download the latest `.mcpb` extension from [multifarious.filkin.com](https://multifarious.filkin.com/product/trados-powershell-mcp/).
2. In Claude Desktop, go to **Settings → Extensions → Advanced settings → Install Extension** and select the downloaded file.
3. Fill in the configuration form. You only need to complete the fields for the tool groups you want to use - leave everything else blank.

### Option 2 - Build from source

```bash
git clone https://github.com/paulfilkin/Trados-Powershell-MCP.git
cd Trados-Powershell-MCP
npm install
npm run build
```

To pack your own `.mcpb`:

```bash
mcpb pack . trados-powershell-mcp-1.3.0.mcpb
```

Then install the resulting `.mcpb` file via Claude Desktop as above.

### Configuration fields

| Field | What to enter |
|---|---|
| Studio Version | `Studio17` for Trados 2022, `Studio18` for Trados 2024 |
| Studio Toolkit Modules Path | Path to your Studio toolkit modules folder. Leave blank if installed in the default `Documents\WindowsPowerShell\Modules` location. |
| GroupShare Toolkit Modules Path | Path to your GroupShare toolkit modules folder. Leave blank if using the default `Documents\PowerShell\Modules` location. |
| Language Cloud Toolkit Modules Path | Path to your Language Cloud toolkit modules folder. Leave blank if using the default `Documents\PowerShell\Modules` location. |
| GroupShare Credential Store | Path to a folder containing your GroupShare credential files (see below). |
| GroupShare Server URL | GroupShare server URL - only needed if not using a credential store. |
| GroupShare Username | Only needed if not using a credential store. |
| GroupShare Password | Only needed if not using a credential store. |
| Language Cloud Credential Store | Path to a folder containing your Language Cloud credential files (see below). |
| Language Cloud Client ID | Only needed if not using a credential store. |
| Language Cloud Client Secret | Only needed if not using a credential store. |
| Language Cloud Tenant ID | Only needed if not using a credential store. |

---

## Credentials

For GroupShare and Language Cloud, the recommended approach is to use a **credential store** - a folder containing encrypted credential files rather than entering passwords directly into the configuration form.

Each credential file is encrypted with DPAPI (Windows Data Protection API) and can only be decrypted by the Windows user who created it. You create one file per environment (e.g. one for your production GroupShare server, one for staging) and point the credential store field at the folder containing them. If you work with multiple servers or tenants, you can switch between credentials at runtime by asking Claude to list and select a credential.

For step-by-step instructions on creating credential files, see the [Technical Design Document](TradosPowershell-MCP-Server-TDD.md#73-creating-credential-files).

---

## Example conversations

```
"Create a Trados Studio project called Q3 Newsletter from the files in C:\Source.
English to German. Use the marketing TM."

"Analyse it and tell me the new word count."

"Pre-translate it then export a package."
```

```
"What projects are currently in progress on GroupShare?"

"Get me the analysis report for the Annual Report project."

"The return package from the linguist is at C:\Returns\Q3.sdlrpx - import it."

"Mark it as completed."
```

```
"What project templates do we have in Language Cloud?"

"Create a new project called Investor Pack using the Legal template. Due Friday at 17:00."

"Export the Legal TM to TMX so I can back it up."
```

---

## Technical detail

For full technical documentation - architecture, executor design, all tool parameters, security notes, and build instructions - see the [Technical Design Document](TradosPowershell-MCP-Server-TDD.md).

---

## Support

Use [GitHub Discussions](https://github.com/paulfilkin/Trados-Powershell-MCP/discussions) for questions, ideas, and general conversation about the project. If you've found a bug or want to request a feature, open an [issue](https://github.com/paulfilkin/Trados-Powershell-MCP/issues) instead.

---

## Contributing

Contributions are welcome. Fork the repository, make your changes, and open a pull request. For anything significant it's worth opening an issue first to discuss the approach.

The [Technical Design Document](TradosPowershell-MCP-Server-TDD.md) is the reference for how the server is structured and how the three tool groups are implemented.

---

## Licence

This project is released under the [Unlicense](https://unlicense.org/) - public domain, no restrictions.

The RWS PowerShell toolkits that this server invokes are separate projects licensed under the Apache License 2.0. They are not bundled here and must be installed independently.
