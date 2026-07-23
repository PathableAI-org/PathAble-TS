<!--
  Sync Impact Report

  Version change: (none) → 1.0.0
  - Initial constitution creation (first-time placeholder fill)

  Modified principles:
  - [PROJECT_NAME] → HIPAA
  - [PRINCIPLE_1_NAME] → I. Audit-First Compliance
  - [PRINCIPLE_2_NAME] → II. Strong Static Analysis
  - [PRINCIPLE_3_NAME] → III. Functional Design & Patterns
  - [PRINCIPLE_4_NAME] → IV. PHI Awareness
  - [PRINCIPLE_5_NAME] → V. Testable & Auditable
  - [SECTION_2_NAME] → Compliance Standards
  - [SECTION_3_NAME] → Development Workflow
  - [GOVERNANCE_RULES] → Filled with amendment/versioning policy

  Added sections: None (initial fill of template)
  Removed sections: None

  Templates requiring updates:
  - .specify/templates/plan-template.md ✅ No changes needed (Constitution Check section uses dynamic placeholder)
  - .specify/templates/spec-template.md ✅ No changes needed
  - .specify/templates/tasks-template.md ✅ No changes needed
  - .specify/templates/checklist-template.md ✅ No changes needed

  Follow-up TODOs: None (all placeholders filled)
-->

# HIPAA Constitution

## Core Principles

### I. Audit-First Compliance

Every module MUST support attributable, reviewable, and evidence-preserving
audit logging for PHI-related operations. Code MUST NOT be merged without
demonstrating how it satisfies HIPAA Security Rule audit controls (45 CFR
164.312(b)), unique user identification, and activity review expectations.
Non-attributable access paths, shared credentials, and silent PHI context
loss are design errors.

Rationale: HIPAA compliance is the raison d'être of this package. Every
abstraction, type, and function must justify itself against the regulatory
baseline documented in `docs/HIPAA-and-Software-Behavior.md`.

### II. Strong Static Analysis

All code MUST pass the strictest TypeScript configuration (`tsconfig.json`
extends `tsconfig.base.json`) with no `any`, no implicit returns, and
exhaustive type narrowing. ESLint rules MUST be treated as binding, not
advisory. Linting is a CI gate.

Rationale: PHI-related logic errors are not caught by runtime tests alone.
Static analysis catches data-flow violations, missing fields, and incorrect
type narrowing before they reach production.

### III. Functional Design & Patterns

Modules MUST use Effect-TS idioms: `Effect`, `Layer`, `Schema`, and related
constructs. Side effects MUST be deferred into the Effect system. Functions
MUST be pure, total, and referentially transparent. Mutable state, thrown
exceptions, and implicit dependencies are prohibited.

Rationale: Effect-TS provides predictable, testable, and composable error
handling — essential for audit-logging chains, retry-safe disclosure
accounting, and deterministic PHI access patterns that must be provable
under OCR review.

### IV. PHI Awareness

All data models, serialization boundaries, and log outputs MUST distinguish
PHI from non-PHI. Every public API surface MUST declare whether it accepts,
returns, or logs PHI. Minimum-necessary scoping (45 CFR 164.502(b),
164.514(d)) is a design-time constraint, not a runtime filter.

Rationale: Accidentally logging PHI to infrastructure telemetry or passing
PHI to an un-BAA'd dependency is a compliance incident. Types and module
boundaries are the first line of defense.

### V. Testable & Auditable

Every module MUST have property-based or example-based tests covering its
public API. Tests MUST verify both the happy path and the PHI-relevant
safeguard path (e.g., missing actor, missing patient ID, failed
authentication). Audit events MUST be testable independently of the
business logic that triggers them.

Rationale: A module that cannot be tested in isolation cannot be proven
compliant. Tests serve as executable evidence for compliance review.

## Compliance Standards

This package implements general-purpose HIPAA compliance primitives for the
Effect-TS ecosystem. It does not prescribe a specific deployment
architecture. Instead, it provides:

- **Audit-log schemas** and composable logging layers aligned with the
  field set described in `docs/HIPAA-and-Software-Behavior.md` (event_id,
  actor, patient/subject, action, outcome, legal basis, etc.).
- **Disclosure-accounting** types that capture the elements required by
  45 CFR 164.528.
- **Attribution primitives** for unique user and service identities.
- **Restriction and authorisation** modeling for Privacy Rule workflows.
- **Amendment/version linkage** support for designated-record-set integrity.

All compliance primitives MUST be usable without coupling to a specific
transport, database, or deployment target.

## Development Workflow

- **Type-check first**: `pnpm check` (tsc) MUST pass before any commit.
- **Lint-staged**: ESLint and dprint formatting run on staged files via
  husky pre-commit hooks (`.husky/`).
- **Changeset-driven**: All public API changes MUST include a changeset
  (`.changeset/`). Breaking changes MUST be noted explicitly.
- **Review gates**: Every PR MUST include evidence that PHI-related types
  and audit paths are tested. Compliance impact MUST be documented.

## Governance

The Constitution supersedes all other practices. Amendments require a
changeset and a documented rationale. The revision history of this document
serves as the authoritative record.

- **Amendment procedure**: Submit a PR modifying `.specify/memory/constitution.md`.
  Justification MUST reference the specific HIPAA rule or design principle
  motivating the change.
- **Versioning policy**: MAJOR for principle removals/redefinitions; MINOR
  for new principles or materially expanded guidance; PATCH for wording
  clarifications and typo fixes.
- **Compliance review**: Every release MUST pass the checks in
  `docs/HIPAA-and-Software-Behavior.md` traceability matrix. The constitution
  MUST be re-read and validated after any change to HIPAA rules or OCR
  guidance that affects audit-control or privacy-rule expectations.

**Version**: 1.0.0 | **Ratified**: 2026-07-23 | **Last Amended**: 2026-07-23