import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { STATUS_CODES } from 'http';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const isDev = process.env.NODE_ENV === 'development';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        if (status < 500 || isDev) {
          message = res;
          errors = [res];
        }
      } else if (res && typeof res === 'object') {
        const anyRes: any = res;
        let extractedMessage: string | null = null;
        let extractedErrors: string[] = [];

        if (anyRes.Message) {
          extractedMessage = anyRes.Message;
        } else if (anyRes.message) {
          if (Array.isArray(anyRes.message)) {
            extractedErrors = anyRes.message;
          } else if (typeof anyRes.message === 'string') {
            extractedMessage = anyRes.message;
          }
        }

        if (Array.isArray(anyRes.Errors)) {
          extractedErrors = anyRes.Errors;
        } else if (anyRes.error && typeof anyRes.error === 'string') {
          extractedErrors = [anyRes.error];
        }

        if (status < 500 || isDev) {
          if (extractedMessage) message = extractedMessage;
          if (extractedErrors.length) errors = extractedErrors;
          else errors = [message];
        }
      }
    } else {
      const anyEx: any = exception as any;
      this.logger.error('Unhandled exception', anyEx?.stack ?? exception);

      if (isDev) {
        message = anyEx?.message ?? message;
        errors = [message];
      } else {
        // For production, do not expose internal error details to clients.
        message = 'Internal server error';
        errors = [];
      }
    }

    // Ensure we have a friendly message for every HTTP status code
    const defaultReason = STATUS_CODES[status] ?? null;
    if (!message || message === 'Internal server error') {
      if (defaultReason) message = defaultReason;
    }

    // Ensure clients always get at least the message in Errors for clarity
    if ((!errors || errors.length === 0) && message) {
      errors = [message];
    }

    const body = {
      Success: false,
      Message: message,
      Object: null,
      Errors: errors,
      StatusCode: status
    };

    response.status(status).json(body);
  }
}
