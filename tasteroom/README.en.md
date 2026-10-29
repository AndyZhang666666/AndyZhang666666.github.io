# TasteRoom · Preference Lab

[中文](README.md) · [Live demo](https://andyzhang666666.github.io/tasteroom/) · [Swiss composition](https://andyzhang666666.github.io/tasteroom/?direction=swiss) · [Product scope](docs/PRD.md)

Liking a poster does not tell a system which feature you liked, or where that preference should apply. TasteRoom turns this into an editable interaction: compare, identify a clue, confirm its scope, then test it in another context.

## Try it

1. Open the design workbench and compare Swiss modernist and deconstructed compositions with the same copy.
2. Use a single-variable comparison for typography, spacing, colour or another dimension. Pick A, B or neither; a choice alone is not permission to save a rule.
3. Choose once, the current context or all contexts. Switch content and context to inspect the result, then revoke or edit the memory.
4. Export the poster as a self-contained SVG or export a style brief that keeps clues and explicit rules separate.

## Decisions in the interface

Inferred clues stay distinct from authorised rules. Explicit rules take precedence, and context-specific needs can differ from everyday preferences. Global corrections and conflicts are visible. Undo applies to the current interaction session; long-term memory changes have their own controls.

The workbench supports editable title, supporting copy and signature. Composition transitions and control feedback respect reduced-motion settings.

## Run locally

The public product uses local rules and original sample posters. No model or image-generation service is called.

```sh
python3 -m http.server 8870 --bind 127.0.0.1
```

Run from the website repository root and open `http://127.0.0.1:8870/tasteroom/`. No build step is required for this static mode.

Memory and context are stored only in the current browser; storage failures fall back to the current page session. The rule parser is deliberately limited and does not understand arbitrary language. A local optional model proxy exists, but a real provider was not configured, deployed or validated.

[Design decisions](docs/DESIGN.md) · [Second iteration](docs/V2.md) · [Validation records](docs/VALIDATION.md) · [Chinese implementation notes](README.md)

The project demonstrates interaction mechanisms, not measured preference accuracy, adoption or retention. Original poster content is fictional; font notices remain in `fonts/LICENSE.txt`.
