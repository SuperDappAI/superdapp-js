import { SuperDappAgent } from '../../../src';
/// <reference types="@cloudflare/workers-types" />
import type { ExecutionContext, ScheduledEvent } from '@cloudflare/workers-types';



// Minimal Cloudflare Worker wrapper using the same command set idea.
// For brevity, we provide just /health and forwarding of webhook to the agent.

export interface Env {
  API_TOKEN: string;
  API_BASE_URL?: string;
  BASE_PATH?: string;
  DB: any; // Cloudflare D1 binding
}

function isChannelMessage(msg: any): boolean {
  const t = msg?.body?.t;
  return t === 'channel';
}

function parseText(msg: any): string {
  const m = msg?.body?.m;
  if (!m) return '';
  try {
    if (typeof m === 'string') {
      const decoded = decodeURIComponent(m);
      const parsed = JSON.parse(decoded);
      return (
        (parsed.text as string) ||
        (typeof parsed.body === 'string' ? parsed.body : '') ||
        (parsed.message as string) ||
        ''
      );
    }
    if (typeof m === 'object') {
      return (
        (m.text as string) ||
        (typeof m.body === 'string' ? m.body : '') ||
        (m.message as string) ||
        ''
      );
    }
  } catch (_) {}
  return '';
}

// Use the SDK-provided roomId from command context for 1-2-1 messages.
// The previous composite builder could produce invalid connection IDs leading to 403s.

async function runMigrations(env: Env) {
  await env.DB.exec(`
CREATE TABLE IF NOT EXISTS group_configs (
  owner_id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
`);
  await env.DB.exec(`CREATE INDEX IF NOT EXISTS idx_group_configs_channel_id ON group_configs(channel_id);`);
}

async function saveOwnerGroup(env: Env, ownerId: string, channelId: string) {
  await env.DB
    .prepare(
      `INSERT INTO group_configs (owner_id, channel_id, created_at, updated_at)
       VALUES (?, ?, datetime('now'), datetime('now'))
       ON CONFLICT(owner_id) DO UPDATE SET channel_id=excluded.channel_id, updated_at=datetime('now');`
    )
    .bind(ownerId, channelId)
    .run();
}

