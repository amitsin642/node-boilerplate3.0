export default class AppError extends Error {
  constructor(message, statusCode = 500, details = null, errorCode = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.details = details;
    this.errorCode = errorCode; // optional custom identifier
    Error.captureStackTrace(this, this.constructor);
  }
}
