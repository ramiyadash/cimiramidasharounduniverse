ADR-004 — AI Architecture

Status: Accepted

Date: 2026-06-25

Context

Many AI applications directly send user input to an LLM and return the generated response.

While simple, this approach limits extensibility and makes it difficult to incorporate structured business logic or external data.

Decision

TripMate AI will use the LLM as a reasoning engine within a larger application architecture.

The backend will:

manage conversations
maintain prompts
coordinate external services
validate user requests

The LLM will:

understand user intent
generate natural-language responses
synthesize information provided by backend services
Principles
Business logic belongs in application services.
Prompts should be modular and reusable.
AI providers should be replaceable with minimal code changes.
Conversations should preserve context across requests.
Future Work

Future enhancements include:

Retrieval-Augmented Generation (RAG)
Tool/function calling
Long-term conversation memory
User preference learning
Multi-model support