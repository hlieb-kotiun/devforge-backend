import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { Article } from '../models/article.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';

export const addArticleToSavedArticles = async (req, res) => {
  const userId = req.user._id ?? req.user.id;
  const { id } = req.params;

  const article = await Article.findById(id);
  if (!article) {
    throw createHttpError(404, 'Article not found');
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { savedArticles: id } },
    { new: true },
  );

  if (!updatedUser) {
    throw createHttpError(404, 'User not found');
  }

  return res.status(200).json(updatedUser);
};

export const deleteArticleFromSavedArticles = async (req, res) => {
  const userId = req.user._id ?? req.user.id;
  const { id } = req.params;

  const article = await Article.findById(id);
  if (!article) {
    throw createHttpError(404, 'Article not found');
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $pull: { savedArticles: id } },
    { new: true },
  );

  if (!updatedUser) {
    throw createHttpError(404, 'User not found');
  }

  return res.status(200).json(updatedUser);
};

export const getSavedArticles = async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId).populate('savedArticles');

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  res.status(200).json(user.savedArticles);
};

export const getUsers = async (req, res) => {
  const { page, perPage } = req.query;

  const skip = (page - 1) * perPage;

  const [users, totalCount] = await Promise.all([
    User.find().sort({ articlesAmount: -1, _id: 1 }).skip(skip).limit(perPage),
    User.countDocuments(),
  ]);

  const totalPages = Math.ceil(totalCount / perPage);

  res.status(200).json({
    authors: users,
    page,
    perPage,
    totalCount,
    totalPages,
  });
};

export const getUserById = async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  res.status(200).json(user);
};

export const updateUserAvatar = async (req, res) => {
  if (!req.file) {
    throw createHttpError(400, 'Avatar image file is required');
  }

  const userId = req.user._id ?? req.user.id;

  const avatarUrl = await uploadToCloudinary(req.file.buffer);

  const updatedUser = await User.findByIdAndUpdate(
    { _id: userId },
    { avatarUrl },
    { new: true, select: '-password -token' },
  );

  if (!updatedUser) {
    throw createHttpError(404, 'User not found');
  }

  res.status(200).json(updatedUser);
};

export const getTopCreators = async (req, res) => {
  const creators = await User.find({
    articlesAmount: { $gt: 0 },
  })
    .sort({
      articlesAmount: -1,
      _id: 1,
    })
    .limit(6)
    .select('_id username name avatarUrl articlesAmount');

  res.status(200).json({
    creators,
  });
};
