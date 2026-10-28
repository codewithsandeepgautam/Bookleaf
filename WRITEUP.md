# Write-up: BookLeaf Author Support Portal

**What I prioritised.** The core ticket lifecycle and AI integration, since those carry most of the weight and most of the real-world value: author submits → ticket is saved instantly → AI classifies and scores it → ops see the most urgent/oldest work first → an AI draft grounded in the knowledge base *and the author's actual royalty/book data* is ready to edit → reply appears live for the author.

**Key design choices.**
- *Ground the model in facts, not memory.* Drafts receive the specific book's figures and a precomputed payout date, so replies cite real numbers (the KB's "be specific" rule) and cannot hallucinate dates.
- *Spend tokens where they matter.* Triage is a tiny JSON call with no KB; drafting gets only the KB slice for the ticket's category and the last 4 messages. Drafts are cached per ticket.
- *AI is an assistant, never a dependency.* Tickets are always created; if the LLM is down, rules classify and a template draft is offered. Admin overrides are sticky and labelled by source (AI / rules / admin) so ops know what to trust.
- *Security by construction.* Role scoping lives in the service layer, authors get a separate serializer (no notes, draft, priority), and the LLM key exists only on the server.

**Trade-offs.** Polling over WebSockets (simplicity, host-agnostic); embedded messages in the ticket document (fast reads, bounded size); in-process async triage instead of a job queue; UI-only attachments; hand-written shadcn components to avoid CLI dependencies.

**Evolving to production.** (1) Job queue + retries and an outbox for AI work; (2) SSE/WebSockets and email/WhatsApp notifications; (3) httpOnly-cookie sessions, password reset, audit log; (4) read live royalty data from the finance system rather than a snapshot; (5) an offline evaluation set for category/priority accuracy plus tracking of how much admins edit drafts, to tune prompts and decide when high-confidence tickets (e.g. "can I update my bio?") can be auto-answered; (6) per-call token/cost metrics, caching of KB prompts, SLA timers and escalation rules for Critical tickets; (7) real file storage with virus scanning.
