import { AxiosError } from 'axios';
import { ErrorCode } from '@/shared/types';

interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export function parseApiError(error: unknown): ApiError {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as Partial<ApiError>;
    return {
      code: data.code ?? ErrorCode.InternalError,
      message: data.message ?? 'Unknown error occurred',
      details: data.details,
    };
  }
  
  if (error instanceof Error) {
    return {
      code: ErrorCode.InternalError,
      message: error.message,
    };
  }
  
  return {
    code: ErrorCode.InternalError,
    message: 'An unexpected error occurred',
  };
}

export function getErrorMessage(error: unknown): string {
  const apiError = parseApiError(error);
  
  // User-friendly error messages
  const messages: Partial<Record<ErrorCode, string>> = {
    [ErrorCode.ValidationError]: '输入数据验证失败',
    [ErrorCode.NotFound]: '请求的资源不存在',
    [ErrorCode.RateLimited]: '请求过于频繁，请稍后再试',
    [ErrorCode.InternalError]: '服务器内部错误',
    [ErrorCode.EngineUnavailable]: '翻译引擎暂时不可用',
    [ErrorCode.VersionConflict]: '数据已被其他用户修改，请刷新后重试',
  };
  
  return messages[apiError.code] || apiError.message;
}

export function isVersionConflict(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 409;
  }
  return false;
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return !error.response && !!error.request;
  }
  return false;
}
