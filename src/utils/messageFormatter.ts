import { ReplyMarkup } from '../types';

/**
 * Format a message body with optional reply markup
 */
export function formatBody(data: {
  body: string;
  reply_markup?: ReplyMarkup;
  type: 'chat' | 'channel';
}): string {
  const { body, reply_markup, type } = data;

  // Create the message object with proper JSON escaping
  const messageObj: { body: string; reply_markup?: ReplyMarkup } = { body };
  if (reply_markup) messageObj.reply_markup = reply_markup;
  const jsonString = JSON.stringify(messageObj);

  // Encode the JSON string to match the format expected by the web client
  return JSON.stringify({
    m: encodeURIComponent(jsonString),
    t: type,
  });
}
