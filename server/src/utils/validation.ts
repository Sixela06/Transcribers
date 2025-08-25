import Joi from 'joi';

// Auth validation schemas
export const validateRegister = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required',
    }),
    firstName: Joi.string().min(2).max(50).optional().messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
    }),
    lastName: Joi.string().min(2).max(50).optional().messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
    }),
  });

  return schema.validate(data);
};

export const validateLogin = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  });

  return schema.validate(data);
};

// Video validation schemas
export const validateTranscribeRequest = (data: any) => {
  const schema = Joi.object({
    url: Joi.string().uri().required().messages({
      'string.uri': 'Please provide a valid YouTube URL',
      'any.required': 'YouTube URL is required',
    }),
  });

  return schema.validate(data);
};

export const validateSummarizeRequest = (data: any) => {
  const schema = Joi.object({
    url: Joi.string().uri().required().messages({
      'string.uri': 'Please provide a valid YouTube URL',
      'any.required': 'YouTube URL is required',
    }),
    summaryType: Joi.string().valid('STANDARD', 'DETAILED', 'BULLET_POINTS').optional(),
  });

  return schema.validate(data);
};

// Chat validation schemas
export const validateSendMessage = (data: any) => {
  const schema = Joi.object({
    message: Joi.string().min(1).max(2000).required().messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 2000 characters',
      'any.required': 'Message is required',
    }),
  });

  return schema.validate(data);
};

// User validation schemas
export const validateUpdateProfile = (data: any) => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(50).optional().messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
    }),
    lastName: Joi.string().min(2).max(50).optional().messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
    }),
    email: Joi.string().email().optional().messages({
      'string.email': 'Please provide a valid email address',
    }),
  });

  return schema.validate(data);
};