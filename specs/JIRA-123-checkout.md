# Checkout v2 — Spec (JIRA-123)
Branch name should include: JIRA-123

## Acceptance Criteria (use [keywords: ...] to help the bot)
- AC1: Add an **email** input. It is **optional**. [keywords: email, optional]
- AC2: Add **phone** input and validate length 10-14. [keywords: phone, length, 10, 14]
- AC3: Call **POST /signup** and return **HTTP 202**. [keywords: POST, /signup, 202]
- AC4: Show empty-state text: **"No items yet"** on mobile. [keywords: "No items yet", mobile]
- AC5: Use feature flag **newCheckout** to guard this flow. [keywords: newCheckout, feature flag]
