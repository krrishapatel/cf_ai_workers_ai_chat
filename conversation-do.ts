export interface StoredMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class ConversationDO {
  state: DurableObjectState;
  storage: DurableObjectStorage;

  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state;
    this.storage = state.storage;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/session' || request.method !== 'POST') {
      return new Response('Not Found', { status: 404 });
    }

    const body = (await request.json()) as
      | { type: 'append'; role: StoredMessage['role']; content: string }
      | { type: 'get' };

    if (body.type === 'append') {
      const messages = (await this.storage.get<StoredMessage[]>('messages')) || [];
      messages.push({ role: body.role, content: body.content });
      await this.storage.put('messages', messages);
      return json({ ok: true, messages });
    }

    if (body.type === 'get') {
      const messages = (await this.storage.get<StoredMessage[]>('messages')) || [];
      return json({ messages });
    }

    return new Response('Bad Request', { status: 400 });
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}


