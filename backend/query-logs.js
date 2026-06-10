const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/spms_db');
  console.log('Connected to MongoDB');

  const logs = await mongoose.connection.db.collection('auditlogs')
    .find()
    .sort({ timestamp: -1 })
    .limit(10)
    .toArray();

  console.log('Recent Audit Logs:', JSON.stringify(logs, null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
