const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);

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

function parseDbName(uri) {
  try {
    const withoutParams = uri.split('?')[0];
    const parts = withoutParams.split('/');
    const last = parts[parts.length - 1] || '';
    return last.trim();
  } catch (_) {
    return '';
  }
}

async function connect(uri) {
  return mongoose.createConnection(uri).asPromise();
}

async function migrateCollection(sourceDb, targetDb, collectionName) {
  const sourceCol = sourceDb.collection(collectionName);
  const targetCol = targetDb.collection(collectionName);

  const count = await sourceCol.countDocuments();
  console.log(`Migrating collection: ${collectionName} (${count} docs)`);

  if (count > 0) {
    const docs = await sourceCol.find({}).toArray();
    if (docs.length) {
      await targetCol.deleteMany({});
      await targetCol.insertMany(docs, { ordered: false });
    }
  } else {
    await targetCol.deleteMany({});
  }

  const indexes = await sourceCol.indexes();
  for (const idx of indexes) {
    if (idx.name === '_id_') continue;
    const { key, name, ...options } = idx;
    try {
      await targetCol.createIndex(key, { name, ...options });
    } catch (err) {
      // Ignore index conflicts and keep moving.
      console.log(`Index skipped on ${collectionName} (${name}): ${err.message}`);
    }
  }
}

async function run() {
  const sourceUri = process.env.SOURCE_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor_management';
  const targetUri = process.env.TARGET_MONGODB_URI;

  if (!targetUri) {
    console.error('TARGET_MONGODB_URI is required.');
    process.exit(1);
  }

  const sourceDbName = process.env.SOURCE_DB_NAME || parseDbName(sourceUri) || 'visitor_management';
  const targetDbName = process.env.TARGET_DB_NAME || parseDbName(targetUri) || sourceDbName;

  console.log(`Source DB: ${sourceDbName}`);
  console.log(`Target DB: ${targetDbName}`);

  const sourceConn = await connect(sourceUri);
  const targetConn = await connect(targetUri);

  try {
    const sourceDb = sourceConn.useDb(sourceDbName).db;
    const targetDb = targetConn.useDb(targetDbName).db;

    const collections = await sourceDb.listCollections({}, { nameOnly: true }).toArray();
    const names = collections.map((c) => c.name).filter(Boolean);

    if (!names.length) {
      console.log('No collections found in source database.');
      return;
    }

    for (const name of names) {
      await migrateCollection(sourceDb, targetDb, name);
    }

    console.log('Migration completed successfully.');
  } finally {
    await sourceConn.close();
    await targetConn.close();
  }
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
