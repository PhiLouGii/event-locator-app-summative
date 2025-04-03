class CustomError extends Error {
    constructor(message, statusCode, details) {
      super(message);
      this.statusCode = statusCode;
      this.details = details;
    }
  }
  
  class ValidationError extends CustomError {
    constructor(message, details) {
      super(message, 400, details);
    }
  }
  
  class NotFoundError extends CustomError {
    constructor(message) {
      super(message, 404);
    }
  }
  
  class ConflictError extends CustomError {
    constructor(message) {
      super(message, 409);
    }
  }
  
  module.exports = {
    CustomError,
    ValidationError,
    NotFoundError,
    ConflictError
  };