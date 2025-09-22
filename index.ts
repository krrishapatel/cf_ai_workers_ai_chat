import { ConversationDO } from './conversation-do';

export interface Env {
  AI: Ai;
  MODEL: string;
  ConversationDO: DurableObjectNamespace<ConversationDO>;
}

export default {
  fetch: async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      try {
        const body = (await request.json()) as { sessionId?: string; message?: string };
        const sessionId = body.sessionId || 'default';
        const message = body.message || '';
        if (!message) {
          return json({ error: 'message required' }, 400);
        }

        const id = env.ConversationDO.idFromName(sessionId);
        const stub = env.ConversationDO.get(id);
        const doRes = await stub.fetch('https://do/session', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ type: 'append', role: 'user', content: message }),
        });
        const { messages } = (await doRes.json()) as { messages: Array<{ role: string; content: string }> };

        const aiResponse = await env.AI.run(env.MODEL, {
          messages,
        } as any);

        const reply = aiResponse?.response || aiResponse?.result || '';

        await stub.fetch('https://do/session', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ type: 'append', role: 'assistant', content: reply }),
        });

        return json({ reply, messages: [...messages, { role: 'assistant', content: reply }] });
      } catch (err: any) {
        return json({ error: err?.message || 'internal error' }, 500);
      }
    }

    if (url.pathname === '/' && request.method === 'GET') {
      return new Response('OK', { headers: corsHeaders() });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders() });
  },
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders() },
  });
}

function corsHeaders(): Record<string, string> {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
  };
}


