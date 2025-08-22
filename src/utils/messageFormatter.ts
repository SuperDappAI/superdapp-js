import { ReplyMarkup } from '../types';

/**
 * Format a message body with optional reply markup
 */
export function formatBody(body: string, reply_markup?: ReplyMarkup): string {
  // Create the message object with proper JSON escaping
  const messageObj: { body: string; reply_markup?: ReplyMarkup } = { body };
  if (reply_markup) messageObj.reply_markup = reply_markup;
  const jsonString = JSON.stringify(messageObj);

  // Encode the JSON string to match the format expected by the web client
  return JSON.stringify({
    m: encodeURIComponent(jsonString),
    t: 'chat',
  });
}
