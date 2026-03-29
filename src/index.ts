import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readdirSync, existsSync } from "fs";
import { join } from "path";
import { registerStudioTools } from "./tools/studio/register.js";
import { registerGroupShareTools } from "./tools/groupshare/register.js";
import { registerLanguageCloudTools } from "./tools/languagecloud/register.js";
import { setActiveGsCredential, setActiveLcCredential } from "./state.js";

const server = new McpServer({
  name: "trados-powershell",
  version: "1.3.0",
});

// Studio: register unconditionally - toolkit will fail at runtime if not licensed
registerStudioTools(server);

// GroupShare: register if credential store has XMLs, or if raw vars are all set
const gsStore = process.env.GS_CREDENTIAL_STORE;
const gsStoreReady = gsStore && existsSync(gsStore) &&
  readdirSync(gsStore).filter(f => f.toLowerCase().endsWith(".xml")).length > 0;
const gsRawReady = process.env.GS_SERVER_URL && process.env.GS_USERNAME && process.env.GS_PASSWORD;

if (gsStoreReady || gsRawReady) {
  if (gsStoreReady) {
    const xmlFiles = readdirSync(gsStore!).filter(f => f.toLowerCase().endsWith(".xml"));
    if (xmlFiles.length === 1) {
      setActiveGsCredential(join(gsStore!, xmlFiles[0]));
    }
  }
  registerGroupShareTools(server);
}

// Language Cloud: register if credential store has XMLs, or if raw vars are all set
const lcStore = process.env.LC_CREDENTIAL_STORE;
const lcStoreReady = lcStore && existsSync(lcStore) &&
  readdirSync(lcStore).filter(f => f.toLowerCase().endsWith(".xml")).length > 0;
const lcRawReady = process.env.LC_CLIENT_ID && process.env.LC_CLIENT_SECRET && process.env.LC_TENANT_ID;

if (lcStoreReady || lcRawReady) {
  if (lcStoreReady) {
    const xmlFiles = readdirSync(lcStore!).filter(f => f.toLowerCase().endsWith(".xml"));
    if (xmlFiles.length === 1) {
      setActiveLcCredential(join(lcStore!, xmlFiles[0]));
    }
  }
  registerLanguageCloudTools(server);
}

const transport = new StdioServerTransport();
await server.connect(transport);
