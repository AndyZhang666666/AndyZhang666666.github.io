# Andy Zhang · Product portfolio and independent tools


2026-11-07: Added Squid Lab with finite/infinite rule comparisons, event replay, paired simulations and twelve spot challenges. The original 17 projects remain; the poker group now has four entries. See [integration notes](docs/SQUID-LAB-20261107.md).
[Live portfolio](https://andyzhang666666.github.io/) · [中文](README.md) · [GitHub profile](https://github.com/AndyZhang666666) · [Project index](https://github.com/AndyZhang666666/AndyZhang666666/blob/main/PROJECTS.en.md)

2026-11-03: Integrates the reviewed reversible presentation view, four case-anchor fixes and TasteRoom's task help, explicit consent states and draft recovery. Original development history is retained; the PR and Pages run record the final publication status. [Release scope](docs/RELEASE-20261103.md).

2026-11-01: Featured work now covers Eval Lab, TasteRoom, Bundle Lab and Commute Compare. Bring personal material, export a usable result, and keep original evidence separate from simulated or conditional outcomes. [Release scope](docs/RELEASE-20261101.md).

This repository hosts my personal site and four independent products. Professional experience, product decisions, research and runnable demos are presented separately. Each project explains its data and run mode.

The default featured work is **Eval Lab, TasteRoom, Bundle Lab and Commute Compare**. Direction controls change their order; all four remain available. Agent Execution Bench and Trustworthy RAG Lab remain in the complete 17-project library. [Current integrated release](docs/RELEASE-20261103.md).

## Find the source

| Project | Product question | Source and documentation | Demo |
| --- | --- | --- | --- |
| Agent Execution Bench | How do we verify business effects after a timeout? | [agent-bench](agent-bench/README.en.md) | [Open](https://andyzhang666666.github.io/agent-bench/) |
| Trustworthy RAG Lab | Which sources apply under the current conditions? | [rag-lab](rag-lab/README.en.md) | [Open](https://andyzhang666666.github.io/rag-lab/) |
| TasteRoom | What should one aesthetic choice let a system remember? | [tasteroom](tasteroom/README.en.md) | [Open](https://andyzhang666666.github.io/tasteroom/) |
| Suibianju | How can a group negotiate without overriding a person's conditions? | [suibianju](suibianju/README.en.md) | [Open](https://andyzhang666666.github.io/suibianju/) |

[Eval Lab](https://github.com/AndyZhang666666/llm-output-eval), [Filing Eval](https://github.com/AndyZhang666666/filing-eval), [Bundle Lab](https://github.com/AndyZhang666666/bundle-lab), [Growth](https://github.com/AndyZhang666666/growth-experiment-lab), [Pricing](https://github.com/AndyZhang666666/pricing-model-sim) and other tools have independent source repositories. This site hosts their experience links and deployment files. Change their logic in the source repository rather than creating a second implementation here.

## Local preview

The portfolio is a static HTML / CSS / JavaScript site, published from `main` using GitHub Pages.

```sh
node scripts/preview.mjs
```

Content and project cards are organised in `data.json` and `content/`. The existing content-generation script is `scripts/update-content.mjs`; check its extension-preservation logic before regenerating so that parallel additions remain intact.

Agent Bench and RAG Lab provide optional local APIs. Their own READMEs explain startup, scope, model configuration and checks. GitHub Pages serves their public frontends, not those backends, and does not automatically call paid models.

## Design and records

The portfolio retains theme switching, animated backgrounds, section navigation and research illustrations. Cards distinguish runnable tools, written cases and external destinations. Actual product screenshots can be enlarged, and full tools have direct links.

[CHANGELOG](CHANGELOG.md) records actual changes. [Showcase design, Chinese](docs/DEMO-SHOWCASE-20261028.md) explains presentation decisions. Modules include product scope, implementation and validation material. Interface checks, historical outputs and new model evaluations are recorded separately.

Existing module licences and font notices apply. See the [Chinese README](README.md) for earlier release notes.
