# Suibianju · Make “anything is fine” specific

[中文](README.md) · [Live demo](https://andyzhang666666.github.io/suibianju/) · [Product scope](docs/PRD.md) · [Second iteration](docs/V2.md)

A group may need clearer conditions before it needs more restaurant recommendations. Suibianju lets people state constraints, inspect the intersection and preview a voluntary change without having their limits silently relaxed.

## Try the decision flow

1. Start the quick example. Organise a fictional member’s message, inspect the conditions and confirm them, or enter conditions manually.
2. Switch between the simulated friends and accept the same version of one proposal.
3. Try the no-intersection scenario. Inspect the budget conflict, preview a voluntary change and review which candidates it unlocks.
4. Confirm the member’s conditions, then collect each member’s acceptance. Export the shared decision and action checklist.

You operate all 3–5 fictional roles in one browser. This is a single-person product simulation, not a live multi-user room.

## Product decisions

- Hard constraints survive a majority preference. A budget suggestion never relaxes dietary or location constraints.
- A preview changes only a draft. Confirmed conditions and earlier responses remain intact until a person explicitly submits a change.
- Agreement must refer to the same proposal version. A new member or changed conditions require renewed confirmation.
- The public receipt omits original private messages, but role switching can still read all fictional state; this is not a privacy-isolation guarantee.

## Run locally

```sh
python3 -m http.server 8870 --bind 127.0.0.1
```

Run from the website repository root and open `http://127.0.0.1:8870/suibianju/`. The public static mode needs no build step, login or key. It uses local rules, makes no model calls and books nothing.

Local state expires when the app checks its lifetime, including on load and visibility changes. A closed browser cannot perform background deletion. The design hypothesis and its next user study are documented; no efficiency or adoption outcome has been measured.

[Implementation and deployment](docs/IMPLEMENTATION.md) · [Validation records](docs/VALIDATION.md) · [Chinese notes and actual screenshots](README.md)
