import { z } from 'zod';
import { ValidationError } from './errors';
import { SUPPORTED_IMAGE_TYPES, DEFAULT_CONFIG } from '../types/constants';

// Bot configuration validation
export const botConfigSchema = z.object({
  apiToken: z.string().min(1, 'API token is required'),
  baseUrl: z.string().url('Base URL must be a valid URL').optional(),
});

// Message options validation
export const messageOptionsSchema = z.object({
  message: z.object({
    body: z.string().min(1, 'Message body is required'),
    reply: z
      .object({
        id: z.string(),
        userId: z.string(),
        replyingTo: z.string(),
      })
      .optional(),
  }),
  isSilent: z.boolean().optional(),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(Buffer).or(z.any()), // Allow both Buffer and ReadableStream
  message: z
    .object({
      body: z.string(),
    })
    .optional(),
  isSilent: z.boolean().optional(),
});

// Image file validation
export const imageFileSchema = z.object({
  buffer: z.instanceof(Buffer),
  mimeType: z.enum([...SUPPORTED_IMAGE_TYPES]),
  size: z
    .number()
    .max(
      DEFAULT_CONFIG.MAX_FILE_SIZE,
      `File size must be less than ${DEFAULT_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`
    ),
});

// Webhook event validation
export const webhookEventSchema = z.object({
  body: z.union([
    z.string(),
    z.object({
      t: z.enum(['chat', 'channel']),
      m: z.any(),
    }),
  ]),
  memberId: z.string().optional(),
  senderId: z.string().optional(),
  owner: z.string().optional(),
});

// Command handler validation
export const commandHandlerSchema = z.object({
  command: z.string().min(1),
  handler: z.function().args(z.any()).returns(z.promise(z.void())),
});

// Validation functions
export function validateBotConfig(config: unknown) {
  try {
    return botConfigSchema.parse(config);
  } catch (error) {
    throw new ValidationError('Invalid bot configuration', error);
  }
}

export function validateMessageOptions(options: unknown) {
  try {
    return messageOptionsSchema.parse(options);
  } catch (error) {
    throw new ValidationError('Invalid message options', error);
  }
}

export function validateFileUpload(upload: unknown) {
  try {
    return fileUploadSchema.parse(upload);
  } catch (error) {
    throw new ValidationError('Invalid file upload', error);
  }
}

export function validateImageFile(file: unknown) {
  try {
    return imageFileSchema.parse(file);
  } catch (error) {
    throw new ValidationError('Invalid image file', error);
  }
}

export function validateWebhookEvent(event: unknown) {
  try {
    return webhookEventSchema.parse(event);
  } catch (error) {
    throw new ValidationError('Invalid webhook event', error);
  }
}

export function isValidFileSize(size: number): boolean {
  return size <= DEFAULT_CONFIG.MAX_FILE_SIZE;
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
