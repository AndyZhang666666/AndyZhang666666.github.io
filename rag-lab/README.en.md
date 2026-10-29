# Trustworthy RAG Lab

[中文](README.md) · [Live demo](https://andyzhang666666.github.io/rag-lab/) · [Product scope](docs/PRD.md) · [Test report](docs/TEST-REPORT.md)

Ask a question about fictional equipment policies, inspect the applicable answer and passage, then change the business date or source snapshot. The project treats access scope, effective versions, retrieval and answer checking as separate decisions.

## A small experiment

Ask how long a monitor may be borrowed. The original snapshot on the fixed business date `2026-10-28` gives 14 days. Querying `2026-06-30` gives the older 30-day rule. The demonstration revision gives 10 days. After changing a condition, rerun explicitly; the previous answer retains its original conditions until replaced.

Open the source paragraph to inspect its version and effective range. A matching quotation establishes location, not the correctness of every interpretation.

## Run modes

| Mode | What runs | Boundary |
| --- | --- | --- |
| Public example | Browser BM25 retrieval, date/version selection and rule extraction over 12 original public documents | No model or online API call; the role selector is not production authentication. |
| Local extractive API | Independent session, server-side scope restriction, retrieval and rule extraction | Management scope requires separate credentials. |
| Optional local model | Retrieval followed by a configured Responses-compatible endpoint and citation/key-fact checks | Real-provider integration remains unverified. Missing configuration fails explicitly. |

The full repository includes 14 fictional documents, including two management test documents excluded from the public frontend. They are public source material, not secrets.

## Run locally

Node.js 22 or later, with no npm dependencies or build step:

```sh
node server/server.mjs
```

Open `http://127.0.0.1:4318/rag-lab/`. Expand the run-mode details and explicitly choose the local extractive API. The employee session is temporary and held in memory. See `.env.example` and the Chinese notes for optional administrator and model configuration; never publish local credentials.

## Reproduction

```sh
node scripts/build-public.mjs
node --test tests/*.test.mjs
node scripts/evaluate.mjs
```

These build the public document whitelist and check the fixed retrieval/rule fixtures. They do not establish general semantic accuracy. The first implementation recognises a limited equipment-policy vocabulary; ambiguous questions, missing evidence and conflicting rules remain explicit states.

## Source map

- `engine.mjs`: source scope, effective versions, Chinese-bigram BM25, extraction and citation checks.
- `public-corpus.json`: the frontend document whitelist.
- `server/`: local sessions, access checks, limits and an optional model adapter.
- `tests/cases.json`: fixed questions with scope, dates, references and key facts.
- `evidence/`: recorded checks and browser screenshots.

The prototype has no PDF/OCR ingestion, vector database, embedding model or production identity system. See the [UX contract](docs/UX-CONTRACT.md) and [Chinese implementation notes](README.md).
