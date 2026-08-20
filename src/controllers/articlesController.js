import createHttpError from 'http-errors';
import { Article } from '../models/article.js';
import { User } from '../models/user.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';

export const getArticlesController = async (req, res) => {
  const { page, limit, filter } = req.query;

  const skip = (page - 1) * limit;

  const sort = filter === 'popular' ? { rate: -1 } : {};

  const [articles, total] = await Promise.all([
    Article.find()
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('ownerId', 'name'),
    Article.countDocuments(),
  ]);

  res.status(200).json({
    articles,
    total,
    page,
    limit,
  });
};

export const getArticlesByAuthorController = async (req, res) => {
  const { ownerId } = req.params;
  const { page, limit } = req.query;

  const skip = (page - 1) * limit;

  const [articles, total] = await Promise.all([
    Article.find({ ownerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('ownerId', 'name'),
    Article.countDocuments({ ownerId }),
  ]);

  res.status(200).json({
    articles,
    total,
    page: Number(page),
    limit: Number(limit),
  });
};

export const getArticleByIdController = async (req, res) => {
  const { id } = req.params;

  const article = await Article.findById(id).populate('ownerId', 'name');

  if (!article) {
    return res.status(404).json({
      message: 'Article not found',
    });
  }

  res.status(200).json(article);
};

export const createArticle = async (req, res) => {
  const { title, desc, date, author } = req.body;
  const ownerId = req.user._id;

  // 2. Check if Multer attached the file buffer
  if (!req.file) {
    throw createHttpError(400, 'Image is required');
  }

  // 3. Upload the buffer directly to Cloudinary
  const imgUrl = await uploadToCloudinary(req.file.buffer);

  // 4. Save the returned Cloudinary URL string into MongoDB
  const newArticle = await Article.create({
    title,
    desc,
    img: imgUrl, // Save the secure Cloudinary URL here
    ownerId,
    date,
    author,
  });

  if (!newArticle) {
    throw createHttpError();
  }

  await User.findByIdAndUpdate(ownerId, { $inc: { articlesAmount: 1 } });

  res.status(201).json(newArticle);
};

export const deleteArticle = async (req, res) => {
  const { id } = req.params;
  const { _id: userId } = req.user;

  const article = await Article.findById(id);

  if (!article) {
    throw createHttpError(404, 'Article not found');
  }

  if (article.ownerId.toString() !== userId.toString()) {
    throw createHttpError(403, 'You can delete only your own articles');
  }

  await Article.findByIdAndDelete(id);

  await User.updateOne(
    {
      _id: article.ownerId,
      articlesAmount: { $gt: 0 },
    },
    {
      $inc: { articlesAmount: -1 },
    },
  );

  res.status(200).json({ message: 'Article deleted successfully' });
};

export const updateArticle = async (req, res) => {
  const { id } = req.params;
  const { _id: userId } = req.user;

  const article = await Article.findById(id);

  if (!article) {
    throw createHttpError(404, 'Article not found');
  }

  if (article.ownerId.toString() !== userId.toString()) {
    throw createHttpError(403, 'You can edit only your own articles');
  }

  const updateData = { ...req.body };

  if (req.file) {
    updateData.img = await uploadToCloudinary(
      req.file.buffer,
      'harmoniq/articles',
    );
  }

  const updatedArticle = await Article.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  res.status(200).json(updatedArticle);
};
