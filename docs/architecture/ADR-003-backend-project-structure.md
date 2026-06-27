ADR-003 — Backend Project Structure

Status: Accepted

Date: 2026-06-25

Context

The backend will grow significantly as features are added.

Without clear organization, service files tend to become large and difficult to maintain.

Decision

The backend will follow a layered architecture.

controllers

↓

services

↓

integrations

↓

LLM / Database

Project structure:

src/

config/

controllers/

middleware/

models/

prompts/

routes/

services/

utils/

validators/

Within services:

ai/

conversation/

travel/
 
integrations/

storage/
Why

Each folder has a single responsibility.

This minimizes coupling and keeps features isolated.

Consequences

New developers can quickly locate functionality.

Features remain modular as the application grows.