async function getOwnerGroup(env: Env, ownerId: string): Promise<string | null> {
  const { results } = await env.DB.prepare('SELECT channel_id FROM group_configs WHERE owner_id = ?').bind(ownerId).all();
  return results && results[0] ? (results[0].channel_id as string) : null;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const basePath = (env.BASE_PATH || '/').replace(/\/+$/g, '').replace(/^$/, '/');
    const pathname = url.pathname.replace(/\/+$/g, '') || '/';
    const stripBase = (p: string) => {
      if (!basePath || basePath === '/') return p;
      return p.startsWith(basePath) ? p.slice(basePath.length) || '/' : p;
    };

    const route = stripBase(pathname);

    if (route === '/health') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          service: 'super-group-starter',
          time: new Date().toISOString(),
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (route === '/webhook' && request.method === 'POST') {
      await runMigrations(env);
      const body = await request.text();

      const agent = new SuperDappAgent({
        apiToken: env.API_TOKEN,
        baseUrl: env.API_BASE_URL || 'https://api.superdapp.ai',
      });

      const client = agent.getClient();

      const isAdminContext = (raw: any) => !isChannelMessage(raw);
      const sendToChannel = async (channelId: string, text: string) => {
        const encoded = encodeURIComponent(JSON.stringify({ body: text }));
        const out = { body: JSON.stringify({ m: encoded, t: 'channel' }) } as any;
        return client.sendChannelMessage(channelId, { message: out, isSilent: false });
      };

      // Fun and vibrant text/styles
      agent.addCommand('/start', async ({ roomId }) => {
        await agent.sendConnectionMessage(
          roomId,
          '🎉 Hello, Captain! I can connect to your super group and entertain your community. Use /setup to get rolling! \n\nPublic goodies: /hello /faq /ask <q> /image /joke'
        );
      });

      agent.addCommand('/help', async ({ roomId }) => {
        await agent.sendConnectionMessage(
          roomId,
          '🧭 Help Menu\n\nAdmin (DM):\n• /setup — connect a group\n• /groups — list your groups\n• /announce <text> — post an announcement\n\nPublic (Group):\n• /hello — say hi\n• /faq — share FAQs\n• /ask <q> — ask a question\n• /image — fun yes/no GIF\n• /joke — random joke'
        );
      });

      // Admin: list groups
      const fetchUserGroups = async (raw: any) => {
        const candidates = [raw?.senderId, raw?.memberId, raw?.owner].filter(Boolean);
        for (const userId of candidates) {
          try {
            const res: any = await client.getChannels(String(userId));
            const list: any[] = Array.isArray(res?.data) ? res.data : [];
            if (list.length) return list;
          } catch (_) {}
        }
        return [] as any[];
      };

      agent.addCommand('/groups', async ({ message, roomId }) => {
        if (!isAdminContext(message.rawMessage)) return;
        try {
          const list = await fetchUserGroups(message.rawMessage);
          if (!list.length) {
            await agent.sendConnectionMessage(roomId, '🫤 You do not own/admin any groups.');
            return;
          }
          const lines = list.map((g: any, i: number) => `#${i + 1} ${g.name || g.title || g.id} (id: ${g.id})`);
          await agent.sendConnectionMessage(roomId, `✨ Your groups:\n${lines.join('\n')}`);
        } catch (e) {
          await agent.sendConnectionMessage(roomId, '⚠️ Failed to load your groups.');
        }
      });

      // Admin: /setup
      agent.addCommand('/setup', async ({ message, roomId }) => {
        if (!isAdminContext(message.rawMessage)) return;
        try {
          const groups = await fetchUserGroups(message.rawMessage);
          if (!groups.length) {
            await agent.sendConnectionMessage(roomId, '😕 No groups found. Create a super group first.');
            return;
          }
          const buttons = groups.slice(0, 8).map((g: any) => [{ text: `➕ ${g.name || g.title || g.id}`, callback_data: `SETUP:${g.id}` }]);
          await agent.sendReplyMarkupMessage('buttons', roomId, '🎛️ Select a group to connect:', buttons);
        } catch (e) {
          await agent.sendConnectionMessage(roomId, '⚠️ Error fetching groups.');
        }
      });

      // Callback for /setup
      agent.addCommand('callback_query', async ({ message, roomId }) => {
        const raw = message.rawMessage;
        const cb = message.callback_command || '';
        const data = message.data || '';
        if (cb === 'SETUP') {
          const ownerId = raw.memberId || raw.owner;
          const channelId = data;
          try {
            await client.joinChannel(channelId, message.rawMessage.id);
            // Save to D1
            await saveOwnerGroup(env, ownerId!, channelId);
            await agent.sendConnectionMessage(roomId, `✅ Connected to group ${channelId}. You can now use /announce <text>.`);
          } catch (e) {
            await agent.sendConnectionMessage(roomId, '❌ Failed to join that group. Make sure you are the owner/admin.');
          }
          return;
        }
      });

      // Admin: /announce
      agent.addCommand('/announce', async ({ message, roomId }) => {
        if (!isAdminContext(message.rawMessage)) return;
        const text = (message.data || '').replace('/announce', '').trim();
        if (!text) {
          await agent.sendConnectionMessage(roomId, 'Usage: /announce <text>');
          return;
        }
        const ownerId = message.rawMessage.memberId || message.rawMessage.owner;
        const channelId = await getOwnerGroup(env, ownerId!);
        if (!channelId) {
          await agent.sendConnectionMessage(roomId, 'No group configured. Run /setup first.');
          return;
        }
        await sendToChannel(channelId, `📣 Announcement: ${text}`);
        await agent.sendConnectionMessage(roomId, '✅ Announcement sent.');
      });

      // Public group commands
      agent.addCommand('/hello', async ({ message }) => {
        const raw = message.rawMessage;
        if (isChannelMessage(raw)) {
          await sendToChannel(raw.channelId || raw.owner || '', '👋 Hello everyone! I\'m your friendly community bot.');
        }
      });

      agent.addCommand('/faq', async ({ message }) => {
        const raw = message.rawMessage;
        const faq = '📘 FAQ\n• Use /ask <question> to ask the bot\n• Try /image for a random yes/no GIF\n• Try /joke for a random joke';
        if (isChannelMessage(raw)) {
          await sendToChannel(raw.channelId || raw.owner || '', faq);
        }
      });

      agent.addCommand('/ask', async ({ message }) => {
        const raw = message.rawMessage;
        const q = (message.data || '').replace('/ask', '').trim();
        if (!q) {
          if (isChannelMessage(raw)) await sendToChannel(raw.channelId || raw.owner || '', 'Usage: /ask <question>');
          return;
        }
        await sendToChannel(raw.channelId || raw.owner || '', `❓ Q: ${q}\n💡 A: Great question! (demo answer)`);
      });

      // New Public: /image
      agent.addCommand('/image', async ({ message }) => {
        const raw = message.rawMessage;
        if (!isChannelMessage(raw)) return;
        try {
          const resp = await fetch('https://yesno.wtf/api');
          const data = await resp.json() as any;
          const text = `🎲 Answer: ${data.answer}\n🖼️ ${data.image}`;
          await sendToChannel(raw.channelId || raw.owner || '', text);
        } catch (_) {
          await sendToChannel(raw.channelId || raw.owner || '', '⚠️ Failed to fetch image.');
        }
      });

      // New Public: /joke
      agent.addCommand('/joke', async ({ message }) => {
        const raw = message.rawMessage;
        if (!isChannelMessage(raw)) return;
        try {
          const resp = await fetch('https://official-joke-api.appspot.com/random_joke');
          const data = await resp.json() as any;
          const text = `😂 ${data.setup}\n👉 ${data.punchline}`;
          await sendToChannel(raw.channelId || raw.owner || '', text);
        } catch (_) {
          await sendToChannel(raw.channelId || raw.owner || '', '⚠️ Failed to fetch a joke.');
        }
      });

      // Fallback
      agent.addCommand('handleMessage', async ({ message }) => {
        const raw = message.rawMessage;
        const text = parseText(raw);
        if (isChannelMessage(raw) && text && !text.startsWith('/')) {
          await sendToChannel(raw.channelId || raw.owner || '', `🗣️ You said: ${text}`);
        }
      });

      await agent.processRequest(body);
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response('Not found', { status: 404 });
  },
};


































