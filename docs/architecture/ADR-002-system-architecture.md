ADR-002 — Overall System Architecture

Status: Accepted

Date: 2026-06-25

Context

Several architectural approaches were considered.

Option A

Angular

↓

LLM

Option B

Angular

↓

Node API

↓

LLM

Option C

Angular

↓

Node API

↓

Business Services

↓

LLM + External APIs

Decision

Option C was selected.

The LLM will be one component of the backend rather than the central application.

The backend owns:

business rules
validation
conversation management
integrations
persistence

The LLM is responsible only for reasoning and language generation.

Why

This architecture provides:

easier testing
better maintainability
vendor independence
ability to combine AI with structured data
clearer separation of responsibilities
Consequences

Changing the LLM provider should not require rewriting business logic.

External services such as weather or maps can be integrated independently of the AI model.