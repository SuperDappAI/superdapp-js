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
import { DEFAULT_CONFIG, API_ENDPOINTS } from '../types/constants';

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
   * Get bot information
   */
  async getMe(): Promise<ApiResponse<BotCredentials>> {
    const response = await this.axios.get(API_ENDPOINTS.ME);
    return response.data;
  }

  /**
   * Get bot credentials for AppSync connection
   */
  async getCredentials(): Promise<ApiResponse<BotCredentials>> {
    const response = await this.axios.get(API_ENDPOINTS.CREDENTIALS);
    return response.data;
  }

  /**
   * Get messages from a channel
   */
  async getChannelMessages(
    channelId: string,
    nextToken?: string
  ): Promise<ApiResponse<ChannelMessage>> {
    const params = nextToken ? { nextToken } : {};
    const response = await this.axios.get(
      `${API_ENDPOINTS.MESSAGES_CHANNEL}/${channelId}`,
      { params }
    );
    return response.data;
  }

  /**
   * Send a message to a channel
   */
  async sendChannelMessage(
    channelId: string,
    options: SendMessageOptions
  ): Promise<ApiResponse> {
    const response = await this.axios.post(
      `${API_ENDPOINTS.MESSAGES_CHANNEL}/${channelId}`,
      options
    );
    return response.data;
  }

  /**
   * Send a photo message to a channel
   */
  async sendChannelPhoto(
    channelId: string,
    options: PhotoMessageOptions
  ): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', options.file);
    formData.append('message', JSON.stringify(options.message));

    if (options.isSilent !== undefined) {
      formData.append('isSilent', String(options.isSilent));
    }

    const response = await this.axios.post(
      `${API_ENDPOINTS.MESSAGES_CHANNEL}/${channelId}/photo`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
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
      `${API_ENDPOINTS.MESSAGES_CONNECTION}/${roomId}`,
      options
    );
    return response.data;
  }

  /**
   * Get message reactions
   */
  async getMessageReactions(
    type: 'dm' | 'channel',
    messageId: string
  ): Promise<ApiResponse> {
    const response = await this.axios.get(
      `${API_ENDPOINTS.MESSAGES_REACTION}/${type}/${messageId}`
    );
    return response.data;
  }

  /**
   * Add or remove a reaction to a message
   */
  async sendMessageReaction(
    type: 'dm' | 'channel',
    messageId: string,
    reaction: ReactionData
  ): Promise<ApiResponse> {
    const response = await this.axios.post(
      `${API_ENDPOINTS.MESSAGES_REACTION}/${type}/${messageId}`,
      reaction
    );
    return response.data;
  }

  /**
   * Get recent updates
   */
  async getUpdates(
    limitChannelMessages = 10,
    limitConnectionMessages = 10
  ): Promise<ApiResponse<UpdatesResponse>> {
    const response = await this.axios.get(API_ENDPOINTS.UPDATES, {
      params: {
        limit_channels_messages: limitChannelMessages,
        limit_connections_messages: limitConnectionMessages,
      },
    });
    return response.data;
  }

  /**
   * Get wallet keys
   */
  async getWalletKeys(): Promise<ApiResponse<WalletKeys>> {
    const response = await this.axios.get(API_ENDPOINTS.WALLET_KEYS);
    return response.data;
  }

  /**
   * Join a social group/channel
   */
  async joinChannel(
    channelNameOrId: string,
    messageId?: string
  ): Promise<ApiResponse> {
    const response = await this.axios.post(API_ENDPOINTS.SOCIAL_GROUPS_JOIN, {
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
    const response = await this.axios.post(API_ENDPOINTS.SOCIAL_GROUPS_LEAVE, {
      channelNameOrId,
      messageId,
    });
    return response.data;
  }

  /**
   * Get online presence for a user
   */
  async getOnlinePresence(userId: string): Promise<ApiResponse> {
    const response = await this.axios.get(`/online/${userId}`);
    return response.data;
  }

  /**
   * Get direct messages for a dialog
   */
  async getDirectMessages(
    dialogId: string,
    nextToken?: string
  ): Promise<ApiResponse> {
    const params = nextToken ? { nextToken } : {};
    const response = await this.axios.get(`/messages/dm/${dialogId}`, {
      params,
    });
    return response.data;
  }

  /**
   * Get all channels for a user
   */
  async getChannels(userId: string): Promise<ApiResponse> {
    const response = await this.axios.get(`/channels`, { params: { userId } });
    return response.data;
  }

  /**
   * Update a channel message
   */
  async updateChannelMessage(
    channelId: string,
    messageId: string,
    data: any
  ): Promise<ApiResponse> {
    const response = await this.axios.put(
      `/messages/channel/${channelId}/${messageId}`,
      data
    );
    return response.data;
  }

  /**
   * Get channel members
   */
  async getChannelMembers(
    channelId: string,
    nextToken?: string
  ): Promise<ApiResponse> {
    const params = nextToken ? { nextToken } : {};
    const response = await this.axios.get(`/members/${channelId}`, { params });
    return response.data;
  }

  /**
   * Send typing status
   */
  async sendTypingStatus(
    type: 'dm' | 'channel',
    chatId: string,
    data: any
  ): Promise<ApiResponse> {
    const response = await this.axios.post(`/typing/${type}/${chatId}`, data);
    return response.data;
  }

  /**
   * Social group APIs
   */
  async getPopularGroups(n?: number): Promise<ApiResponse> {
    const response = await this.axios.get(`/social-groups/popular`, {
      params: { n },
    });
    return response.data;
  }

  async searchGroups(q: string, n?: number): Promise<ApiResponse> {
    const response = await this.axios.get(`/social-groups/search`, {
      params: { q, n },
    });
    return response.data;
  }

  async getGroupsByTopic(topic: string, n?: number): Promise<ApiResponse> {
    const response = await this.axios.get(`/social-groups/topic`, {
      params: { topic, n },
    });
    return response.data;
  }

  async getUserGroups(userId: string): Promise<ApiResponse> {
    const response = await this.axios.get(
      `/social-groups/user-groups/${userId}`
    );
    return response.data;
  }

  async getPopularTopics(n?: number): Promise<ApiResponse> {
    const response = await this.axios.get(`/social-groups/popular-topics`, {
      params: { n },
    });
    return response.data;
  }

  async getGroup(groupId: string): Promise<ApiResponse> {
    const response = await this.axios.get(`/social-groups/${groupId}`);
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