// Scheduled every 15 minutes via Cloudflare Cron Trigger


export async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
  await runMigrations(env);
  const res = await env.DB.prepare('SELECT owner_id, channel_id FROM group_configs').all();
  const rows = (res.results || []) as Array<{ owner_id: string; channel_id: string }>;
  if (!rows.length) return;

  const sendToChannel = async (channelId: string, text: string) => {
    const agent = new SuperDappAgent({ apiToken: env.API_TOKEN, baseUrl: env.API_BASE_URL || 'https://api.superdapp.ai' });
    const encoded = encodeURIComponent(JSON.stringify({ body: text }));
    const body = { body: JSON.stringify({ m: encoded, t: 'channel' }) } as any;
    await agent.getClient().sendChannelMessage(channelId, { message: body, isSilent: false });
  };

  try {
    const [yesno, joke] = await Promise.all([
      fetch('https://yesno.wtf/api').then(r => r.json() as Promise<any>).catch(() => null),
      fetch('https://official-joke-api.appspot.com/random_joke').then(r => r.json() as Promise<any>).catch(() => null),
    ]);

    const imageText = yesno ? `🕒 Scheduled Fun — Image\n🎲 Answer: ${yesno.answer}\n🖼️ ${yesno.image}` : '🕒 Scheduled Fun — Image\n⚠️ Failed to fetch image.';
    const jokeText = joke ? `🕒 Scheduled Fun — Joke\n😂 ${joke.setup}\n👉 ${joke.punchline}` : '🕒 Scheduled Fun — Joke\n⚠️ Failed to fetch joke.';

    for (const row of rows) {
      await sendToChannel(row.channel_id, imageText);
      await sendToChannel(row.channel_id, jokeText);
    }
  } catch (_) {
    // ignore scheduling errors
  }
}
