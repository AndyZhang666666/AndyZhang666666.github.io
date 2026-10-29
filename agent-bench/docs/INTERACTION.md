# Interaction and engineering contract

Evidence: approved PRD §§2–6. Owner: this repository's maintainer. No participant research has been performed.

## Outcomes and information architecture
The main screen answers: which case, what happened, did it meet the task? A native select offers ten original cases. The default is a write-response timeout because the difference between a response and a committed effect is directly observable. Two adjacent result columns compare the policies; small widths stack them with both headings retained. No technical knowledge is required to watch the example. Raw requests, checks, provenance, versions and usage are disclosures.

| State | Visible content / controls | Persistent effect / recovery |
|---|---|---|
| Ready | Task, condition, initial ticket, example label; watch / local run | No write; changing case clears old comparison |
| Running | Current event, partial timeline; stop | Local step commits durable cursor and trace; refresh retains run IDs |
| Needs input | Missing field and next step | No mutation; select a complete case to rerun |
| Awaiting confirmation | Exact ticket/group/note/version; confirm or cancel | Approval is digest-bound. Confirm again after conflict; never silently reuse |
| Unknown | Commit may have happened; recover button | Query original operation before any retry; preserve operation ID |
| Conflict | Changed revision and explanation | Hardened re-reads and asks for new approval; baseline stops |
| Denied | Read-only actor; no business write; attempts separately counted | No credential/role override in request |
| Failed | Specific tool or model failure; run ID and export | Bounded retry only; new run is a new isolated sandbox |
| Cancelled | Actual current data, whether a write occurred | Stop future steps; no undo promise |
| Finished | Final group, ticket open, note count and verdict | Read-only export and replay; replay never calls mutation endpoints |

## Authority and AI contract
The local model may choose only query_ticket, submit_change, operation_status. Human approval is required for concrete changes in both policies; API checks permission, exact parameters, approved version and duplicate key in one transaction. Model output never sets identity, outcome or grade. Only tool requests/results and final replies are recorded, never hidden reasoning. Model versions and provider usage are captured when available; missing usage is null/unknown. Model failures remain in the denominator.

## Pattern decisions
Native select beats a ten-card grid: it keeps task and result on screen; reconsider if visitors cannot discover cases. Side-by-side comparison beats separate pages: shared task stays visible; mobile stacks rather than drops either result. Inline approval beats a modal because it preserves task/effect context. Technical disclosures hide nonessential logs, never mode, permission, unknown writes or recovery controls.

## Responsive and input contract
Controls are at least 44px; names, focus outline and text statuses remain. Details open with Enter/Space. At narrow width columns stack and logs scroll inside their container. Text wraps; identifiers break where needed. Motion only advances visible events; reduced motion shows the final example immediately. Errors preserve the case/run and offer retry. API loss never silently switches a local run into an example.

## Acceptance and boundaries
Tests cover normal and ambiguous tasks, auth, transient/permanent failure, response timeout, deduplication/key collision, cancellation, stale approval, process restart and offline rescoring. Browser tests drive watch/check/export and local approval/recovery/cancel at desktop and mobile widths. Final evidence belongs in TEST-REPORT.md. No user study or real-model evaluation is claimed. Public Pages and local service have separate verification boundaries. Model credentials and secure public hosting remain owner-provided dependencies; static examples are the explicit fallback.
