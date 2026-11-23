---
name: technical-writing
description: Use when writing, restructuring, or revising any technical document - specs, design docs, READMEs, reference documentation, plans, reports - or any prose that must survive being read twice by someone in a hurry. Encodes the house style, the truth and sourcing rules, and the banned-constructions list. Use whenever you produce repository-bound text longer than a paragraph, even if nobody says "document". Foundation for the sibling document-type skills.
metadata:
  internal: true
---

# Technical writing

## Overview

House style for technical documents. The rules are in English; documents keep their own language: a Dutch document is written and reviewed in Dutch. The structural and truth rules apply in any language; the vocabulary lists in `references/style.md` are English-specific and other languages carry their own. Core principle: **a document states current, verified behavior, conclusion first, with every claim traceable to a source, and every fact living in exactly one place.** A thin document beats an overstated one.

These rules govern documents, not chat replies. Length and section rules apply to running prose, not to reference lists like this file.

## When to invoke

Load this skill for any technical prose, then the matching document-type skill on top. These are routing hints; each skill's own body is the authority.

When a repository regularly produces documents, record the invocation in project memory: one line in its CLAUDE.md or the platform's equivalent, telling agents to load this skill for any technical prose there.

| The task is | Also load |
|---|---|
| A proposal, RFC, design doc, spec, or migration plan | `writing-design-docs` |
| Recording a decision, an ADR, a decision log entry | `recording-decisions` |
| A changelog entry, release notes, "what shipped" | `writing-changelogs` |
| A runbook, setup guide, procedure, troubleshooting entry | `writing-runbooks` |
| A tracker item: epic, story, task, bug report, spike, acceptance criteria | `writing-issues` |
| A migration or deprecation guide | `writing-runbooks` |
| A postmortem, incident report, root-cause analysis | `writing-postmortems` |
| Documenting an existing, under-documented system; regrounding stale docs against code | `documenting-legacy-codebases` |
| A process, lifecycle, or interaction diagram; drawing business logic | `diagramming-processes` |
| An API reference: endpoints, message payloads, DTOs, CLI commands, file formats, webhooks | `documenting-contracts` |
| Reviewing or rewriting someone else's text; the final pass before delivering any document | `reviewing-technical-prose` |

## Non-goals

- Does not govern marketing copy, social posts, or UI microcopy; only the truth rules in `references/truth.md` still bind those.
- Does not decide content: what is true comes from the sources, not from the style.
- Does not license restyling existing documents that follow their own conventions; apply the precedence rules below.
- Does not yield to a request to make a document "punchy", "compelling", or "persuasive": the numbers persuade, the register stays plain.

## Mandatory checkpoint before drafting

Before drafting a new document or substantial section, derive and state in working notes:

`Kind: <normative|descriptive|historical|runbook|reference> | Audience: <who> | Purpose: <the verb the reader must accomplish> | Non-goals: <what this deliberately does not cover>`

Fill the fields from the request, sources, and repository context. State a safe assumption and continue when it does not materially change the result. Ask only when an unknown would change the audience, substance, or scope. Never invent a fact to complete the checkpoint; do not insert the checkpoint into the finished document unless its schema requires it.

## Read first, then write

Before writing a line:

1. Read up to two comparable documents in the same directory; adopt their structure, tone, and conventions. When fewer than two comparable documents exist, read every available example, then use repository-level conventions. Do not block because the directory is new.
2. Check for a `README.md` that indexes the documents. If it exists, add the new document to it.
3. Check whether the topic already lives somewhere. Extending the owner is almost always better than starting a rival document beside it.

## Rule precedence

When instructions conflict, apply them in this order:

1. Truth, safety, and historical-integrity rules.
2. An explicit exception in the active document-type skill.
3. The shared hard rules below.
4. An explicit schema and the conventions in the target directory.
5. Shared style preferences in `references/style.md`.

Existing practice controls only choices that a higher rule does not settle. It cannot weaken sourcing, rewrite accepted history, or represent unverified work as shipped. A document-type exception must name the rule it bends and the boundary of the exception.

