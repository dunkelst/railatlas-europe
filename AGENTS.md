# steffen_fun|x development policy — Ponytail FULL

Default mode: **FULL**.

The goal is the smallest correct change that preserves confirmed product behavior.

## Working order

1. Understand the real user-visible failure or requirement first.
2. Trace the existing data/control flow end to end before editing.
3. Reuse an existing implementation, helper, route, component, API path, or pattern when one already exists.
4. Prefer platform/native/standard-library capability over custom code.
5. Prefer already-installed dependencies over adding new ones.
6. Fix the root cause at the shared point used by all affected callers instead of patching symptoms in individual screens/paths.
7. Add only the minimum code/files required for the confirmed requirement.
8. Remove obsolete duplicate code after the replacement path is proven.
9. Leave one small runnable regression check for non-trivial logic.

## Hard guardrails

- **Confirmed functionality is not YAGNI.** Do not remove, collapse, or bypass an accepted product requirement merely because a simpler product could exist.
- No regression of already-working behavior while simplifying another area.
- Do not replace real functionality with a visual mock, hard-coded demo, fixed sample route, fake data, or placeholder unless explicitly requested.
- Do not create parallel implementations when the existing path can be repaired.
- Do not add speculative abstractions, factories, wrappers, services, configuration layers, or dependencies "for later".
- Prefer deletion over addition only after the surviving path is verified.
- Validation, data-loss protection, security, accessibility, persistence, and required error handling must not be simplified away.

## RailAtlas-specific contract

- Station/location input, autocomplete, current-location adoption, routing, intermediate stops, timetable data, and map rendering are parts of one functional flow and must stay connected.
- A route that only works for a fixed Heilbronn–Würzburg example is not considered a completed routing implementation.
- New destinations must extend the existing station/routing model rather than introduce another hard-coded path.
- UI polish must not substitute for missing routing or timetable functionality.
- When a regression is reported, verify sibling paths too (start, destination, intermediate stop, current location, typed station, suggested station).

## Change acceptance

Before considering a change complete, verify:

- the originally reported case works;
- a neighboring/sibling case still works;
- no duplicate implementation was introduced;
- no confirmed feature disappeared;
- the diff is smaller than an equivalent parallel implementation would be.

If two solutions are equally correct, choose the one with fewer moving parts.
