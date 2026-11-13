> Development preview ready for review (2026-11-12): artwork-first studio, six composition systems across three formats, explicit unapplied-edit export choices, and a single mobile work surface. Production is unchanged. [Design and verification notes](docs/UI_CRAFT_20261112.md).

# TasteRoom · Preference Lab

2026-11-11 development branch: compare personal and work posters from the same applied copy and image, with explicit rule provenance. This read-only view does not switch the active context or write preferences; closing it preserves artwork, unsaved editor input and history. [Implementation, screenshots and test limits](docs/TASK-LOOP-20261111.md). Not merged or deployed. Dated entries below describe earlier versions.

2026-11-09: artwork creation upgrade reviewed and approved for publication. [Release record](../docs/RELEASE-FOUR-PRODUCTS-20261109.md). [Scope, real browser evidence and limits](docs/PRODUCT-DEPTH-20261109.md). Six directions reflow into portrait900×1200, square1080×1080 and landscape1600×900. Optional event details, one local JPG/PNG/WebP up to5MB, fit/fill and focal position belong to the artwork, never to preference rules.

Candidates preserve copy, size, canvas parameters and image reference. Image bytes stay in IndexedDB. A provenance strip distinguishes scene-authorised direction from temporary changes; restoring the scene direction reuses its rule without writing memory. PNG and SVG use the current visible renderer. Private feedback stays in the separately exported preference brief.

Earlier dated entries below describe the prior iterations.

Final display/export polish verified locally; calculation and persistence contracts retained. Unpublished. [Changes and checks](docs/FINAL-DETAIL-20261103.md).

Independent task-flow rechecks passed; changes remain local and unpublished. [Review scope and untested limits](docs/INDEPENDENT-REVIEW-20261103.md).

Local iteration, 2026-11-03 (not published): exploration opens same-copy comparison directly; temporary choices need explicit scene authorization to become memory. Undo preserves artwork. Unknown phrases offer manual hints without claiming full comprehension. Real SVG and 900×1200 PNG files were saved and opened; 39 core and 2 local fake-provider checks passed. No real model call or user study. [Local evidence](docs/TASK-CLARITY-20261103.md).

Visual refresh approved after user review, 2026-11-02: [design, references and before/after screenshots](docs/VISUAL-CRAFT-20261102.md). Existing product behavior is preserved; the merge commit and Pages workflow record publication.


[中文](README.md) · [Live demo](https://andyzhang666666.github.io/tasteroom/) · [Swiss composition](https://andyzhang666666.github.io/tasteroom/?direction=swiss) · [Product scope](docs/PRD.md)

Liking a poster does not tell a system which feature you liked, or where that preference should apply. TasteRoom turns this into an editable interaction: compare, identify a clue, confirm its scope, then test it in another context.

Edit poster copy and export SVG or 900x1200 PNG without saving a preference. A/B choices remain temporary until a memory scope is explicitly confirmed.

<!-- github-evidence-20261031 -->

![Compare the same content; choosing a design remains separate from authorising memory scope.](docs/assets/visual-craft-20261102/after-desktop.jpg)

[Design decisions](docs/DESIGN.md) · [Validation records](docs/VALIDATION.md)

## Try it

The current product includes six independent compositions, two artwork candidates, any explicit A/B direction pair, and reusable preference briefs. JSON v1 and previous Markdown briefs are validated and previewed before merging rules; artwork exports never contain private feedback. [Implementation boundaries](docs/PRODUCT-DEPTH.md).

1. Choose among Swiss, deconstructed, editorial, Bauhaus, Japanese whitespace and two-ink compositions using the same copy. Keep up to two candidate artworks without saving preference rules.
2. Use a single-variable comparison for typography, spacing, colour or another dimension. Pick A, B or neither; a choice alone is not permission to save a rule.
3. Choose once, the current context or all contexts. Switch content and context to inspect the result, then revoke or edit the memory.
4. Export SVG or 900×1200 PNG from the same renderer. Export a style brief as Markdown or reusable JSON; import it with an explicit replacement preview before applying rules.

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
