import { Joi, Segments } from 'celebrate';
import { isValidObjectId } from 'mongoose';

const objectIdValidator = (value, helpers) => {
  return !isValidObjectId(value)
    ? helpers.message('Invalid id format.')
    : value;
};

export const getArticlesByAuthorValidation = {
  [Segments.PARAMS]: Joi.object({
    ownerId: Joi.string().custom(objectIdValidator).required(),
  }),
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(12),
  }),
};

export const getArticleByIdSchema = {
  [Segments.PARAMS]: Joi.object({
    id: Joi.string().custom(objectIdValidator).required(),
  }),
};

export const getArticlesSchema = {
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(6),
    filter: Joi.string().valid('all', 'popular').default('all'),
  }),
};

export const createArticlesSchema = {
  [Segments.BODY]: Joi.object().keys({
    title: Joi.string().min(3).max(48).required(),
    desc: Joi.string().min(100).max(4000).required(),
    date: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .required(),
    author: Joi.string().min(4).max(50).required(),
  }),
};

export const updateArticleSchema = {
  [Segments.PARAMS]: Joi.object({
    id: Joi.string().custom(objectIdValidator).required(),
  }),
  [Segments.BODY]: Joi.object({
    title: Joi.string().min(3).max(48),
    desc: Joi.string().min(100).max(4000),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    img: Joi.string().uri(),
  }).min(1),
};

export const deleteArticleSchema = {
  [Segments.PARAMS]: Joi.object({
    id: Joi.string().custom(objectIdValidator).required(),
  }),
};
