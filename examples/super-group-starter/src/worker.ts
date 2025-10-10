import { SuperDappAgent } from '../../../src';
import { getRoomId } from '../utils/room';
/// <reference types="@cloudflare/workers-types" />
import type {
  ExecutionContext,
  ScheduledEvent,
} from '@cloudflare/workers-types';

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
  return t === 'channel' || msg?.__typename === 'ChannelMessage';
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

// getRoomId is imported from shared utils

// Resolve the correct target for channel posts. Prefer roomId from webhook payload,
// then channelId. Never fall back to owner/user id for channel messages.
function resolveChannelTarget(raw: any): string | null {
  return (
    (raw?.roomId as string | undefined) ||
    (raw?.channelId as string | undefined) ||
    null
  );
}

// Debug helper: safely extract id/roomId/channelId without typing errors
function debugIds(raw: any) {
  const r = raw as any;
  return {
    id: r?.id,
    roomId: r?.roomId,
    channelId: r?.channelId,
  };
}

async function runMigrations(env: Env) {
  // Use prepared statements and CURRENT_TIMESTAMP for broader D1 compatibility
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS group_configs (
      owner_id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`
  ).run();

  await env.DB.prepare(
    `CREATE INDEX IF NOT EXISTS idx_group_configs_channel_id ON group_configs(channel_id)`
  ).run();
}

async function saveOwnerGroup(env: Env, ownerId: string, channelId: string) {
  await env.DB.prepare(
    `INSERT INTO group_configs (owner_id, channel_id, created_at, updated_at)
       VALUES (?, ?, datetime('now'), datetime('now'))
       ON CONFLICT(owner_id) DO UPDATE SET channel_id=excluded.channel_id, updated_at=datetime('now');`
  )
    .bind(ownerId, channelId)
    .run();
}

async function getOwnerGroup(
  env: Env,
  ownerId: string
): Promise<string | null> {
  const { results } = await env.DB.prepare(
    'SELECT channel_id FROM group_configs WHERE owner_id = ?'
  )
    .bind(ownerId)
    .all();
  return results && results[0] ? (results[0].channel_id as string) : null;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const basePath = (env.BASE_PATH || '/')
      .replace(/\/+$/g, '')
      .replace(/^$/, '/');
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
      // Basic debug logging for incoming webhook requests
      const reqId =
        (globalThis as any).crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random()}`;
      const contentType = request.headers.get('content-type') || '';
      console.log('[webhook] received', {
        reqId,
        method: request.method,
        path: url.pathname,
        contentType,
      });
      await runMigrations(env);
      const body = await request.text();
      const preview = body.length > 300 ? `${body.slice(0, 300)}…` : body;
      console.log('[webhook] body preview', {
        reqId,
        length: body.length,
        preview,
      });

      // Try to parse and log a succinct payload summary
      try {
        const parsed = JSON.parse(body);
        const raw = (parsed && (parsed.message || parsed)) || {};
        const payloadSummary = {
          id: raw.id,
          roomId: raw.roomId || raw.channelId,
          channelId: raw.channelId,
          memberId: raw.memberId,
          owner: raw.owner,
          typename: raw.__typename,
          t: raw.t,
          isBot: raw.isBot,
        };
        console.log('[webhook] payload summary', { reqId, payloadSummary });
      } catch (_) {
        // If not JSON, we already logged a preview; continue
      }

      // Simple debug log for incoming webhook requests
      try {
        const preview = body.slice(0, 300);
        let parsed: any = null;
        let t: string | undefined = undefined;
        let inner: any = null;
        try {
          parsed = JSON.parse(body);
          try {
            inner =
              parsed && typeof parsed.body === 'string'
                ? JSON.parse(parsed.body)
                : null;
            t = inner?.t;
          } catch (_) {
            // ignore
          }
        } catch (_) {
          // body not JSON
        }
        console.log('[super-group-starter] webhook received', {
          time: new Date().toISOString(),
          length: body.length,
          preview,
          id: parsed?.id,
          roomId: parsed?.roomId || parsed?.channelId,
          typename: parsed?.__typename,
          t,
          isBot: parsed?.isBot,
        });
      } catch (_) {
        // never block on logging
      }

      const agent = new SuperDappAgent({
        apiToken: env.API_TOKEN,
        baseUrl: env.API_BASE_URL || 'https://api.superdapp.ai',
      });

      const client = agent.getClient();

      const isAdminContext = (raw: any) => !isChannelMessage(raw);
      const sendToChannel = async (channelId: string, text: string) => {
        if (!channelId) {
          console.log(
            '[super-group-starter] abort sendToChannel: missing channelId',
            {
              textPreview: (text || '').slice(0, 60),
            }
          );
          return;
        }
        const encoded = encodeURIComponent(JSON.stringify({ body: text }));
        const out = {
          body: JSON.stringify({ m: encoded, t: 'channel' }),
        } as any;
        return client.sendChannelMessage(channelId, {
          message: out,
          isSilent: false,
        });
      };

      // Fun and vibrant text/styles
      agent.addCommand('/start', async ({ message, roomId }) => {
        const raw = message.rawMessage;
        if (isChannelMessage(raw)) {
          const target = resolveChannelTarget(raw);
          if (!target) return;
          await sendToChannel(
            target,
            "👋 I'm alive! Public commands: /hello /faq /ask <q> /image /joke"
          );
          return;
        }
        const rid = getRoomId(raw);
        await agent.sendConnectionMessage(
          rid,
          '🎉 Hello, Captain! I can connect to your super group and entertain your community. Use /setup to get rolling! \n\nPublic goodies: /hello /faq /ask <q> /image /joke'
        );
      });

      agent.addCommand('/help', async ({ message, roomId }) => {
        const raw = message.rawMessage;
        if (isChannelMessage(raw)) {
          const target = resolveChannelTarget(raw);
          if (!target) return;
          await sendToChannel(
            target,
            '🧭 Public Help\n• /hello\n• /faq\n• /ask <q>\n• /image\n• /joke\n\nTip: DM me /help for admin setup commands.'
          );
          return;
        }
        const rid = getRoomId(raw);
        await agent.sendConnectionMessage(
          rid,
          '🧭 Help Menu\n\nAdmin (DM):\n• /setup — connect a group\n• /groups — list your groups\n• /announce <text> — post an announcement\n\nPublic (Group):\n• /hello — say hi\n• /faq — share FAQs\n• /ask <q> — ask a question\n• /image — fun yes/no GIF\n• /joke — random joke'
        );
      });

      // Admin: list groups
      const fetchUserGroups = async (raw: any) => {
        const userId = raw?.senderId || raw?.owner;
        if (!userId) return [] as any[];
        try {
          const res: any = await client.getChannels(String(userId));
          if (Array.isArray(res)) return res;
          if (Array.isArray(res?.data)) return res.data;
          if (Array.isArray(res?.result)) return res.result;
        } catch (_) {}
        return [] as any[];
      };

      agent.addCommand('/groups', async ({ message, roomId }) => {
        const rid = getRoomId(message.rawMessage);
        if (!isAdminContext(message.rawMessage)) return;
        try {
          const list = await fetchUserGroups(message.rawMessage);
          if (!list.length) {
            await agent.sendConnectionMessage(
              rid,
              '🫤 You do not own/admin any groups.'
            );
            return;
          }
          const lines = list.map((g: any, i: number) => {
            const name = g.name || g.title || g.id;
            const avatarUrl = g.photoUrl;
            const parts = [
              `#${i + 1} ${name}`,
              avatarUrl ? `   ![avatar](${avatarUrl})` : '',
              `   id: ${g.id}`,
            ].filter(Boolean);
            return parts.join('\n');
          });
          const text = ['✨ Your groups:', '', lines.join('\n\n')].join('\n');
          await agent.sendConnectionMessage(rid, text);
        } catch (e) {
          await agent.sendConnectionMessage(
            rid,
            '⚠️ Failed to load your groups.'
          );
        }
      });

      // Admin: /setup
      agent.addCommand('/setup', async ({ message, roomId }) => {
        const rid = getRoomId(message.rawMessage);
        console.log('rid', rid);
        if (!isAdminContext(message.rawMessage)) return;
        console.log('B');
        try {
          console.log('BEFORE fetchUserGroups', message);
          const groups = await fetchUserGroups(message.rawMessage);
          console.log('AFTER fetchUserGroups', groups);
          if (!groups.length) {
            await agent.sendConnectionMessage(
              rid,
              '😕 No groups found. Create a super group first.'
            );
            return;
          }
          const buttons = groups.slice(0, 8).map((g: any) => [
            {
              text: `➕ ${g.name || g.title || g.id}`,
              callback_data: `SETUP:${g.id}`,
            },
          ]);
          await agent.sendReplyMarkupMessage(
            'buttons',
            rid,
            '🎛️ Select a group to connect:',
            buttons
          );
        } catch (e) {
          await agent.sendConnectionMessage(rid, '⚠️ Error fetching groups.');
        }
      });

      // Callback for /setup
      agent.addCommand('callback_query', async ({ message, roomId }) => {
        const raw = message.rawMessage;
        const rid = getRoomId(raw);
        const cb = message.callback_command || '';
        const data = message.data || '';
        if (cb === 'SETUP') {
          const ownerId = raw.senderId || raw.memberId || raw.owner;
          const channelId = data;
          try {
            await client.joinChannel(channelId, message.rawMessage.id);
            // Save to D1
            await saveOwnerGroup(env, ownerId!, channelId);
            await agent.sendConnectionMessage(
              rid,
              `✅ Connected to group ${channelId}. You can now use /announce <text>.`
            );
          } catch (e) {
            await agent.sendConnectionMessage(
              rid,
              '❌ Failed to join that group. Make sure you are the owner/admin.'
            );
          }
          return;
        }
      });

      // Admin: /announce
      agent.addCommand('/announce', async ({ message, roomId }) => {
        const rid = getRoomId(message.rawMessage);
        if (!isAdminContext(message.rawMessage)) return;
        const text = (message.data || '').replace('/announce', '').trim();
        if (!text) {
          await agent.sendConnectionMessage(rid, 'Usage: /announce <text>');
          return;
        }
        const ownerId =
          message.rawMessage.senderId ||
          message.rawMessage.memberId ||
          message.rawMessage.owner;
        const channelId = await getOwnerGroup(env, ownerId!);
        if (!channelId) {
          await agent.sendConnectionMessage(
            rid,
            'No group configured. Run /setup first.'
          );
          return;
        }
        await sendToChannel(channelId, `📣 Announcement: ${text}`);
        await agent.sendConnectionMessage(rid, '✅ Announcement sent.');
      });

      // Public group commands
      agent.addCommand('/hello', async ({ message }) => {
        const raw = message.rawMessage;
        if (isChannelMessage(raw)) {
          const target = resolveChannelTarget(raw);
          if (!target) {
            console.log(
              '[super-group-starter] warn no target for /hello',
              debugIds(raw)
            );
            return;
          }
          await sendToChannel(
            target,
            "👋 Hello everyone! I'm your friendly community bot."
          );
        }
      });

      agent.addCommand('/faq', async ({ message }) => {
        const raw = message.rawMessage;
        const faq =
          '📘 FAQ\n• Use /ask <question> to ask the bot\n• Try /image for a random GIF\n• Try /joke for a random joke';
        if (isChannelMessage(raw)) {
          const target = resolveChannelTarget(raw);
          if (!target) {
            console.log(
              '[super-group-starter] warn no target for /faq',
              debugIds(raw)
            );
            return;
          }
          await sendToChannel(target, faq);
        }
      });

      agent.addCommand('/ask', async ({ message }) => {
        const raw = message.rawMessage;
        const q = (message.data || '').replace('/ask', '').trim();
        if (!q) {
          if (isChannelMessage(raw)) {
            const target = resolveChannelTarget(raw);
            if (!target) {
              console.log(
                '[super-group-starter] warn no target for /ask',
                debugIds(raw)
              );
              return;
            }
            await sendToChannel(target, 'Usage: /ask <question>');
          }
          return;
        }
        const target = resolveChannelTarget(raw);
        if (!target) {
          console.log(
            '[super-group-starter] warn no target for /ask payload',
            debugIds(raw)
          );
          return;
        }
        await sendToChannel(
          target,
          `❓ Q: ${q}\n💡 A: Great question! (demo answer)`
        );
      });

      // New Public: /image
      agent.addCommand('/image', async ({ message }) => {
        const raw = message.rawMessage;
        if (!isChannelMessage(raw)) return;
        const target = resolveChannelTarget(raw);
        if (!target) {
          console.log(
            '[super-group-starter] warn no target for /image',
            debugIds(raw)
          );
          return;
        }
        try {
          const resp = await fetch('https://yesno.wtf/api');
          const data = (await resp.json()) as any;
          // Send only the image URL so the client renders a preview
          // Use Markdown image syntax so the client renders the GIF inline
          await sendToChannel(target, `![yesno](${data.image})`);
        } catch (_) {
          await sendToChannel(target, '⚠️ Failed to fetch image.');
        }
      });

      // New Public: /joke
      agent.addCommand('/joke', async ({ message }) => {
        const raw = message.rawMessage;
        if (!isChannelMessage(raw)) return;
        const target = resolveChannelTarget(raw);
        if (!target) {
          console.log(
            '[super-group-starter] warn no target for /joke',
            debugIds(raw)
          );
          return;
        }
        try {
          const resp = await fetch(
            'https://official-joke-api.appspot.com/random_joke'
          );
          const data = (await resp.json()) as any;
          const text = `😂 ${data.setup}\n👉 ${data.punchline}`;
          await sendToChannel(target, text);
        } catch (_) {
          await sendToChannel(target, '⚠️ Failed to fetch a joke.');
        }
      });

      // Fallback
      agent.addCommand('handleMessage', async ({ message }) => {
        const raw = message.rawMessage;
        const text = parseText(raw);
        if (!isChannelMessage(raw)) return;

        const target = resolveChannelTarget(raw);
        if (!target) return;

        if (text && text.startsWith('/')) {
          // Unknown slash command in channel: provide a friendly hint, not a DM
          await sendToChannel(
            target,
            '🤖 Unknown command. Try /help for a list of commands.'
          );
          return;
        }

        if (text) {
          await sendToChannel(target, `🗣️ You said: ${text}`);
        }
      });

      await agent.processRequest(body);
      console.log('[webhook] processed', { reqId, status: 'ok' });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};

// Scheduled every 15 minutes via Cloudflare Cron Trigger

export async function scheduled(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
) {
  await runMigrations(env);
  const res = await env.DB.prepare(
    'SELECT owner_id, channel_id FROM group_configs'
  ).all();
  const rows = (res.results || []) as Array<{
    owner_id: string;
    channel_id: string;
  }>;
  if (!rows.length) return;

  const sendToChannel = async (channelId: string, text: string) => {
    const agent = new SuperDappAgent({
      apiToken: env.API_TOKEN,
      baseUrl: env.API_BASE_URL || 'https://api.superdapp.ai',
    });
    const encoded = encodeURIComponent(JSON.stringify({ body: text }));
    const body = { body: JSON.stringify({ m: encoded, t: 'channel' }) } as any;
    await agent
      .getClient()
      .sendChannelMessage(channelId, { message: body, isSilent: false });
  };

  try {
    const [yesno, joke] = await Promise.all([
      fetch('https://yesno.wtf/api')
        .then((r) => r.json() as Promise<any>)
        .catch(() => null),
      fetch('https://official-joke-api.appspot.com/random_joke')
        .then((r) => r.json() as Promise<any>)
        .catch(() => null),
    ]);

    const imageText = yesno
      ? `🕒 Scheduled Fun — Image\n![yesno](${yesno.image})`
      : '🕒 Scheduled Fun — Image\n⚠️ Failed to fetch image.';
    const jokeText = joke
      ? `🕒 Scheduled Fun — Joke\n😂 ${joke.setup}\n👉 ${joke.punchline}`
      : '🕒 Scheduled Fun — Joke\n⚠️ Failed to fetch joke.';

    for (const row of rows) {
      await sendToChannel(row.channel_id, imageText);
      await sendToChannel(row.channel_id, jokeText);
    }
  } catch (_) {
    // ignore scheduling errors
  }
}
