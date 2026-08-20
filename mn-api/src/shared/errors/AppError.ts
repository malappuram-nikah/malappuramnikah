export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: string;

  constructor(message: string, statusCode = 500, isOperational = true, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad Request", errorCode?: string) {
    super(message, 400, true, errorCode);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized. Missing or invalid token.", errorCode?: string) {
    super(message, 401, true, errorCode);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden. You do not have permission to perform this action.", errorCode?: string) {
    super(message, 403, true, errorCode);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", errorCode?: string) {
    super(message, 404, true, errorCode);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists", errorCode?: string) {
    super(message, 409, true, errorCode);
  }
}

export class ValidationError extends AppError {
  public readonly errors?: any;

  constructor(message = "Validation failed", errors?: any) {
    super(message, 400, true, "VALIDATION_ERROR");
    this.errors = errors;
  }
}
