const mongoose = require('mongoose');
const logger = require('../utils/logger');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connectDb(uri, retries = 5) {
  mongoose.set('strictQuery', true);
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000, maxPoolSize: 10 });
      mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
      mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
      logger.info('MongoDB connected');
      return;
    } catch (err) {
      logger.error(`MongoDB connection failed (${attempt}/${retries})`, err);
      if (attempt === retries) throw err;
      await sleep(2000 * attempt);
    }
  }
}

const isConnected = () => mongoose.connection.readyState === 1;

module.exports = { connectDb, isConnected };
