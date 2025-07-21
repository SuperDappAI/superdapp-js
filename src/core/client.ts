import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import FormData = require('form-data');
import {
  BotConfig,
  ApiResponse,
  BotCredentials,
  ChannelMessage,
  SendMessageOptions,
  PhotoMessageOptions,
  ReactionData,
  WalletKeys,
  UpdatesResponse,
} from '../types';
import { DEFAULT_CONFIG } from '../types/constants';

// Define constants for repeated endpoint resources
const AGENT_BOTS_ENDPOINT = 'v1/agent-bots/';
const AGENT_BOTS_CONNECTIONS_ENDPOINT = `${AGENT_BOTS_ENDPOINT}connections`;
const AGENT_BOTS_CHANNELS_ENDPOINT = `${AGENT_BOTS_ENDPOINT}channels`;
const SOCIAL_GROUPS_JOIN_ENDPOINT = `${AGENT_BOTS_ENDPOINT}social-groups/join`;
const SOCIAL_GROUPS_LEAVE_ENDPOINT = `${AGENT_BOTS_ENDPOINT}social-groups/leave`;

export class SuperDappClient {
  private axios: AxiosInstance;
  private config: BotConfig;

  constructor(config: BotConfig) {
    this.config = {
      baseUrl: config.baseUrl || DEFAULT_CONFIG.BASE_URL,
      apiToken: config.apiToken,
    };

    this.axios = axios.create({
      baseURL: `${this.config.baseUrl}/bot-${this.config.apiToken}`,
      timeout: DEFAULT_CONFIG.REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axios.interceptors.request.use(
      (config) => {
        console.log(
          `Making ${config.method?.toUpperCase()} request to: ${config.url}`
        );
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        console.error('Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Send a message to a channel
   */
  async sendChannelMessage(
    channelId: string,
    options: SendMessageOptions
  ): Promise<ApiResponse> {
    const response = await this.axios.post(
      `${AGENT_BOTS_CHANNELS_ENDPOINT}/${channelId}/messages`,
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
    const response = await this.axios.post(
      `${AGENT_BOTS_CONNECTIONS_ENDPOINT}/${roomId}/messages`,
      options
    );
    return response.data;
  }

  /**
   * Send a message with reply markup (buttons, multiselect, etc.)
   */
  async sendMessageWithReplyMarkup(
    roomId: string,
    message: string,
    replyMarkup: any,
    options?: { isSilent?: boolean }
  ): Promise<ApiResponse> {
    const messageBody = {
      body: message,
      reply_markup: replyMarkup,
    };

    const response = await this.axios.post(
      `${AGENT_BOTS_CONNECTIONS_ENDPOINT}/${roomId}/messages`,
      {
        message: messageBody,
        isSilent: options?.isSilent || false,
      }
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
    const replyMarkup = {
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
   * Send a message with multiselect options
   */
  async sendMessageWithMultiselect(
    roomId: string,
    message: string,
    options: Array<{ text: string; callback_data: string }>,
    config?: { isSilent?: boolean }
  ): Promise<ApiResponse> {
    const replyMarkup = {
      type: 'multiselect',
      actions: options.map((option) => [option]),
    };
    return this.sendMessageWithReplyMarkup(
      roomId,
      message,
      replyMarkup,
      config
    );
  }

  /**
   * Join a social group/channel
   */
  async joinChannel(
    channelNameOrId: string,
    messageId?: string
  ): Promise<ApiResponse> {
    const response = await this.axios.post(SOCIAL_GROUPS_JOIN_ENDPOINT, {
      channelNameOrId,
      messageId,
    });
    return response.data;
  }

  /**
   * Leave a social group/channel
   */
  async leaveChannel(
    channelNameOrId: string,
    messageId?: string
  ): Promise<ApiResponse> {
    const response = await this.axios.post(SOCIAL_GROUPS_LEAVE_ENDPOINT, {
      channelNameOrId,
      messageId,
    });
    return response.data;
  }

  /**
   * Make a custom API request
   */
  async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axios.request({
      method,
      url: endpoint,
      data,
      ...config,
    });
    return response.data;
  }
}
