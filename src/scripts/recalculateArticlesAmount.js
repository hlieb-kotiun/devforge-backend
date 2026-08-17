import 'dotenv/config';
import mongoose from 'mongoose';

import { connectMongoDB } from '../db/connectMongoDB.js';
import { Article } from '../models/article.js';
import { User } from '../models/user.js';

await connectMongoDB();

try {
  const users = await User.find().select('_id');

  for (const user of users) {
    const articlesAmount = await Article.countDocuments({
      ownerId: user._id,
    });

    await User.findByIdAndUpdate(user._id, { articlesAmount });
  }

  console.log(`Updated article counts for ${users.length} users`);
} finally {
  await mongoose.disconnect();
}
