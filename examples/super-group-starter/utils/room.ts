// Shared room id helpers for examples (Node and Worker)

export function getRoomId(msg: any): string {
  const memberId = msg?.memberId || msg?.owner || '';
  const senderId = msg?.senderId || '';
  if (memberId && senderId && memberId !== senderId)
    return `${memberId}-${senderId}`;
  if (memberId) return String(memberId);
  if (senderId) return String(senderId);
  return '';
}

export function isChannelMessage(msg: any): boolean {
  const t = msg?.body?.t;
  return (
    t === 'channel' ||
    msg?.isChannel === true ||
    !!msg?.channelId ||
    msg?.__typename === 'ChannelMessage'
  );
}
