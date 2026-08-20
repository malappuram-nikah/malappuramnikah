export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = "INTERNAL_SERVER_ERROR", isOperational = true) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly errors?: any[];
  constructor(message = "Validation Error", errors?: any[]) {
    super(message, 422, "VALIDATION_ERROR");
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication Required") {
    super(message, 401, "UNAUTHENTICATED");
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Forbidden Access") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource Not Found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource Conflict") {
    super(message, 409, "CONFLICT");
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Database Error Occurred", isOperational = true) {
    super(message, 500, "DATABASE_ERROR", isOperational);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = "External Service Failure") {
    super(message, 502, "EXTERNAL_SERVICE_ERROR");
  }
}

// Backward compatibility alias classes
export class BadRequestError extends AppError {
  constructor(message = "Bad Request") {
    super(message, 400, "BAD_REQUEST");
  }
}

export class UnauthorizedError extends AuthenticationError {
  constructor(message = "Unauthorized") {
    super(message);
  }
}

export class ForbiddenError extends AuthorizationError {
  constructor(message = "Forbidden") {
    super(message);
  }
}