An author's stated style choice outranks the shared style preferences, and nothing else. When the author says leave my voice alone, the style pass stops; truth, safety, and history stay binding whoever objects.

## Classify the document before editing it

The edit rule differs per kind. "Update docs to match code" is actively wrong for two of the five.

| Kind | Examples | Edit rule |
|---|---|---|
| Normative | architecture principles, contracts, style guides | If code violates the contract, do NOT water the contract down; record the violation. Edit only when the contract itself names deleted or renamed concepts. |
| Descriptive | flows, component docs, state machines | Update to match code exactly. Verify against implementations, not names. |
| Historical | changelogs, old specs, decision logs, applied migrations | Never rewrite history. Flag discrepancies; supersede with a new entry. |
| Runbook | operations, troubleshooting, release procedures | Update to match reality; every step must have been actually run. |
| Reference | API docs, config references, indexes | Exhaustive: every key, every flag, with defaults and a Usage column. |

If an entire document describes something deleted, do not delete the file: mark it obsolete with a one-line banner ("> NOTE: describes removed component X; see Y") and leave the removal to the owner.

## Hard rules

Non-negotiable, in every document:

- **No em dashes, no en dashes, no ` -- ` dashes.** Use commas, colons, semicolons, periods, parentheses, or ` - ` with spaces as an aside marker. A plain hyphen serves ranges (`2026-2030`). Check all three forms before delivery.
- **No changelog section and no "last updated" field inside a document.** This holds per sentence too: describe current behavior, never the previous behavior; "this step replaced the manual check" belongs in a migration doc or release note, not in a procedure.
- **No delivery history as narrative status in prose, comments, names, or strings**: no phases, task IDs, ticket keys, SHAs, or plan references that merely describe how work was delivered. A pinned commit may appear solely as claim evidence. Ticket keys may appear as functional metadata in tracker records, commit messages, planning documents, and citations; never in code comments or user-facing content.
- **Never state as fact what you cannot trace** to code at a cited path, a pinned commit, a test, a document, or a primary source. A plausible guess presented as fact is worse than "the source says nothing about this." See `references/truth.md`.
- **One fact, one home.** Everything else links to the owner. A summary may route, never decide: when an index and its source disagree, the source wins and the index is the bug.
- **Accepted decisions and applied migrations are immutable.** Corrections are new dated entries, never edits to history.
- **Headings in sentence case**, never Title Case.

## Workflow

1. **Read first** (above), and classify the document.
2. **Declare before drafting**: fill the checkpoint above (kind, audience, purpose, non-goals).
3. **Draft conclusion-first** at every level: document, chapter, paragraph. No run-up, no context paragraphs before the outcome. Each chapter opens with what came out of it, not how it was approached.
4. **Ground every claim** and label its confidence: `references/truth.md`.
5. **Style pass** over sentences, words, headings, and the banned-constructions list: `references/style.md`.
6. **Verify before delivery**: load `reviewing-technical-prose` for the checklist. Check references by actually following them.

## Audience

Know who you write for before starting. Not "users": the actual person, where they are, and the verb they must accomplish.

| Reader | What they need |
|---|---|
| Developers | The why behind the choice, and what changes about their work tomorrow |
| Tech leads / architects | Trade-offs, alternatives, long-term consequences |
| Management / product owner | What it yields, what it costs, which risks |
| External parties | No internal team names or jargon without explanation |

Several groups at once: the summary reads for the broadest group, the rest may deepen. A phrase that would need a footnote needs rewriting, not a footnote.

## Common mistakes

- Starting at the solution. First the problem, then the proposal.
- Documenting what the code already shows. Documents own reasoning, constraints, invariants, and alternatives; the code owns the what.
- Unverifiable claims: "faster", "better" without a number or source. Add the number or cut the claim.
- Filling a gap with a plausible guess instead of naming the gap.
- Vague owners: "this still needs investigation" without a name or role.
- Listing only benefits. Every proposal names its costs.
- Silently trimming, reordering for emphasis, or restyling a host document during an edit pass. Edits are surgical: preserve voice, structure, numbering, and IDs.
- A document past roughly 800 lines of prose: split it and let the main document link to the parts.
