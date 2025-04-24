import logger from './logging';

/**
 * Lớp lỗi cơ bản cho ứng dụng
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(message: string, code: string = 'INTERNAL_ERROR', statusCode: number = 500, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Lỗi xác thực
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
  }
}

/**
 * Lỗi phân quyền
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Not authorized', details?: any) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
  }
}

/**
 * Lỗi tham số không hợp lệ
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Lỗi không tìm thấy tài nguyên
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 'NOT_FOUND', 404, details);
  }
}

/**
 * Lỗi gọi API bên ngoài
 */
export class ExternalApiError extends AppError {
  constructor(message: string = 'External API error', details?: any) {
    super(message, 'EXTERNAL_API_ERROR', 502, details);
  }
}

/**
 * Lỗi quá nhiều yêu cầu
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super(message, 'RATE_LIMIT_ERROR', 429, details);
  }
}

/**
 * Xử lý lỗi tập trung cho ứng dụng
 * @param error Lỗi cần xử lý
 */
export function handleError(error: any): AppError {
  // Đã là AppError, trả về trực tiếp
  if (error instanceof AppError) {
    logger.error(`${error.code}: ${error.message}`, error.details);
    return error;
  }

  // Xử lý lỗi từ fetch API
  if (error.name === 'FetchError' || error.response) {
    const statusCode = error.response?.status || 500;
    const details = error.response?.data || {};
    
    logger.error(`API Error: ${error.message}`, { statusCode, details });
    
    if (statusCode === 401) {
      return new AuthenticationError('API authentication failed', details);
    } else if (statusCode === 403) {
      return new AuthorizationError('API access forbidden', details);
    } else if (statusCode === 404) {
      return new NotFoundError('API resource not found', details);
    } else if (statusCode === 429) {
      return new RateLimitError('API rate limit exceeded', details);
    } else {
      return new ExternalApiError(`API error: ${error.message}`, { statusCode, details });
    }
  }

  // Lỗi xác thực từ mô-đun xác thực
  if (error.name === 'AuthError') {
    logger.error(`Auth Error: ${error.message}`);
    return new AuthenticationError(error.message);
  }

  // Lỗi xác thực dữ liệu từ Zod
  if (error.name === 'ZodError') {
    logger.error(`Validation Error: ${error.message}`, error.errors);
    return new ValidationError('Invalid input data', error.errors);
  }

  // Lỗi không xác định, ghi nhật ký và trả về lỗi chung
  logger.error(`Unhandled Error: ${error.message || 'Unknown error'}`, error);
  return new AppError(
    error.message || 'An unexpected error occurred',
    'INTERNAL_ERROR',
    500,
    process.env.NODE_ENV === 'development' ? error : undefined
  );
}

/**
 * Chuyển đổi lỗi thành đối tượng phản hồi API
 */
export function errorToResponse(error: any): { success: false; error: { message: string; code: string; details?: any } } {
  const appError = error instanceof AppError ? error : handleError(error);
  
  return {
    success: false,
    error: {
      message: appError.message,
      code: appError.code,
      details: appError.details
    }
  };
}

export default {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ExternalApiError,
  RateLimitError,
  handleError,
  errorToResponse
}; 