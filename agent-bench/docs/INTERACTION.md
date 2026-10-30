# Interaction and engineering contract

Updated 2026-10-30. Public experience: guided replay of existing records. Local experience: preserved API/SQLite sandbox. No participant research or real-model evaluation is claimed.

## Public replay

One fictional task, two independent policy records. Three shortcuts expose response loss, permission and version changes; all ten original cases remain in the native selector. Task and initial state appear before action, without revealing the archived final write.

The player owns one cursor. Previous, next, play/pause and jump-to-result project existing records only. Each lane consumes its own original event order, capped at its event count; equal indices do not mean synchronized timestamps. Mobile policy tabs retain the cursor. Selecting an event changes the evidence inspector, not execution or progress.

At a timeout, interruption or conflict, the most recently observed snapshot is explicitly stale. Only visited query/operation response snapshots can refresh it. At the end of all terminal records, the final audit exposes archived `record.ticket` separately from the Agent's last observed state and `run.state`. Grading remains the original `evaluation` result. Imported files retain a file-declared, unsigned provenance notice; browser checks do not authenticate or rescore them.

Autoplay pauses at lost receipts, read-only permissions, version conflicts, reapproval after a conflict and unavailable queries. Human approval events are recorded actions, not replay approvals. Reduced motion removes CSS animation and smooth scrolling, not the checkpoints. Playback speed never represents execution latency.

## Local execution

| State | Visible content / controls | Persistent effect / recovery |
|---|---|---|
| Ready | Initial ticket, task, example label; replay or explicit local run | Public interaction has no writes |
| Running | Current data and stop | Local API persists cursor and trace; run IDs can be restored |
| Needs input | Missing field and next step | No mutation; select a complete case to rerun |
| Awaiting confirmation | Exact ticket/group/note/version; confirm or cancel | Approval digest binds parameters and version |
| Unknown | Commit may have happened; query original operation | Reuse original operation ID; do not blindly resubmit |
| Conflict | Changed revision and explanation | Hardened policy rereads and obtains a new approval |
| Denied | Read-only identity, no business write; attempts separately counted | Server permission checks remain common to both policies |
| Failed | Specific failure and run ID | Bounded retry; no fake model-success fallback |
| Cancelled | Current data and whether a write occurred | Stop later steps, without promising rollback |
| Finished | Final data, checks, readable recap and original export | Read-only downloads/import; no mutation endpoints |

The model can select only query_ticket, submit_change and operation_status. Human approval is required for concrete writes. Identity, grade and data state are not taken from the model's completion claim. Tool events and structured final replies are retained; hidden reasoning is not.

## Recovery, access and persistence

Load failure disables playback and offers retry. Invalid or oversized imports preserve the previous usable state. Public replay works when browser storage is unavailable. The public player neither writes run IDs nor calls mutation endpoints; only explicit local program/model execution persists run references. API loss preserves local mode and does not turn it into an example.

Controls have visible names, focus rings and at least 44px targets. Mobile presents one replay policy at a time, with both outcomes summarized; local approval continues to show both isolated runs. Raw JSON is a native disclosure. No page-wide horizontal scrolling is required at tested widths.

## Evidence

Pure replay-projection checks cover seeking without future data, query snapshots after version changes, all ten records and safe refusal. Browser checks cover public replay, import/export, mobile/keyboard input, reduced motion and local approval, timeout recovery, duplication, stale approval, cancel, refresh and API failure. The case, tool, grader and export schemas are unchanged. See [GUIDED-REPLAY.md](GUIDED-REPLAY.md) for the current release evidence; earlier release reports remain historical.
