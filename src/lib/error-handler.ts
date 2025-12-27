import { toast } from 'sonner'
import { telemetry } from './telemetry'

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AppError {
  code: ErrorCode
  message: string
  details?: Record<string, unknown>
  originalError?: Error
  retryable: boolean
}

export function createError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
  originalError?: Error
): AppError {
  return {
    code,
    message,
    details,
    originalError,
    retryable: isRetryable(code)
  }
}

export function isRetryable(code: ErrorCode): boolean {
  return [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.TIMEOUT_ERROR
  ].includes(code)
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message)
  }
  return 'Ein unbekannter Fehler ist aufgetreten'
}

export function getErrorCode(error: unknown): ErrorCode {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = error.code
    if (typeof code === 'string' && Object.values(ErrorCode).includes(code as ErrorCode)) {
      return code as ErrorCode
    }
  }
  return ErrorCode.UNKNOWN_ERROR
}

export interface RetryOptions {
  maxAttempts?: number
  delayMs?: number
  exponentialBackoff?: boolean
  onRetry?: (attempt: number, error: unknown) => void
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    exponentialBackoff = true,
    onRetry
  } = options

  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      const errorCode = getErrorCode(error)
      
      if (!isRetryable(errorCode) || attempt === maxAttempts) {
        throw error
      }

      if (onRetry) {
        onRetry(attempt, error)
      }

      const delay = exponentialBackoff 
        ? delayMs * Math.pow(2, attempt - 1)
        : delayMs

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

export interface ErrorHandlerOptions {
  showToast?: boolean
  toastTitle?: string
  toastDescription?: string
  trackTelemetry?: boolean
  context?: Record<string, unknown>
  retry?: boolean
  retryOptions?: RetryOptions
  onError?: (error: AppError) => void
}

export async function handleError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): Promise<void> {
  const {
    showToast = true,
    toastTitle,
    toastDescription,
    trackTelemetry = true,
    context,
    onError
  } = options

  const appError = normalizeError(error)

  if (trackTelemetry && appError.originalError) {
    telemetry.trackError(appError.originalError, {
      code: appError.code,
      ...context
    })
  }

  if (showToast) {
    const title = toastTitle || getDefaultErrorTitle(appError.code)
    const description = toastDescription || appError.message

    if (appError.retryable) {
      toast.error(title, {
        description,
        action: {
          label: 'Erneut versuchen',
          onClick: () => {
            if (onError) {
              onError(appError)
            }
          }
        }
      })
    } else {
      toast.error(title, { description })
    }
  }

  if (onError) {
    onError(appError)
  }
}

export function normalizeError(error: unknown): AppError {
  if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
    return error as AppError
  }

  const message = getErrorMessage(error)
  const code = getErrorCode(error)
  const originalError = error instanceof Error ? error : undefined

  return createError(code, message, undefined, originalError)
}

function getDefaultErrorTitle(code: ErrorCode): string {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
      return 'Validierungsfehler'
    case ErrorCode.NETWORK_ERROR:
      return 'Netzwerkfehler'
    case ErrorCode.TIMEOUT_ERROR:
      return 'Zeitüberschreitung'
    case ErrorCode.PARSE_ERROR:
      return 'Datenverarbeitungsfehler'
    case ErrorCode.PERMISSION_ERROR:
      return 'Keine Berechtigung'
    case ErrorCode.NOT_FOUND:
      return 'Nicht gefunden'
    case ErrorCode.CONFLICT:
      return 'Konflikt'
    default:
      return 'Fehler'
  }
}

export async function safeAsync<T>(
  fn: () => Promise<T>,
  options: ErrorHandlerOptions = {}
): Promise<T | null> {
  try {
    if (options.retry) {
      return await withRetry(fn, options.retryOptions)
    }
    return await fn()
  } catch (error) {
    await handleError(error, options)
    return null
  }
}

export function safeSync<T>(
  fn: () => T,
  options: ErrorHandlerOptions = {}
): T | null {
  try {
    return fn()
  } catch (error) {
    void handleError(error, options)
    return null
  }
}

export class ErrorBoundaryError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ErrorBoundaryError'
  }
}
