cf_ai_workers_ai_chat

An AI-powered chat application built on Cloudflare Workers, Workers AI (Llama 3.3), Durable Objects for memory, and Pages for a minimal UI. It demonstrates:

- LLM inference via Workers AI
- Server-side workflow/coordination in a Worker
- Persistent memory/state in a Durable Object
- Chat UI via Cloudflare Pages

Quick start

1) Prerequisites
- Node.js 18+
- Cloudflare account with Workers + Workers AI access
- wrangler installed: `npm i -g wrangler`

2) Configure
- Copy `.dev.vars.example` to `.dev.vars` and set `CLOUDFLARE_ACCOUNT_ID` if needed for local bindings.
- Edit `wrangler.toml` with your `account_id`.

3) Run locally
```bash
wrangler dev
```
Then open the printed localhost URL. The Pages static files serve the chat, and the Worker handles `/api/chat`.

4) Deploy
```bash
wrangler deploy
```

Architecture

- Worker routes API requests at `/api/chat`.
- Durable Object `ConversationDO` stores per-session conversation state.
- Worker calls Workers AI `@cf/meta/llama-3.3-70b-instruct` for responses.
- Pages serves `/public` with a minimal chat UI using fetch to the Worker endpoint.

Project structure

```
wrangler.toml
src/
  index.ts            # Worker entry
  conversation-do.ts  # Durable Object for memory
public/
  index.html          # Chat UI
PROMPTS.md
README.md
```

Environment and bindings

- AI: Workers AI binding named `AI`
- Durable Object: `ConversationDO`

Endpoints

- POST `/api/chat`
  - body: `{ "sessionId": string, "message": string }`
  - response: `{ "reply": string, "messages": Array<{role: string, content: string}> }`

Sample curl

```bash
curl -sX POST "$WORKER_URL/api/chat" \
  -H 'content-type: application/json' \
  --data '{"sessionId":"demo","message":"Hello!"}' | jq
```

License

MIT


