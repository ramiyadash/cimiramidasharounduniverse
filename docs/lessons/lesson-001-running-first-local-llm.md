Lesson 001 — Running the First Local LLM

Date: 2026-06-25

Objective

Successfully run an open-weight Large Language Model locally and integrate it into the TripMate backend.

What We Did
Installed Ollama
Downloaded the Qwen3 model
Started the Ollama server
Created a Node.js backend
Sent the first prompt from Express to Ollama
Received the first AI-generated travel itinerary
What We Learned
1. Ollama is simply a model runtime

Ollama is not the AI itself.

It is responsible for:

downloading models
running models
exposing an HTTP API

The actual intelligence comes from the model (Qwen3).

2. The LLM runs entirely on the local machine

No cloud service was required.

The request flow became:

Client

↓

Express

↓

Ollama

↓

Qwen3

↓

Express

↓

Client

3. The backend does not "understand" travel

The backend simply forwards prompts.

All travel knowledge currently comes from the LLM.

This means the backend must eventually add business logic instead of relying solely on AI.

4. Prompt quality matters

The model produced a surprisingly good itinerary.

However, it also invented restaurants and details that were not verified.

This demonstrated that prompt engineering is just as important as model selection.

5. Local AI development is fast

Running locally removes:

API costs
internet dependency
rate limits

It also provides excellent privacy during development.

Challenges

Initially Ollama was not installed.

After installation the server needed to be started before the backend could communicate with it.

Testing with curl confirmed the integration before building a frontend.

Future Improvements
Streaming responses
Conversation memory
Modular prompts
Weather integration
Maps integration
Personal Reflection

The first successful request proved that an AI-powered application is simply another software system with an LLM as one of its components.

The most valuable realization was that the application architecture—not just the model—determines the overall quality and maintainability of the solution.

LLMs don't have memory between API calls. The application is responsible for deciding what context to provide.

each component should have a single, well-defined purpose.