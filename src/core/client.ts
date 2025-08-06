import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import https from 'node:https';
import FormData = require('form-data');
import { fileTypeFromBuffer } from 'file-type';
import {
  BotConfig,
  ApiResponse,
  SendMessageOptions,
  PhotoMessageOptions,
} from '../types';
import { DEFAULT_CONFIG } from '../types/constants';
import { formatBody } from '../utils';
import Thumbnail from '../utils/thumbnail';

// Define constants for repeated endpoint resources
const AGENT_BOTS_ENDPOINT = 'v1/agent-bots/';
const AGENT_BOTS_CONNECTIONS_ENDPOINT = `${AGENT_BOTS_ENDPOINT}connections`;
const AGENT_BOTS_CHANNELS_ENDPOINT = `${AGENT_BOTS_ENDPOINT}channels`;
const SOCIAL_GROUPS_JOIN_ENDPOINT = `${AGENT_BOTS_ENDPOINT}social-groups/join`;
const SOCIAL_GROUPS_LEAVE_ENDPOINT = `${AGENT_BOTS_ENDPOINT}social-groups/leave`;

export class SuperDappClient {
  private axios: AxiosInstance;
  private config: BotConfig;
  private thumbnail: ReturnType<typeof Thumbnail>;

  constructor(config: BotConfig) {
    this.config = {
      baseUrl: config.baseUrl || DEFAULT_CONFIG.BASE_URL,
      apiToken: config.apiToken,
    };

    this.axios = axios.create({
      baseURL: `${this.config.baseUrl}`,
      timeout: DEFAULT_CONFIG.REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiToken}`,
        'User-Agent': 'SuperDapp-Agent/1.0',
      },
    });

    // Initialize thumbnail utility
    this.thumbnail = Thumbnail();
    this.thumbnail.setDimensions(150, 150); // Default thumbnail size
    this.thumbnail.setQuality(0.7); // Default quality

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axios.interceptors.request.use(
      (config) => {
        console.log(
          `Making ${config.method?.toUpperCase()} request to: ${config.url}`
        );

        // Configure SSL verification based on environment
        if (!DEFAULT_CONFIG.SSL.REJECT_UNAUTHORIZED) {
          config.httpsAgent = new https.Agent({
            rejectUnauthorized: false,
          });
        }

        console.log('data:', config.data);
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

  /** Get user channels list */
  async getChannels(userId: string): Promise<ApiResponse> {
    const response = await this.axios.get(
      `${AGENT_BOTS_ENDPOINT}channels?userId=${userId}`
    );
    return response.data;
  }

  /**
   * Get bot channels list
   */
  async getBotChannels(): Promise<ApiResponse> {
    const response = await this.axios.get(`${AGENT_BOTS_ENDPOINT}channels/bot`);
    return response.data;
  }

  /**
   * Send an image to a channel
   */
  async sendChannelImage(
    channelId: string,
    options: PhotoMessageOptions
  ): Promise<ApiResponse> {
    // Step 1: Process file and validate
    const file = options.file;
    let fileToUpload: Buffer;

    if (Buffer.isBuffer(file)) {
      fileToUpload = file;
    } else {
      // Convert ReadableStream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of file) {
        chunks.push(Buffer.from(chunk));
      }
      fileToUpload = Buffer.concat(chunks);
    }

    // Validate image file type
    const fileType = await fileTypeFromBuffer(fileToUpload);
    if (!fileType || !fileType.mime.startsWith('image/')) {
      throw new Error(
        'Invalid image file type. Only image files are supported.'
      );
    }

    const fileSize = fileToUpload.length;
    const fileMime = fileType.mime;

    // Step 2: Request pre-signed URL from backend
    const uploadRequest = {
      message: {
        body: formatBody(options.message?.body || ''),
        fileSize,
        fileMime,
        type: encodeURIComponent(fileMime),
      },
    };

    const uploadResponse = await this.axios.post(
      `${AGENT_BOTS_CHANNELS_ENDPOINT}/${channelId}/messages`,
      uploadRequest
    );

    const { message, fileUrl, fileKey } = uploadResponse.data;

    // Step 3: Upload file to the pre-signed URL
    const formData = new FormData();
    Object.entries(fileUrl.fields).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    formData.append('file', fileToUpload);

    await axios({
      method: 'POST',
      url: fileUrl.url,
      data: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Step 4: Generate thumbnail
    let thumbnailData = '';
    try {
      const thumbnailResult = await this.thumbnail.createFromFile(
        fileToUpload,
        fileMime,
        true // Maintain aspect ratio
      );

      if (thumbnailResult.data && thumbnailResult.buffer) {
        thumbnailData = thumbnailResult.data;
      }
    } catch (error) {
      // Continue without thumbnail if generation fails
    }

    // Step 5: Update the message with attachment metadata
    const fileExtension = fileType.ext || 'jpg';
    const updateData = {
      body: options.message?.body || '',
      attachment: {
        id: fileKey,
        uuid: fileKey,
        name: `image_${Date.now()}.${fileExtension}`,
        size: fileSize,
        type: encodeURIComponent(fileMime),
        hmac: fileUrl.fields?.x_amz_meta_hmac || '',
        key: null,
        thumbnail: thumbnailData,
      },
    };

    const updateDataString = JSON.stringify({
      m: encodeURIComponent(JSON.stringify(updateData)),
      t: 'chat',
    });

    const finalResponse = await this.axios.put(
      `${AGENT_BOTS_CHANNELS_ENDPOINT}/${channelId}/messages/${message.id}`,
      { body: updateDataString }
    );

    return finalResponse.data;
  }

  /**
   * Get info about the authenticated bot
   */
  async getBotInfo(): Promise<ApiResponse> {
    const response = await this.axios.get(`${AGENT_BOTS_ENDPOINT}bot-info`);
    return response.data;
  }

  /**
   * Alias for getBotInfo (compatibilidade)
   */
  async getMe(): Promise<ApiResponse> {
    return this.getBotInfo();
  }

  /**
   * Configure thumbnail settings
   */
  setThumbnailDimensions(width: number, height: number): void {
    this.thumbnail.setDimensions(height, width);
  }

  /**
   * Configure thumbnail quality
   */
  setThumbnailQuality(quality: number): void {
    this.thumbnail.setQuality(quality);
  }
}
