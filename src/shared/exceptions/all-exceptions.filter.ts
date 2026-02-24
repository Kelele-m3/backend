import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        errors = [res];
      } else if (res && typeof res === 'object') {
        const anyRes: any = res;
        if (anyRes.Message) {
          message = anyRes.Message;
        } else if (anyRes.message) {
          if (Array.isArray(anyRes.message)) {
            message = anyRes.message.join('; ');
          } else if (typeof anyRes.message === 'string') {
            message = anyRes.message;
          }
        }

        if (Array.isArray(anyRes.Errors)) {
          errors = anyRes.Errors;
        } else if (Array.isArray(anyRes.message)) {
          errors = anyRes.message;
        } else if (anyRes.error) {
          errors = [anyRes.error];
        } else {
          errors = [message];
        }
      }
    } else {
      const anyEx: any = exception as any;
      message = anyEx?.message ?? message;
      errors = [message];
      this.logger.error('Unhandled exception', anyEx?.stack ?? exception);
    }

    const body = {
      Success: false,
      Message: message,
      Object: null,
      Errors: errors,
    };

    response.status(status).json(body);
  }
}
