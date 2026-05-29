# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) documenting implicit design decisions in the ProShop codebase.

ADRs are recorded using the [MADR format](https://adr.github.io/madr/) (Markdown Architecture Decision Records) and follow the template:
- **Status** — Accepted, Proposed, Deprecated, Superseded
- **Confidence** — HIGH (evident in code), MEDIUM (inferred from patterns), LOW (speculation)
- **Context** — What problem was being solved
- **Decision** — What was chosen
- **Alternatives** — What other approaches were considered
- **Consequences** — Positive and negative outcomes
- **Related** — Links to other ADRs or code

## ADR Index

| # | Title | Status | Confidence | Description |
|---|-------|--------|-----------|-------------|
| [0001](0001-manual-jwt-header-injection-in-thunks.md) | Manual JWT Header Injection in Every Redux Thunk | Accepted | HIGH | Every protected action creator manually extracts the JWT token and constructs the `Authorization` header, instead of using Axios interceptors. Causes boilerplate but provides explicit visibility of auth requirements. |
| [0002](0002-selective-localstorage-persistence-in-action-creators.md) | Selective localStorage Persistence in Action Creators | Accepted | HIGH | Only cart, user info, shipping address, and payment method are persisted to localStorage via manual `localStorage.setItem()` calls in action creators. Other state is ephemeral and refetched on each session. |
| [0003](0003-es-modules-with-required-file-extensions.md) | ES Modules with Required File Extensions in Backend | Accepted | HIGH | Backend uses ES Modules (`"type": "module"`) with mandatory `.js` extensions on local imports. Chosen for modern syntax and consistency with frontend, but requires discipline to not forget extensions. |

## How to Add a New ADR

1. Choose the next number (e.g., 0004)
2. Use the template:
   ```markdown
   # ADR NNNN: Short Title

   **Status:** Accepted|Proposed|Deprecated|Superseded  
   **Confidence:** HIGH|MEDIUM|LOW  
   **Date:** YYYY-MM-DD

   ## Context
   ...
   
   ## Decision
   ...
   
   ## Alternatives
   ...
   
   ## Consequences
   ...
   
   ## See Also
   ...
   ```
3. Focus on decisions that are **implicit** (evident in code but not documented elsewhere)
4. Be specific with code references: include file paths and line numbers
5. Link to other ADRs using `ADR NNNN` format

## Implicit vs. Explicit Decisions

An ADR documents a decision that exists in the code but is not documented in CLAUDE.md or the main README.

**Examples of implicit decisions in ProShop:**
- Manual JWT header injection (instead of interceptors) — evident in every action creator, but never explained
- Selective localStorage persistence — the pattern exists, but no document explains *why* only these slices
- ES Modules with file extensions — enforced by package.json, but the tradeoff analysis is missing

**Examples of explicit decisions (skip ADR):**
- Using MongoDB as the database — documented in CLAUDE.md
- Using React + Redux for frontend — documented in README
- JWT for authentication — mentioned in CLAUDE.md

## Reading ADRs

- **For developers onboarding** — Read the Consequences section to understand tradeoffs
- **For refactoring decisions** — Check "Potential Future Changes" to understand migration paths
- **For bug investigation** — Related decisions may explain why a bug exists

## When to Mark ADR as Superseded

If an ADR becomes outdated:
1. Change **Status** to `Superseded`
2. Add a reference: `Superseded by ADR NNNN`
3. Retain the old ADR for historical context

Example:
```markdown
# ADR 0001: Original Approach

**Status:** Superseded by [ADR 0005](0005-...md)
```

## Confidence Levels

- **HIGH** — Decision is explicitly implemented in code; pattern is consistent across the codebase
- **MEDIUM** — Inferred from code patterns or commented-out alternatives; some ambiguity about original intent
- **LOW** — Speculation based on indirect evidence; could be wrong

All ProShop ADRs are HIGH confidence because the decisions are evident in the codebase and consistent.
