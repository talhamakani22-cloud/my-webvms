const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const idx = line.indexOf('=');
    if (idx === -1) continue;

    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) continue;

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

// MongoDB connection string - update with your MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor_management';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      // These options are no longer needed in Mongoose 6+, but included for compatibility
    });

    // Only log after connection is ready
    if (conn && conn.connection && conn.connection.host && conn.connection.name) {
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📦 Database: ${conn.connection.name}`);
    } else {
      console.log('✅ MongoDB Connected');
    }

    // Drop old unique index on emiratesId to allow duplicates
    try {
      const collection = mongoose.connection.db.collection('visitors');
      const indexes = await collection.indexes();

      for (const index of indexes) {
        const isEmiratesIdIndex = index?.key && index.key.emiratesId === 1;
        if (isEmiratesIdIndex && index.unique) {
          console.log(`🔄 Dropping old unique index: ${index.name}`);
          await collection.dropIndex(index.name);
        }
      }

      // Ensure a non-unique index exists for query performance.
      await collection.createIndex({ emiratesId: 1 }, { unique: false, name: 'emiratesId_1' });
      console.log('✓ Emirates ID index ready (non-unique)');
    } catch (indexErr) {
      console.log(`⚠️ Index update skipped: ${indexErr.message}`);
    }

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      if (mongoose.connection && mongoose.connection.host && mongoose.connection.name) {
        console.log(`🔄 MongoDB reconnected: ${mongoose.connection.host}`);
        console.log(`📦 Database: ${mongoose.connection.name}`);
      } else {
        console.log('🔄 MongoDB reconnected');
      }
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    // Exit process with failure
    process.exit(1);
  }
};

// Graceful shutdown
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('👋 MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
};

module.exports = { connectDB, disconnectDB, mongoose };
