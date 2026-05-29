# ProShop MERN Documentation Index

Central navigation hub for all ProShop MERN project documentation.

---

## 📋 Architecture & Design

- **[Architecture Overview](./project-data/architecture.md)** — System design, layers, and module interactions
- **[ADR Repository](./adr/)** — Architecture Decision Records (latest: 0001-0003 + legacy adr-001-005)
- **[Best Practices](./project-data/best-practices.md)** — Engineering guidelines and patterns

---

## 🚀 Features & Functionality

- **[Features Index](./project-data/features/)** — Feature documentation
  - [Admin Features](./project-data/features/admin.md)
  - [Authentication](./project-data/features/auth.md)
  - [Shopping Cart](./project-data/features/cart.md)
  - [Product Catalog](./project-data/features/catalog.md)
  - [Checkout Flow](./project-data/features/checkout.md)
  - [Payments (PayPal)](./project-data/features/payments.md)

- **[Feature Flags Specification](./project-data/feature-flags-spec.md)** — Feature flag system design and usage

---

## 🌐 API Reference

- **[API Endpoints](./project-data/api/)**
  - [Authentication](./project-data/api/auth.md)
  - [Products](./project-data/api/products.md)
  - [Orders](./project-data/api/orders.md)
  - [Users](./project-data/api/users.md)
  - [File Uploads](./project-data/api/uploads.md)

---

## 📖 Screen Documentation

- **[Screens Index](./project-data/pages/)** — UI/UX specifications for all pages
  - Public pages: Home, Product Detail, Cart, Login, Register
  - Checkout flow: Shipping, Payment, Place Order, Order Details
  - Admin pages: Dashboard, Products, Users, Orders
  - User profile: Profile, Order History

---

## 🛠️ Operations & Runbooks

- **[Runbooks](./project-data/runbooks/)**
  - [Local Development Setup](./project-data/runbooks/local-setup.md)
  - [Database Seed & Reset](./project-data/runbooks/db-seed-and-reset.md)
  - [Deployment Guide](./project-data/runbooks/deploy.md)
  - [Incident Response](./project-data/runbooks/incident-response.md)

---

## 🚨 Incident Reports

- **[Incidents](./project-data/incidents/)**
  - [PayPal Double-Charge Incident](./project-data/incidents/i-001-paypal-double-charge.md)
  - [MongoDB Connection Pool Exhaustion](./project-data/incidents/i-002-mongo-connection-pool-exhaustion.md)
  - [JWT Secret Leak](./project-data/incidents/i-003-jwt-secret-leak.md)

---

## 📚 Reference

- **[Glossary](./project-data/glossary.md)** — Domain, technical, and operational terminology
- **[Development History](./project-data/dev-history.md)** — Timeline and evolution of the project

---

## 🔗 Navigation Shortcuts

| Purpose | Link |
|---------|------|
| **AI Integration** | See root [CLAUDE.md](../CLAUDE.md#-api-communication) |
| **Project Index** | See [`project-index.json`](../project-index.json) (machine-readable) |
| **Module Map** | See [`PROJECT_MAP.md`](./PROJECT_MAP.md) (generated from `project-index.json`) |
| **Backend Patterns** | See [`backend/CLAUDE.md`](../backend/CLAUDE.md) |
| **Frontend Patterns** | See [`frontend/CLAUDE.md`](../frontend/CLAUDE.md) |

---

## 📦 Archived Documentation

Historical and non-actionable docs moved to [`archived-2026-05-28/`](./archived-2026-05-28/):
- **`m2-char-tests/`** — M2 characterization test suite (reference only)
- **`report.md`** — M2 milestone report (historical snapshot)
- **`features-analysis-ru.md`** — Russian-language analysis (archived)

---

## ⏸️ Deferred Runbooks

Placeholder templates moved to [`deferred-2026-05-28/`](./deferred-2026-05-28/) pending implementation:
- **`ab-test-setup.md`** — A/B testing runbook (planned, not implemented)
- **`feature-flag-toggle.md`** — Feature flag control runbook (planned, not implemented)

---

## 📝 Last Updated

**Index generated:** 2026-05-29
**Audit reference:** `Phase 1.5 Docs Audit` (see `homework-m6/stage3-living-docs/01-docs-audit.md`)
