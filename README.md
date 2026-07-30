# violet-fhir

**Status:** Pre-build — the MCP tool layer is in progress. Nothing here works yet.

## 1. What this is
 
A FHIR data substrate plus a guideline retrieval layer, connected by an agent loop.
 
Two halves:
 
- **Context layer** — an MCP server exposing a FHIR endpoint as deterministic tools. Read-only. This is the foundation everything else sits on.
- **Guideline layer** — retrieval with citations over public clinical practice guidelines. Never sees patient data.
 
The output is always a **cited draft for a pharmacist**, never an assertion and never an action.
 
## 2. Why it exists
  
1. A portfolio artifact that demonstrates MCP, RAG, agent loops, and A2A in a clinical context.
2. VA/DoD Clinical Practice Guidelines are authoritative, freely published documents — and they live as PDFs. A June 2026 VA OIG review of generative AI chat tools in clinical use found that VA does not curate the prompts staff use for clinical care and documentation, with sharing happening informally instead. The demand for AI assistance at the point of care is real and already being met without provenance. [VA OIG 26-00182-140](https://www.vaoig.gov/sites/default/files/reports/2026-06/vaoig-26-00182-140_-_final.pdf)
 
## 3. What this is NOT
 
- **Not clinical decision support.** This is retrieval with provenance. The pharmacist remains the decision-maker; the system's job is to show its work. 
- **Not write-enabled.** Read-only against FHIR. No order placement, no chart write-back, ever.
- **Not PHI-touching in development.** Synthetic data only (SMART sandbox, HAPI public server, Synthea).
- **Not a product.** Portfolio artifact and community contribution. If it becomes a product later, that's a separate decision made on purpose.