import axios from 'axios';
import { BotConfig } from '../types';

export default async function request(
  config: BotConfig,
  method: string,
  path: string,
  body?: any
) {
  const baseUrl = config.baseUrl;
  const apiToken = config.apiToken;

  const url = `${baseUrl}/${path}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiToken}`,
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': 'SuperDapp-Agent/1.0',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  console.log(`[REQUEST] Making ${method} request to ${url}`);
  console.log('[REQUEST] Headers:', {
    ...headers,
    Authorization: 'Bearer ***',
  }); // Mask token for logging

  if (body) {
    console.log('[REQUEST] Body:', JSON.stringify(body));
  }

  try {
    const response = await axios({
      method,
      url,
      headers,
      ...(body && { data: body }),
      validateStatus: () => true, // Accept any status code
      timeout: 30000, // 30 second timeout
    });

    console.log(`[REQUEST] Received response: ${response.status}`);

    if (response.status >= 400) {
      console.error(`[REQUEST] Error response:`, response.data);
      throw new Error(
        `HTTP ${response.status}: ${JSON.stringify(response.data)}`
      );
    }

    return response.data;
  } catch (error: any) {
    console.error(`[REQUEST] Error making request: ${error.message}`);
    if (error.response) {
      console.error(`[REQUEST] Response status: ${error.response.status}`);
      console.error(`[REQUEST] Response data:`, error.response.data);
    } else if (error.request) {
      console.error('[REQUEST] No response received:', error.request);
    } else {
      console.error('[REQUEST] Error setting up request:', error.message);
    }
    throw error;
  }
}
