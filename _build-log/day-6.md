**Date:** August 12, 2026
**Step:** 2 — Guideline corpus ingested, chunked, embedded
**Status:** Design decisions locked. No ingestion code written yet — starts next session.

---

## 1. CPG source: VA/DoD (confirmed, not just "easier")

Reconsidered ACC/AHA and ADA as alternatives before committing. Ruled them out:

- **ACC/AHA guidelines carry restrictive copyright terms** — AHA's own copyright policy prohibits storing their material "in a retrieval system" or reproducing/distributing it without express permission. That's a direct conflict with a RAG pipeline, not a minor caveat.
- Some individual ACC/AHA content (e.g., certain cholesterol guideline material) has been republished under CC BY-NC licenses, but that's a one-off, not a library-wide policy — would need per-document verification.
- **VA/DoD CPGs are U.S. government work product — public domain.** No permission chain, no redistribution risk. Correct choice for a public GitHub portfolio project, not a workaround.
- Noted for later: **ADA's Standards of Care in Diabetes** is open-access (published annually in *Diabetes Care* under a permissive license) — a viable "society guideline" alternative if that's ever wanted. Verify current terms before use.
- This also reinforces the project's own narrative — the README's "why it exists" section already leans on the VA OIG report gap, which only holds together if the guidelines themselves are VA/DoD.

## 2. First condition: Tobacco Use Treatment (2026)

Chose over CKD (the architecture doc's original running example) because:

- Newest VA/DoD CPG (2026), likely cleanest structure to learn the ingestion pipeline on.
- Lessons from the first pass (chunking, embedding, schema) should generalize to CKD, Lipids, etc. without much rework.
- Tradeoff acknowledged: doesn't exercise the medication-normalization tooling from Step 1 the way CKD would have. Deferred, not abandoned — CKD or Lipids remains the natural second guideline.

## 3. Target document: Provider Summary (not Full CPG)

- Pharmacist instinct: go straight to recommendations, not evidence discussion.
- Matches `query_guideline()`'s actual job — return something citable and specific, not a paragraph needing interpretation.

## 4. Corrected understanding of document structure

Initial assumption (from guideline landing page alone) was that the 32 recommendations map to Module A / Module B. **Wrong** — confirmed by reading the actual PDF:

- **Module A / Module B are a separate 14-step clinical algorithm** (flowchart), unrelated to the recommendations table's organization.
- The 32 recommendations are actually grouped under **10 topic categories**: Treatment Engagement, Pharmacotherapy Interventions, Alternate Tobacco Products, Behavioral Counseling Interventions, Relapse, Not Ready to Quit Population, Treatment Recommendations for Selected Subpopulations, Complementary and Integrative Health Interventions, Neurostimulation Interventions, Interventions Implemented at System-level.
- The **"Category" column is not an evidence grade (A/B)** — every recommendation in this CPG is labeled `Reviewed, New-added`, meaning it tracks provenance (new vs. carried over), not evidence quality. Relevant to metadata schema design.

## 5. Data extraction

- Extracted all 32 recommendations from the Provider Summary PDF text directly into structured JSON (`recNumber`, `topic`, `text`, `strength`, `category`).
- Cross-checked against the guideline's own summary stats (page 17: 7 Strong for / 13 Weak for / 10 Neither for nor against / 2 Weak against) — counts matched exactly.
- **Still needs manual spot-check against source PDF** before treated as fully verified ground truth — automated/assisted extraction is a fast first draft, not a substitute for verification, especially since this data feeds a citation-grounded system.
- Stored at `guidelines/tobacco_cpg.json`.


## 6. Chunk metadata: sidecar, not blob

Weighed embedding `"Rec #4, Strength: Strong, Category: A, [text]"` as one blob vs. embedding clean recommendation text with metadata alongside:

- **Blob risk:** structural labels (strength/category text) dilute the embedding's semantic signal, and it's not filterable — no clean way to query "just Category A" or "just Module A" without re-parsing text after retrieval.
- **Sidecar wins:** embedding stays clean (just the clinical recommendation text), metadata (recNumber, topic, strength, category) rides alongside and comes back with the retrieval result at no extra cost. Also aligns better with the citation verifier's need for structured fields to validate against.
- **Decision: sidecar for all of recNumber, topic, strength, category.** Topic is not folded into the embedded text.

## 8. Storage schema: single `vec0` table

- `sqlite-vec`'s `vec0` virtual tables support metadata/auxiliary columns natively — sidecar doesn't require a separate joined table.
- Given the small corpus size (32 rows), a single `vec0` table with the embedding column plus metadata columns is simpler than vector table + joined companion table. Revisit if/when corpus size or update patterns change that calculus.

## 9. Embedding approach: local, via Transformers.js

- Chose **local embeddings over an API (Voyage, OpenAI)**, partly for the learning value of not relying on high-level API abstractions, partly because it fits the project's "nothing leaves the boundary" ethos even though this data isn't sensitive.
- **Package: `@huggingface/transformers`** — not `@xenova/transformers`, which is deprecated (Xenova joined Hugging Face; the package moved to the official HF npm scope, now on v4).
- **Model: `Xenova/all-MiniLM-L6-v2`** — general-purpose sentence embedding model, 384-dimensional output (mean pooling + normalize). No need for a biomedical-specific embedding model; recommendation text is plain clinical English, not dense literature-style jargon.
- 384 is the `float[N]` dimension for the `vec0` schema.

## 10. Open items / follow-ups

- [ ] Manually verify all 32 entries in `tobacco_cpg.json` against the source PDF before treating as ground truth.
- [ ] Write config: package installs (`@huggingface/transformers`, `sqlite-vec`, `better-sqlite3`), `vec0` schema (embedding `float[384]` + sidecar columns), ingestion script.
- [ ] Noted for later (not now): the extraction → cross-check-against-source pattern used tonight is a preview of the Step 4 citation verifier's job. Worth remembering when designing that loop, not something to build prematurely.
- [ ] CKD or Lipids as the second guideline once the Tobacco pipeline is proven end-to-end.

---

