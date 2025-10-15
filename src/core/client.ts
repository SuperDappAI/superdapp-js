import axios, { AxiosInstance } from 'axios';
import {
  ApiResponse,
  BotConfig,
  ReplyMarkup,
  SendMessageOptions,
  BotInfoResponse,
} from '../types';
import { DEFAULT_CONFIG } from '../types/constants';
import { createHttpsAgent, log, isCloudflareWorkers } from '../utils/adapters';

// Minimal ambient types for environments where DOM lib isn't present
type FetchRequestInit = {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  signal?: unknown;
};

// Define constants for repeated endpoint resources
const AGENT_BOTS_ENDPOINT = 'v1/agent-bots/';
const AGENT_BOTS_CONNECTIONS_ENDPOINT = `${AGENT_BOTS_ENDPOINT}connections`;
const AGENT_BOTS_CHANNELS_ENDPOINT = `${AGENT_BOTS_ENDPOINT}channels`;
const SOCIAL_GROUPS_JOIN_ENDPOINT = `${AGENT_BOTS_ENDPOINT}social-groups/join`;
const SOCIAL_GROUPS_LEAVE_ENDPOINT = `${AGENT_BOTS_ENDPOINT}social-groups/leave`;

// SSL Agent for Node.js only
const httpsAgent = createHttpsAgent();

export class SuperDappClient {
  private axios: AxiosInstance;
  private config: BotConfig;
  private useFetch: boolean;

