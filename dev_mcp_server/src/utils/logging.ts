/**
 * Hệ thống ghi nhật ký cho MCP Server
 * Cung cấp các tiện ích để ghi nhật ký với các cấp độ khác nhau
 */

// Màu sắc cho các cấp độ nhật ký khác nhau
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Cấp độ nhật ký
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

// Cấu hình hiện tại
let currentLogLevel = LogLevel.INFO;

// Định cấu hình cấp độ nhật ký
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

// Định dạng thời gian hiện tại
function formatTime(): string {
  const now = new Date();
  return now.toISOString();
}

// Các hàm ghi nhật ký

/**
 * Ghi nhật ký gỡ lỗi
 */
export function debug(message: string, context?: any): void {
  if (currentLogLevel <= LogLevel.DEBUG) {
    console.log(`${colors.gray}[${formatTime()}] DEBUG: ${message}${colors.reset}`, context || '');
  }
}

/**
 * Ghi nhật ký thông tin
 */
export function info(message: string, context?: any): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.log(`${colors.green}[${formatTime()}] INFO: ${message}${colors.reset}`, context || '');
  }
}

/**
 * Ghi nhật ký cảnh báo
 */
export function warn(message: string, context?: any): void {
  if (currentLogLevel <= LogLevel.WARN) {
    console.log(`${colors.yellow}[${formatTime()}] WARN: ${message}${colors.reset}`, context || '');
  }
}

/**
 * Ghi nhật ký lỗi
 */
export function error(message: string, context?: any): void {
  if (currentLogLevel <= LogLevel.ERROR) {
    console.error(`${colors.red}[${formatTime()}] ERROR: ${message}${colors.reset}`, context || '');
  }
}

/**
 * Ghi nhật ký lỗi nghiêm trọng
 */
export function fatal(message: string, context?: any): void {
  if (currentLogLevel <= LogLevel.FATAL) {
    console.error(`${colors.magenta}[${formatTime()}] FATAL: ${message}${colors.reset}`, context || '');
  }
}

/**
 * Ghi nhật ký API request
 */
export function apiRequest(method: string, url: string, params?: any): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.log(`${colors.cyan}[${formatTime()}] API ${method}: ${url}${colors.reset}`, params ? `\nParams: ${JSON.stringify(params)}` : '');
  }
}

/**
 * Ghi nhật ký kết quả API
 */
export function apiResponse(url: string, status: number, data?: any): void {
  if (currentLogLevel <= LogLevel.DEBUG) {
    const statusColor = status >= 400 ? colors.red : status >= 300 ? colors.yellow : colors.green;
    console.log(`${statusColor}[${formatTime()}] API RESPONSE ${status}: ${url}${colors.reset}`, data ? `\nData: ${JSON.stringify(data)}` : '');
  }
}

export default {
  debug,
  info,
  warn,
  error,
  fatal,
  apiRequest,
  apiResponse,
  setLogLevel,
  LogLevel
}; 