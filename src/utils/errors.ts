export class SuperDappError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SuperDappError';
  }
}

export class ValidationError extends SuperDappError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends SuperDappError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class APIError extends SuperDappError {
  constructor(message: string, statusCode: number = 500, details?: unknown) {
    super(message, 'API_ERROR', statusCode, details);
    this.name = 'APIError';
  }
}

export class FileProcessingError extends SuperDappError {
  constructor(message: string, details?: unknown) {
    super(message, 'FILE_PROCESSING_ERROR', 400, details);
    this.name = 'FileProcessingError';
  }
}

export function handleError(error: unknown): SuperDappError {
  if (error instanceof SuperDappError) {
    return error;
  }

  if (error instanceof Error) {
    return new SuperDappError(error.message, 'UNKNOWN_ERROR');
  }

  return new SuperDappError('An unknown error occurred', 'UNKNOWN_ERROR');
}

export function logError(error: SuperDappError, context?: string): void {
  const logMessage = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    },
    context,
  };

  console.error('SuperDapp Error:', JSON.stringify(logMessage, null, 2));
}
