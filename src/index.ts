import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { fetchMedications, normalizeMedications } from "./fhir.js";


// --- Create server instance ---
const server = new McpServer({
    name: "violet-fhir",
    version: "1.0.0"
})


server.registerTool(
  'get_medications',
  {
    description: 'A read-only function that fetches a synthetic patient profile via FHIR API and return their medications. Four results: ok: the fetch returned data, empty: the patients med list is empty, unavailable: the server is currently unavailable, bad_request: the server sent a malformed request',
    inputSchema: z.object({
      patientId: z.string().min(1).describe('Patient identifier for FHIR data'),
    }),
  },
  async ({ patientId }) => {
    const result = await fetchMedications({ patientId });

    switch (result.kind) {
      case 'ok':
        return {
            content: [{
                type: 'text',
                text: result.bundle.entry?.map((m) => (
                    normalizeMedications(m)
                ))
            }],
            isError?: false
        }
      case 'empty':
        return {
            content: [{
                type: 'text',
                text: `No medications available for ${result.patientId}`
            }],
            isError: false
        }
      case 'unavailable':
        return {
            content: [{
                type: 'text',
                text: result.status
            }],
            isError: true
        }
      case 'bad_request':
        return {
            content: [{
                type: 'text',
                text: result.status
            }],
            isError: true
        }
    }
  }
);