  constructor(config: BotConfig) {
    this.config = {
      baseUrl: config.baseUrl || DEFAULT_CONFIG.BASE_URL,
      apiToken: config.apiToken,
    };

    // In Cloudflare Workers, prefer native fetch (axios XHR adapter can be unstable)
    this.useFetch = isCloudflareWorkers;

    this.axios = axios.create({
      baseURL: `${this.config.baseUrl}`,
      timeout: DEFAULT_CONFIG.REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiToken}`,
        'User-Agent': 'SuperDapp-Agent/1.0',
      },
      // Only set httpsAgent in Node.js environment
      ...(httpsAgent && { httpsAgent }),
    });

    if (!this.useFetch) {
      this.setupInterceptors();
    }
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axios.interceptors.request.use(
      (config) => {
        log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
        return config;
      },
      (error) => {
        log('Request error: ' + error, 'error');
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        log(
          'Response error: ' +
            JSON.stringify(error.response?.data || error.message, null, 2),
          'error'
        );
        return Promise.reject(error);
      }
    );
  }

  private buildUrl(path: string): string {
    const base = String(this.config.baseUrl || '').replace(/\/$/, '');
    const p = path.replace(/^\//, '');
    return `${base}/${p}`;
  }

  private async fetchJson<T = unknown>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = this.buildUrl(path);
    const init: FetchRequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiToken}`,
        'User-Agent': 'SuperDapp-Agent/1.0',
      },
    } as const;
    const req: FetchRequestInit = { ...init };
    if (method === 'POST') {
      req.body = JSON.stringify(body ?? {});
    }
    log(`(fetch) ${method} ${url}`);
    const fetchUnknown: unknown = (globalThis as unknown as { fetch?: unknown })
      .fetch;
    if (typeof fetchUnknown !== 'function') {
      throw new Error('fetch is not available in this environment');
    }
    const fetchFn = fetchUnknown as (
      input: string,
      init?: FetchRequestInit
    ) => Promise<{
      ok: boolean;
      status: number;
      text(): Promise<string>;
      json(): Promise<unknown>;
    }>;
    const res = await fetchFn(url, req);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    const json = (await res.json()) as T;
    return json;
  }

  /**
   * Send a message to a channel
   */
  async sendChannelMessage(
    channelId: string,
    options: SendMessageOptions
  ): Promise<ApiResponse> {
    if (this.useFetch) {
      return this.fetchJson(
        'POST',
        `${AGENT_BOTS_CHANNELS_ENDPOINT}/${encodeURIComponent(channelId)}/messages`,
        options
      );
    }
    const response = await this.axios.post(
      `${AGENT_BOTS_CHANNELS_ENDPOINT}/${encodeURIComponent(channelId)}/messages`,
      options
    );
    return response.data;
  }

  /**
   * Send a message to a connection (DM)
   */
  async sendConnectionMessage(
    roomId: string,
    options: SendMessageOptions
  ): Promise<ApiResponse> {
    if (this.useFetch) {
      return this.fetchJson(
        'POST',
        `${AGENT_BOTS_CONNECTIONS_ENDPOINT}/${encodeURIComponent(roomId)}/messages`,
        options
      );
    }
    const response = await this.axios.post(
      `${AGENT_BOTS_CONNECTIONS_ENDPOINT}/${encodeURIComponent(roomId)}/messages`,
      options
    );
    return response.data;
  }

  /**
   * Utility: Build a connection id from sender and receiver ids.
   * According to platform convention: connectionId = `${senderId}-${receiverId}`
   */
  buildConnectionId(senderId: string, receiverId: string): string {
    return `${String(senderId)}-${String(receiverId)}`;
  }

  /**
   * Send a DM by specifying sender and receiver IDs (constructs the connection id)
   */
  async sendConnectionMessageByUsers(
    senderId: string,
    receiverId: string,
    options: SendMessageOptions
  ): Promise<ApiResponse> {
    const connectionId = this.buildConnectionId(senderId, receiverId);
    return this.sendConnectionMessage(connectionId, options);
  }

  /**
   * Send a message with reply markup (buttons, multiselect, etc.)
   */
  async sendMessageWithReplyMarkup(
    roomId: string,
    message: string,
    replyMarkup: ReplyMarkup,
    options?: { isSilent?: boolean }
  ): Promise<ApiResponse> {
    const messageBody = {
      body: message,
      reply_markup: replyMarkup,
    };

    const payload = {
      message: messageBody,
      isSilent: options?.isSilent || false,
    };
    if (this.useFetch) {
      return this.fetchJson(
        'POST',
        `${AGENT_BOTS_CONNECTIONS_ENDPOINT}/${encodeURIComponent(roomId)}/messages`,
        payload
      );
    }
    const response = await this.axios.post(
      `${AGENT_BOTS_CONNECTIONS_ENDPOINT}/${encodeURIComponent(roomId)}/messages`,
      payload
    );
    return response.data;
  }

  /**
   * Send a message with button actions
   */
  async sendMessageWithButtons(
    roomId: string,
    message: string,
    buttons: Array<{ text: string; callback_data: string }>,
    options?: { isSilent?: boolean }
  ): Promise<ApiResponse> {
    const replyMarkup: ReplyMarkup = {
      type: 'buttons',
      actions: buttons.map((button) => [button]),
    };
    return this.sendMessageWithReplyMarkup(
      roomId,
      message,
      replyMarkup,
      options
    );
  }

  /**
   * Join a social group/channel
   */
  async joinChannel(
    channelNameOrId: string,
    messageId?: string
  ): Promise<ApiResponse> {
    const body = { channelNameOrId, messageId };
    if (this.useFetch) {
      return this.fetchJson('POST', SOCIAL_GROUPS_JOIN_ENDPOINT, body);
    }
    const response = await this.axios.post(SOCIAL_GROUPS_JOIN_ENDPOINT, body);
    return response.data;
  }

  /**
   * Leave a social group/channel
   */
  async leaveChannel(
    channelNameOrId: string,
    messageId?: string
  ): Promise<ApiResponse> {
    const body = { channelNameOrId, messageId };
    if (this.useFetch) {
      return this.fetchJson('POST', SOCIAL_GROUPS_LEAVE_ENDPOINT, body);
    }
    const response = await this.axios.post(SOCIAL_GROUPS_LEAVE_ENDPOINT, body);
    return response.data;
  }

  /** Get user channels list */
  async getChannels(userId: string): Promise<ApiResponse> {
    const path = `${AGENT_BOTS_ENDPOINT}channels?userId=${userId}`;
    if (this.useFetch) {
      return this.fetchJson('GET', path);
    }
    const response = await this.axios.get(path);
    return response.data;
  }

  /**
   * Get bot channels list
   */
  async getBotChannels(): Promise<ApiResponse> {
    const path = `${AGENT_BOTS_ENDPOINT}my-channels`;
    if (this.useFetch) {
      return this.fetchJson('GET', path);
    }
    const response = await this.axios.get(path);
    return response.data;
  }

  /**
   * Get info about the authenticated bot
   */
  async getBotInfo(): Promise<ApiResponse<BotInfoResponse>> {
    const path = `${AGENT_BOTS_ENDPOINT}bot-info`;
    if (this.useFetch) {
      return this.fetchJson('GET', path);
    }
    const response = await this.axios.get(path);
    return response.data;
  }

  /**
   * Alias for getBotInfo (compatibilidade)
   */
  async getMe(): Promise<ApiResponse<BotInfoResponse>> {
    return this.getBotInfo();
  }

  // ===== Message update/delete APIs =====

  /**
   * Update a direct message in a connection (DM)
   * Accepts a string or an object with { body }
   */
  async updateConnectionMessage(
    connectionId: string,
    messageId: string,
    message: string | { body: string }
  ): Promise<ApiResponse> {
    const payload = { message };
    const response = await this.axios.put(
      `${AGENT_BOTS_CONNECTIONS_ENDPOINT}/${encodeURIComponent(
        connectionId
      )}/messages/${encodeURIComponent(messageId)}`,
      payload
    );
    return response.data;
  }

  /** Delete a direct message in a connection (DM) */
  async deleteConnectionMessage(
    connectionId: string,
    messageId: string
  ): Promise<ApiResponse> {
    const response = await this.axios.delete(
      `${AGENT_BOTS_CONNECTIONS_ENDPOINT}/${encodeURIComponent(
        connectionId
      )}/messages/${encodeURIComponent(messageId)}`
    );
    return response.data;
  }

  /**
   * Update a message in a channel
   * Accepts a string or an object with { body }
   */
  async updateChannelMessage(
    channelId: string,
    messageId: string,
    message: string | { body: string }
  ): Promise<ApiResponse> {
    const payload = { message };
    const response = await this.axios.put(
      `${AGENT_BOTS_CHANNELS_ENDPOINT}/${encodeURIComponent(
        channelId
      )}/messages/${encodeURIComponent(messageId)}`,
      payload
    );
    return response.data;
  }

  /** Delete a message in a channel */
  async deleteChannelMessage(
    channelId: string,
    messageId: string
  ): Promise<ApiResponse> {
    const response = await this.axios.delete(
      `${AGENT_BOTS_CHANNELS_ENDPOINT}/${encodeURIComponent(
        channelId
      )}/messages/${encodeURIComponent(messageId)}`
    );
    return response.data;
  }
}
