# Agent 执行评测台
<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Delegated by the user: extend the existing static HTML/CSS/JS site, add a Python 3.9+ standard-library API and SQLite. No production Python dependencies; Playwright is a development dependency.

## Users
First-time portfolio visitors and interviewers. Select a fictional ticket case, observe execution, and inspect final data rather than trust a completion claim. The one-minute experience is a design target, not observed research.

## Product Purpose
Evaluate tool execution, actual effects, authority and recovery. One ticket scenario, three tools, ten cases. All identities, tickets and rules are original synthetic data.

## Operating Context
Public GitHub Pages supports static examples without visitor keys. Local API performs durable writes. A separately configured server-side model can choose tool calls. No model or hosting credentials were supplied; never imply model validation from program tests.

## Capabilities and Constraints
Baseline and hardened strategies use the same initial state, tool permissions and faults. Server validates every mutation. Approval binds parameters and ticket version; idempotency binds operation IDs to exact actions. Unknown outcomes are resolved by querying the existing operation. Cancellation stops future work and does not undo commits. Runs are isolated and persisted. Replay is read-only.

## Evidence on Hand
Approved PRD in docs/PRD.md. Existing root website uses warm paper, ink and restrained rust accent. There are no real-model records, customer results, benchmark improvements or authorized hosted API.

## Product Principles
Final database state outranks model prose. Show source mode before action. Keep consequences and recovery visible; put raw tool events and versions behind disclosure. Preserve other projects and parallel RAG work.

## Accessibility & Inclusion
Keyboard controls, named status, textual verdicts, 390px and desktop flow, no page overflow, reduced motion. Browser checks do not establish full WCAG conformance.
