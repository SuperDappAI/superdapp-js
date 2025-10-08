import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { SuperDappAgent } from '../../src';
import axios from 'axios';

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
  help:
    '🧭 Help Menu\n\nAdmin (DM):\n• /setup — connect a group\n• /groups — list your groups\n• /announce <text> — post an announcement\n\nPublic (Group):\n• /hello — say hi\n• /faq — share FAQs\n• /ask <q> — ask a question\n• /image — fun yes/no GIF\n• /joke — random joke',
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

  // Helper: safe room id for DM replies
  const getRoomId = (raw: any) => {
    if (raw?.roomId) return String(raw.roomId);
    const memberId = raw?.memberId || raw?.owner || '';
    const senderId = raw?.senderId || '';
    if (senderId && memberId) return `${senderId}-${memberId}`;
    if (senderId) return String(senderId);
    if (memberId) return String(memberId);
    return '';
  };

  // Admin-only guard: true only for DM/connection messages
  const isAdminContext = (raw: any) => !isChannelMessage(raw);

  // /start: DM shows full welcome; in channel show public help only
  agent.addCommand('/start', async ({ message }) => {
    const raw = message.rawMessage;
    if (raw?.channelId) {
      if (joinedChannels.has(String(raw.channelId))) {
        await sendToChannel(String(raw.channelId), '👋 I\'m alive! Public commands: /hello /faq /ask <q> /image /joke');
      }
      return;
    }
    const roomId = getRoomId(raw);
    if (roomId) await agent.sendConnectionMessage(roomId, fancy.welcome);
  });

  // /help: DM shows full help; in channel show public help only
  agent.addCommand('/help', async ({ message }) => {
    const raw = message.rawMessage;
    if (raw?.channelId) {
      if (joinedChannels.has(String(raw.channelId))) {
        await sendToChannel(String(raw.channelId), '🧭 Public Help:\n• /hello\n• /faq\n• /ask <q>\n• /image\n• /joke');
      }
      return;
    }
    const roomId = getRoomId(raw);
    if (roomId) await agent.sendConnectionMessage(roomId, fancy.help);
  });

  // Helper to retrieve groups robustly like TreasureHunt: try senderId, memberId, owner
  const fetchUserGroups = async (raw: any) => {
    const client = agent.getClient();
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

  // /groups in DM: list owner/admin groups
  agent.addCommand('/groups', async ({ message }) => {
    const roomId = getRoomId(message.rawMessage);
    if (!isAdminContext(message.rawMessage)) return;

    try {
      const list = await fetchUserGroups(message.rawMessage);
      if (!list.length) {
        await agent.sendConnectionMessage(roomId, '🫤 You do not own/admin any groups. Create one first!');
        return;
      }
      const lines = list.map((g: any, i: number) => `#${i + 1} ${g.name || g.title || g.id} (id: ${g.id})`);
      await agent.sendConnectionMessage(roomId, `✨ Your groups:\n${lines.join('\n')}`);
    } catch (e) {
      await agent.sendConnectionMessage(roomId, '⚠️ Failed to load your groups.');
    }
  });

  // /setup in DM: join a selected group
  agent.addCommand('/setup', async ({ message }) => {
    const roomId = getRoomId(message.rawMessage);
    if (!isAdminContext(message.rawMessage)) return;

    try {
      const groups = await fetchUserGroups(message.rawMessage);
      if (!groups.length) {
        await agent.sendConnectionMessage(roomId, '😕 No groups found for your account. Create a super group first.');
        return;
      }
      const buttons = groups.slice(0, 8).map((g: any) => [{ text: `➕ ${g.name || g.title || g.id}`, callback_data: `SETUP:${g.id}` }]);
      await agent.sendReplyMarkupMessage('buttons', roomId, '🎛️ Select a group to connect:', buttons);
    } catch (e) {
      await agent.sendConnectionMessage(roomId, '⚠️ Error fetching groups.');
    }
  });

  // Handle setup selection buttons
  agent.addCommand('callback_query', async ({ message }) => {
    const raw = message.rawMessage;
    const roomId = getRoomId(raw);
    const cb = message.callback_command || '';
    const data = message.data || '';

    if (cb === 'SETUP') {
      const channelId = data;
      try {
        await agent.getClient().joinChannel(channelId, message.rawMessage.id);
        joinedChannels.add(String(channelId));
        // store ephemeral mapping locally for announce
        const ownerId = message.rawMessage.senderId || message.rawMessage.memberId || message.rawMessage.owner;
        if (ownerId) {
  // Handle selection buttons (setup and announce targets)
  agent.addCommand('callback_query', async ({ message }) => {
    const raw = message.rawMessage;
    const roomId = getRoomId(raw);
    const cb = message.callback_command || '';
    const data = message.data || '';

    if (cb === 'ANNOUNCE') {
      const channelId = data;
      const ownerId = String(raw.senderId || raw.memberId || raw.owner || '');
      const text = pendingAnnounce.get(ownerId);
      if (text) {
        await sendToChannel(channelId, `📣 Announcement: ${text}`);
        pendingAnnounce.delete(ownerId);
        await agent.sendConnectionMessage(roomId, 'Announcement sent.');
      } else {
        await agent.sendConnectionMessage(roomId, 'No pending announcement found.');
      }
      return;
    }

    if (cb === 'SETUP') {
      const channelId = data;
      try {
        await agent.getClient().joinChannel(channelId, message.rawMessage.id);
        const ownerId = raw.senderId || raw.memberId || raw.owner;
        if (ownerId) {
          const key = String(ownerId);
          if (!ownerGroups.has(key)) ownerGroups.set(key, new Set());
          ownerGroups.get(key)!.add(channelId);
        }
        await agent.sendConnectionMessage(roomId, `✅ Connected to group ${channelId}. You can now use /announce <text>.`);
        await sendToChannel(channelId, '👋 Hello everyone! I just joined this super group. I\'ll help with fun commands and announcements. Try /image or /joke!');
      } catch (e) {
        await agent.sendConnectionMessage(roomId, '❌ Failed to join that group. Make sure you are the owner/admin.');
      }
      return;
    }
  });

          const key = String(ownerId);
          if (!ownerGroups.has(key)) ownerGroups.set(key, new Set());
          ownerGroups.get(key)!.add(channelId);
        }
        await agent.sendConnectionMessage(roomId, `✅ Connected to group ${channelId}. You can now use /announce <text>.`);
        // Auto welcome announcement in the group
        await sendToChannel(channelId, '👋 Hello everyone! I just joined this super group. I\'ll help with fun commands and announcements. Try /image or /joke!');
      } catch (e) {
        await agent.sendConnectionMessage(roomId, '❌ Failed to join that group. Make sure you are the owner/admin.');
      }
      return;
    }
  });

  // /announce <text> in DM: send to selected group
  agent.addCommand('/announce', async ({ message }) => {
    const roomId = getRoomId(message.rawMessage);
    if (!isAdminContext(message.rawMessage)) return;

    const text = (message.data || '').replace('/announce', '').trim();
    if (!text) {
      await agent.sendConnectionMessage(roomId, 'Usage: /announce <text>');
      return;
    }

    const ownerId = String(message.rawMessage.senderId || message.rawMessage.memberId || message.rawMessage.owner || '');
    const groups = ownerGroups.get(ownerId) || new Set<string>();

    if (!groups.size) {
      await agent.sendConnectionMessage(roomId, 'No group configured. Run /setup first.');
      return;
    }

    // If multiple groups configured, ask which one to announce to
    if (groups.size > 1) {
      pendingAnnounce.set(ownerId, text);
      const buttons = Array.from(groups).slice(0, 8).map((id) => [{ text: `📢 ${id}`, callback_data: `ANNOUNCE:${id}` }]);
      await agent.sendReplyMarkupMessage('buttons', roomId, 'Select a group to send the announcement:', buttons);
      return;
    }

    const onlyId = Array.from(groups)[0];
    await sendToChannel(onlyId, `📣 Announcement: ${text}`);
    await agent.sendConnectionMessage(roomId, 'Announcement sent.');
  });

  // Helper for channel posting with explicit channel formatting
  const sendToChannel = async (channelId: string, text: string) => {
    const encoded = encodeURIComponent(JSON.stringify({ body: text }));
    const body = { body: JSON.stringify({ m: encoded, t: 'channel' }) } as any;
    return agent.getClient().sendChannelMessage(channelId, { message: body, isSilent: false });
  };

  // Public commands: can be sent in group
  agent.addCommand('/hello', async ({ message }) => {
    const raw = message.rawMessage;
    const roomId = getRoomId(raw);
    if (isChannelMessage(raw)) {
      // reply to channel
      if (raw.channelId) { await sendToChannel(String(raw.channelId), '👋 Hello group! I am your community bot.'); }
    } else {
      await agent.sendConnectionMessage(roomId, 'Use /hello inside the group.');
    }
  });

  agent.addCommand('/faq', async ({ message }) => {
    const raw = message.rawMessage;
    const roomId = getRoomId(raw);
    const faq = 'FAQ:\n- How to ask? Use /ask <question>\n- Who can post? Members can use /ask';
    if (isChannelMessage(raw)) {
      if (raw.channelId) { await sendToChannel(String(raw.channelId), faq); }
    } else {
      await agent.sendConnectionMessage(roomId, 'Use /faq inside the group to share with everyone.');
    }
  });

  // Public fun endpoints (local demo only echoes instructions)
  agent.addCommand('/image', async ({ message }) => {
    const raw = message.rawMessage;
    const roomId = getRoomId(raw);
    if (isChannelMessage(raw) && raw.channelId && joinedChannels.has(String(raw.channelId))) {
      try {
        const resp = await axios.get('https://yesno.wtf/api');
        const data = resp.data as any;
        if (raw.channelId) { await sendToChannel(String(raw.channelId), `🎲 Answer: ${data.answer}\n🖼️ ${data.image}`); }
      } catch {
        if (raw.channelId) { await sendToChannel(String(raw.channelId), '⚠️ Failed to fetch image.'); }
      }
    } else {
      // Not a channel message; do not send a DM from a group command to avoid 400s on invalid connections
      return;
    }
  });

  agent.addCommand('/joke', async ({ message }) => {
    const raw = message.rawMessage;
    const roomId = getRoomId(raw);
    if (isChannelMessage(raw) && raw.channelId && joinedChannels.has(String(raw.channelId))) {
      try {
        const resp = await axios.get('https://official-joke-api.appspot.com/random_joke');
        const data = resp.data as any;
        if (raw.channelId) { await sendToChannel(String(raw.channelId), `😂 ${data.setup}\n👉 ${data.punchline}`); }
      } catch {
        if (raw.channelId) { await sendToChannel(String(raw.channelId), '⚠️ Failed to fetch a joke.'); }
      }
    } else {
      // Not a channel message; do not send a DM from a group command to avoid 400s on invalid connections
      return;
    }

  });

  agent.addCommand('/ask', async ({ message }) => {
    const raw = message.rawMessage;
    const roomId = getRoomId(raw);
    const q = (message.data || '').replace('/ask', '').trim();
    if (!q) {
      if (isChannelMessage(raw) && raw.channelId) {
        await sendToChannel(String(raw.channelId), 'Usage: /ask <question>');
      } else {
        await agent.sendConnectionMessage(roomId, 'Usage: /ask <question>');
      }
      return;
    }
    const answer = `Q: ${q}\nA: Thanks for asking! (demo answer)`;
    if (isChannelMessage(raw) && raw.channelId) {
      await sendToChannel(String(raw.channelId), answer);
    } else {
      await agent.sendConnectionMessage(roomId, 'Ask inside the group so everyone can see the answer.');
    }
  });

  // Fallback message handler
  agent.addCommand('handleMessage', async ({ message }) => {
    const raw = message.rawMessage;
    const roomId = getRoomId(raw);
    const text = parseText(raw);

    if (isChannelMessage(raw)) {
      // Basic echo for non-command group messages
      if (text && !text.startsWith('/')) {
        if (raw.channelId) { await sendToChannel(String(raw.channelId), `You said: ${text}`); }
      }
    } else {
      await agent.sendConnectionMessage(roomId, 'Type /help to see commands.');
    }
  });

  // Webhook endpoint
  app.post('/webhook', async (req, res) => {
    try {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      await agent.processRequest(body);
      res.status(200).json({ ok: true });
    } catch (e) {
      console.error('webhook error', e);
      res.status(500).json({ error: 'internal' });
    }
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'super-group-starter', time: new Date().toISOString() });
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
