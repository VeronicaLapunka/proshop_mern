# ADR-0004 (DRAFT): Backend Layering — controller → repository → model (no service layer for v1)

**Status:** Proposed (drafted by architecture-mate during Stage-1 code review, 2026-05-27)
**Date:** 2026-05-27
**Deciders:** TBD (PR author + tech lead)
**Supersedes:** Implicit "MVC pattern" claim in `backend/CLAUDE.md` (lines 5–15)

---

## Context

`backend/CLAUDE.md` documents the backend as "a traditional MVC pattern" — `server.js`, `config/db.js`, `models/`, `routes/`, `controllers/`, `middleware/`. No service layer is mentioned. Several engineer-facing instructions in the repo (and in agent prompts driving this review) nevertheless assume a **"controller → service → model"** layering, and flag business logic in controllers as a violation.

In reality:

- There is no `backend/services/` directory.
- Every controller (`orderController.js`, `productController.js`, `userController.js`) imports Mongoose models directly: `import Order from '../models/orderModel.js'`, etc.
- Business rules (rating recompute after a review, paymentResult shaping on `updateOrderToPaid`, embedded-review array mutation) live inside HTTP handlers.
- `backend/middleware/authMiddleware.js` performs a per-request `User.findById(...)` — also a model call from middleware.
- No repository, no DAO, no facade — Mongoose specifics (`.populate('user', 'name email')`, `.lean()` absence, `.remove()` even though deprecated) leak into every controller.

This contradicts the documentation, and reviewers (human and AI) cannot tell whether putting domain logic in controllers is "as designed" or "a violation". Each new contributor is forced to make the same judgement call.

Forces:

- The codebase is small (~3 controllers, ~700 LOC). A formal service layer is over-engineering today.
- ADR-001 explicitly identifies a future migration target ("PostgreSQL would have been an equally valid choice"). That migration is impossible without a seam between controllers and the ORM.
- Mongoose 5 → 6/7 upgrade is a documented blocker (root MEMORY.md, "Mongoose upgrade lock"). A repository layer is the seam needed to absorb the breaking changes.
- `.remove()` (used in `productController.deleteProduct` line 49 and `userController.deleteUser` line 122) is removed in Mongoose 7 — every controller touches the ORM directly, so the upgrade is N edits instead of 1.

---

## Decision

Adopt the layering **controller → repository → model** as the canonical backend architecture for v1. **Do not introduce a service layer yet.** Update `backend/CLAUDE.md` to reflect this.

Rules:

1. **Controllers** (`backend/controllers/*.js`) handle HTTP only: request parsing, response shaping, status codes, error mapping. No Mongoose calls.
2. **Repositories** (new `backend/repositories/*.js`) own all Mongoose calls. Methods are named for the use case, not for the ORM: `orderRepository.findById(id)`, `orderRepository.listForUser(userId, { page, pageSize })`, `productRepository.addReview(productId, review)` — the last one keeps the rating recompute close to the data, not in the controller.
3. **Models** (`backend/models/*.js`) remain Mongoose schemas. Instance methods are allowed for invariants that must always hold (e.g. `order.markPaid(verifiedResult)`).
4. **No services/ in v1.** If domain logic outgrows repositories (orchestrating two repositories in one transaction, e.g. order + inventory decrement), introduce a `services/` layer at that point — with a new ADR.

`backend/CLAUDE.md` will be updated to drop "service" from the documented layering and to add a "Code review rule" forbidding `import ... from '../models/...'` inside controllers.

---

## Consequences

### Positive

- **Documentation matches reality.** Reviewers and agents stop generating "service layer missing" findings.
- **Mongoose 5 → 7 upgrade becomes a per-repository change.** `.remove()` → `.deleteOne()` happens in 3 repository files, not in every controller.
- **PostgreSQL migration becomes feasible.** The repository interface is the boundary ADR-001 anticipated.
- **Tests improve.** Controllers are tested with a mock repository; integration tests cover repositories against a real Mongo.

### Negative / trade-offs

- **Extra files.** Three new files (orderRepository.js, productRepository.js, userRepository.js). Tiny project tax.
- **Refactor cost.** Roughly 1 engineer-day to migrate the three controllers without behavioural change.
- **Risk of "anaemic repositories".** If repositories are just one-line wrappers around Mongoose calls, the abstraction adds friction with no benefit. Mitigation: only extract methods that have at least one non-trivial concern (composition of finds, embedded-document mutation, transformation).

### Risks

- **Logical-transaction gap remains.** ADR-001 ("Negative" section, "No ACID transactions by default") is not resolved by repositories alone — multi-repository operations (order + stock decrement) still need either MongoDB transactions or a service layer. Document this as the trigger for the future services/ ADR.

---

## Alternatives considered

- **Introduce a full controller → service → repository → model layering now.** Rejected for v1 — over-engineered for the scope. Documented as the next architectural step.
- **Keep "controller → model" and document THAT as the canonical layering.** Rejected because it leaves the ORM-upgrade and DB-migration seams unaddressed (both already documented as risks in `MEMORY.md` and ADR-001 respectively).
- **Move logic onto Mongoose models as instance methods only.** Partial fix — works for single-document invariants (order.markPaid) but not for multi-document use cases (listing my orders with pagination + lean).

---

## Open issues

- **Auth error-string contract.** ADR 0001 documents the brittle coupling on the exact string `'Not authorized, token failed'`. The codebase has since added more magic strings (`'Invalid email or password'`, `'Not authorized as an admin'`, `'Not authorized, no token'`) with no shared constants module. Suggest a follow-up addendum to ADR 0001, or a small ADR-0006, extracting these strings into `backend/constants/authErrors.js` and referencing the same names from the frontend logout check.
- **HTTP status semantics.** `admin` middleware returns 401 instead of 403 (authn vs authz conflated). Fix is small and unrelated to layering; can be bundled with the repository refactor.

---

## See also

- `backend/CLAUDE.md` lines 5–15 (current MVC claim)
- ADR-001 (MongoDB) — repository layer is the seam for the future migration
- ADR 0001 (manual JWT injection) — auth-string-as-contract issue
- `docs/project-data/MEMORY.md` (referenced from user memory) — Mongoose upgrade lock
- Architecture-mate review summary: `homework-m6/stage1-code-review/architecture-review.md`
