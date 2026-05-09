#!/usr/bin/env node
/**
 * Clinical Note Co-pilot — MCP server.
 *
 * Exposes the same extraction + ICD + PHI logic the web app uses, over MCP
 * stdio. Drop into Claude Desktop / Cursor / Code via the config block in the
 * project README.
 *
 * Tools:
 *   - extract_soap_note(text)
 *   - suggest_icd_codes(soap)
 *   - redact_phi(text)
 *   - extract_full(text)  — composite, the headline tool
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { extractSoapNote, suggestIcdCodes, redactPhi, extractFull } from "./tools.js";
import { SOAPNote } from "../../lib/schemas.js";

const server = new Server(
  {
    name: "clinical-note-copilot",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "extract_soap_note",
      description:
        "Extract a structured SOAP note from raw clinical text. Returns subjective, objective, assessment, and plan sections with confidence levels and source-span citations.",
      inputSchema: {
        type: "object",
        required: ["text"],
        properties: { text: { type: "string", description: "Raw clinical note text." } },
      },
    },
    {
      name: "suggest_icd_codes",
      description:
        "Given a structured SOAP note, propose ICD-10 codes the coder should consider, each with confidence and supporting evidence.",
      inputSchema: {
        type: "object",
        required: ["soap"],
        properties: {
          soap: {
            type: "object",
            description: "A SOAP note in the schema returned by extract_soap_note.",
          },
        },
      },
    },
    {
      name: "redact_phi",
      description:
        "Detect PHI/PII spans in clinical text using a hybrid regex + LLM pass. Returns the redacted text plus the spans (type and character offsets).",
      inputSchema: {
        type: "object",
        required: ["text"],
        properties: { text: { type: "string", description: "Raw clinical text." } },
      },
    },
    {
      name: "extract_full",
      description:
        "Composite tool: SOAP extraction + ICD-10 suggestions + PHI redaction + uncertainty flags. The headline tool — call this for end-to-end processing of a clinical note.",
      inputSchema: {
        type: "object",
        required: ["text"],
        properties: { text: { type: "string", description: "Raw clinical note text." } },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    if (name === "extract_soap_note") {
      const text = String((args as { text: string }).text ?? "");
      if (!text) throw new Error("text is required");
      const soap = await extractSoapNote(text);
      return {
        content: [{ type: "text", text: JSON.stringify(soap, null, 2) }],
      };
    }
    if (name === "suggest_icd_codes") {
      const soap = SOAPNote.parse((args as { soap: unknown }).soap);
      const codes = await suggestIcdCodes(soap);
      return {
        content: [{ type: "text", text: JSON.stringify(codes, null, 2) }],
      };
    }
    if (name === "redact_phi") {
      const text = String((args as { text: string }).text ?? "");
      if (!text) throw new Error("text is required");
      const result = await redactPhi(text);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
    if (name === "extract_full") {
      const text = String((args as { text: string }).text ?? "");
      if (!text) throw new Error("text is required");
      const result = await extractFull(text);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Keep stderr (stdout is reserved for MCP protocol).
  process.stderr.write("[clinical-note-copilot mcp] ready on stdio\n");
}

main().catch((e) => {
  process.stderr.write(`[clinical-note-copilot mcp] fatal: ${e}\n`);
  process.exit(1);
});
