import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { SuperDappAgent } from '../../src';
import axios from 'axios';
import { getRoomId as computeRoomId } from './utils/room';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'application/json' }));

// In-memory mapping for local dev (ephemeral). Worker uses D1 for persistence.
const ownerGroups = new Map<string, Set<string>>();
const pendingAnnounce = new Map<string, string>();

const joinedChannels = new Set<string>();

// Fun vibes
const fancy = {
  welcome:
    '🎉 Welcome! I can post to your Super Group and delight your community. Use /setup to connect a group.\n\nPublic: /hello /faq /ask <q> /image /joke',
  help: '🧭 Help Menu\n\nAdmin (DM):\n• /setup — connect a group\n• /groups — list your groups\n• /announce <text> — post an announcement\n\nPublic (Group):\n• /hello — say hi\n• /faq — share FAQs\n• /ask <q> — ask a question\n• /image — fun yes/no GIF\n• /joke — random joke',
};

function isChannelMessage(msg: any): boolean {
  return (
    msg?.body?.t === 'channel' ||
    msg?.isChannel === true ||
    !!msg?.channelId ||
    msg?.__typename === 'ChannelMessage' ||
    (msg?.roomId && msg?.body?.t === 'channel')
  );
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

async function main() {
  const agent = new SuperDappAgent({
    apiToken: process.env.API_TOKEN as string,
    baseUrl: (process.env.API_BASE_URL as string) || 'https://api.superdapp.ai',
  });

  // Cache bot id for DM fallback construction
  let BOT_ID: string | null = null;
  const ensureBotId = async (): Promise<string | null> => {
    if (BOT_ID) return BOT_ID;
    try {
      const info: any = await agent.getClient().getBotInfo();
      BOT_ID = info?.data?.bot_info?.id || info?.bot_info?.id || null;
    } catch {}
    return BOT_ID;
  };

  const getPeerUserId = (raw: any, botId: string): string => {
    const sender = String(raw?.senderId || '');
    const member = raw?.memberId ? String(raw.memberId) : '';
    const owner = raw?.owner ? String(raw.owner) : '';
    if (sender === botId) return member || owner || '';
    return sender || member || owner || '';
  };

  // Send a DM: prefer provided roomId; fallback to computed deterministic room id
  const sendDM = async (raw: any, text: string) => {
    // 1) Prefer platform-provided roomId
    const rid = computeRoomId(raw);
    if (!rid) return;
    await agent.sendConnectionMessage(rid, text);
  };

  const sendDMButtons = async (
    raw: any,
    text: string,
    buttons: Array<Array<{ text: string; callback_data: string }>>
  ) => {
    const rid = computeRoomId(raw);
    if (!rid) return;
    await agent.sendReplyMarkupMessage('buttons', rid, text, buttons);
  };

  // Admin-only guard: true only for DM/connection messages
  const isAdminContext = (raw: any) => !isChannelMessage(raw);

  // /start: DM shows full welcome; in channel show public help only
  agent.addCommand('/start', async ({ message }) => {
    const raw = message.rawMessage;
    if (raw?.channelId) {
      if (joinedChannels.has(String(raw.channelId))) {
        await sendToChannel(
          String(raw.channelId),
          "👋 I'm alive! Public commands: /hello /faq /ask <q> /image /joke"
        );
      }
      return;
    }
    await sendDM(raw, fancy.welcome);
  });

  // /help: DM shows full help; in channel show public help only
  agent.addCommand('/help', async ({ message }) => {
    const raw = message.rawMessage;
    if (raw?.channelId) {
      if (joinedChannels.has(String(raw.channelId))) {
        await sendToChannel(
          String(raw.channelId),
          '🧭 Public Help:\n• /hello\n• /faq\n• /ask <q>\n• /image\n• /joke'
        );
      }
      return;
    }
    await sendDM(raw, fancy.help);
  });

  // Helper to retrieve groups robustly like TreasureHunt: try senderId, memberId, owner
  const fetchUserGroups = async (raw: any) => {
    const client = agent.getClient();
    const candidates = [raw?.senderId, raw?.memberId, raw?.owner].filter(
      Boolean
    );
    for (const userId of candidates) {
      try {
        const res: any = await client.getChannels(String(userId));
        const list: any[] = Array.isArray(res?.data) ? res.data : [];
        if (list.length) return list;
      } catch (_) {}
    }
    return [] as any[];
  };

  // /groups in DM: list owner/admin groups
  agent.addCommand('/groups', async ({ message }) => {
    if (!isAdminContext(message.rawMessage)) return;

    try {
      const list = await fetchUserGroups(message.rawMessage);
      if (!list.length) {
        await sendDM(
          message.rawMessage,
          '🫤 You do not own/admin any groups. Create one first!'
        );
        return;
      }
      const lines = list.map((g: any, i: number) => {
        const name = g.name || g.title || g.id;
        const avatar =
          g.avatar ||
          g.avatarUrl ||
          g.image ||
          g.imageUrl ||
          g.iconUrl ||
          g.photo ||
          g.picture;
        const parts = [
          `#${i + 1} ${name}`,
          avatar ? `   🖼️ ${avatar}` : '',
          `   id: ${g.id}`,
        ].filter(Boolean);
        return parts.join('\n');
      });
      const text = ['✨ Your groups:', '', lines.join('\n\n')].join('\n');
      await sendDM(message.rawMessage, text);
    } catch (e) {
      await sendDM(message.rawMessage, '⚠️ Failed to load your groups.');
    }
  });

  // /setup in DM: join a selected group
  agent.addCommand('/setup', async ({ message }) => {
    if (!isAdminContext(message.rawMessage)) return;
    try {
      const groups = await fetchUserGroups(message.rawMessage);
      if (!groups.length) {
        await sendDM(
          message.rawMessage,
          '😕 No groups found for your account. Create a super group first.'
        );
        return;
      }
      const buttons = groups.slice(0, 8).map((g: any) => [
        {
          text: `➕ ${g.name || g.title || g.id}`,
          callback_data: `SETUP:${g.id}`,
        },
      ]);
      await sendDMButtons(
        message.rawMessage,
        '🎛️ Select a group to connect:',
        buttons
      );
    } catch (e) {
      await sendDM(message.rawMessage, '⚠️ Error fetching groups.');
    }
  });

  // Handle selection buttons (setup and announce targets)
  agent.addCommand('callback_query', async ({ message }) => {
    const raw = message.rawMessage;
    const cb = message.callback_command || '';
    const data = message.data || '';

    if (cb === 'ANNOUNCE') {
      const channelId = data;
      const ownerId = String(raw.senderId || raw.memberId || raw.owner || '');
      const text = pendingAnnounce.get(ownerId);
      if (text) {
        await sendToChannel(channelId, `📣 Announcement: ${text}`);
        pendingAnnounce.delete(ownerId);
        await sendDM(raw, 'Announcement sent.');
      } else {
        await sendDM(raw, 'No pending announcement found.');
      }
      return;
    }

    if (cb === 'SETUP') {
      const channelId = data;
      try {
        await agent.getClient().joinChannel(channelId, message.rawMessage.id);
        joinedChannels.add(String(channelId));
        const ownerId = raw.senderId || raw.memberId || raw.owner;
        if (ownerId) {
          const key = String(ownerId);
          if (!ownerGroups.has(key)) ownerGroups.set(key, new Set());
          ownerGroups.get(key)!.add(channelId);
        }
        await sendDM(
          raw,
          `✅ Connected to group ${channelId}. You can now use /announce <text>.`
        );
        await sendToChannel(
          channelId,
          "👋 Hello everyone! I just joined this super group. I'll help with fun commands and announcements. Try /image or /joke!"
        );
      } catch (e) {
        await sendDM(
          raw,
          '❌ Failed to join that group. Make sure you are the owner/admin.'
        );
      }
      return;
    }
  });

  // /announce <text> in DM: send to selected group
  agent.addCommand('/announce', async ({ message }) => {
    if (!isAdminContext(message.rawMessage)) return;

    const text = (message.data || '').replace('/announce', '').trim();
    if (!text) {
      await sendDM(message.rawMessage, 'Usage: /announce <text>');
      return;
    }

    const ownerId = String(
      message.rawMessage.senderId ||
        message.rawMessage.memberId ||
        message.rawMessage.owner ||
        ''
    );
    const groups = ownerGroups.get(ownerId) || new Set<string>();

    if (!groups.size) {
      await sendDM(
        message.rawMessage,
        'No group configured. Run /setup first.'
      );
      return;
    }

    // If multiple groups configured, ask which one to announce to
    if (groups.size > 1) {
      pendingAnnounce.set(ownerId, text);
      const buttons = Array.from(groups)
        .slice(0, 8)
        .map((id) => [{ text: `📢 ${id}`, callback_data: `ANNOUNCE:${id}` }]);
      await sendDMButtons(
        message.rawMessage,
        'Select a group to send the announcement:',
        buttons
      );
      return;
    }

    const onlyId = Array.from(groups)[0];
    await sendToChannel(onlyId, `📣 Announcement: ${text}`);
    await sendDM(message.rawMessage, 'Announcement sent.');
  });

  // Helper for channel posting with explicit channel formatting
  const sendToChannel = async (channelId: string, text: string) => {
    const encoded = encodeURIComponent(JSON.stringify({ body: text }));
    const body = { body: JSON.stringify({ m: encoded, t: 'channel' }) } as any;
    return agent
      .getClient()
      .sendChannelMessage(channelId, { message: body, isSilent: false });
  };

  // Public commands: can be sent in group
  agent.addCommand('/hello', async ({ message }) => {
    const raw = message.rawMessage;
    if (isChannelMessage(raw)) {
      // reply to channel
      if (raw.channelId) {
        await sendToChannel(
          String(raw.channelId),
          '👋 Hello group! I am your community bot.'
        );
      }
    } else {
      await sendDM(raw, 'Use /hello inside the group.');
    }
  });

  agent.addCommand('/faq', async ({ message }) => {
    const raw = message.rawMessage;
    const faq =
      'FAQ:\n- How to ask? Use /ask <question>\n- Who can post? Members can use /ask';
    if (isChannelMessage(raw)) {
      if (raw.channelId) {
        await sendToChannel(String(raw.channelId), faq);
      }
    } else {
      await sendDM(raw, 'Use /faq inside the group to share with everyone.');
    }
  });

  // Public fun endpoints (local demo only echoes instructions)
  agent.addCommand('/image', async ({ message }) => {
    const raw = message.rawMessage;
    if (
      isChannelMessage(raw) &&
      raw.channelId &&
      joinedChannels.has(String(raw.channelId))
    ) {
      try {
        const resp = await axios.get('https://yesno.wtf/api');
        const data = resp.data as any;
        if (raw.channelId) {
          await sendToChannel(
            String(raw.channelId),
            `🎲 Answer: ${data.answer}\n🖼️ ${data.image}`
          );
        }
      } catch {
        if (raw.channelId) {
          await sendToChannel(
            String(raw.channelId),
            '⚠️ Failed to fetch image.'
          );
        }
      }
    } else {
      // Not a channel message; do not send a DM from a group command to avoid 400s on invalid connections
      return;
    }
  });

  agent.addCommand('/joke', async ({ message }) => {
    const raw = message.rawMessage;
    if (
      isChannelMessage(raw) &&
      raw.channelId &&
      joinedChannels.has(String(raw.channelId))
    ) {
      try {
        const resp = await axios.get(
          'https://official-joke-api.appspot.com/random_joke'
        );
        const data = resp.data as any;
        if (raw.channelId) {
          await sendToChannel(
            String(raw.channelId),
            `😂 ${data.setup}\n👉 ${data.punchline}`
          );
        }
      } catch {
        if (raw.channelId) {
          await sendToChannel(
            String(raw.channelId),
            '⚠️ Failed to fetch a joke.'
          );
        }
      }
    } else {
      // Not a channel message; do not send a DM from a group command to avoid 400s on invalid connections
      return;
    }
  });

  agent.addCommand('/ask', async ({ message }) => {
    const raw = message.rawMessage;
    const q = (message.data || '').replace('/ask', '').trim();
    if (!q) {
      if (isChannelMessage(raw) && raw.channelId) {
        await sendToChannel(String(raw.channelId), 'Usage: /ask <question>');
      } else {
        await sendDM(raw, 'Usage: /ask <question>');
      }
      return;
    }
    const answer = `Q: ${q}\nA: Thanks for asking! (demo answer)`;
    if (isChannelMessage(raw) && raw.channelId) {
      await sendToChannel(String(raw.channelId), answer);
    } else {
      await sendDM(raw, 'Ask inside the group so everyone can see the answer.');
    }
  });

  // Fallback message handler
  agent.addCommand('handleMessage', async ({ message }) => {
    const raw = message.rawMessage;
    const text = parseText(raw);

    if (isChannelMessage(raw)) {
      // Basic echo for non-command group messages
      if (text && !text.startsWith('/')) {
        if (raw.channelId) {
          await sendToChannel(String(raw.channelId), `You said: ${text}`);
        }
      }
    } else {
      await sendDM(raw, 'Type /help to see commands.');
    }
  });

  // Webhook endpoint
  app.post('/webhook', async (req, res) => {
    try {
      const body =
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      await agent.processRequest(body);
      res.status(200).json({ ok: true });
    } catch (e) {
      console.error('webhook error', e);
      res.status(500).json({ error: 'internal' });
    }
  });

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'super-group-starter',
      time: new Date().toISOString(),
    });
  });

  app.listen(PORT, () => {
    console.log(`Super Group Starter running on :${PORT}`);
    console.log(`POST webhook: http://localhost:${PORT}/webhook`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
