const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/spms_db');
  console.log('Connected to MongoDB');

  const admin = await mongoose.connection.db.collection('admins').findOne({ email: 'admin@society.com' });
  if (!admin) {
    console.log('Admin not found in DB!');
    process.exit(1);
  }

  console.log('Admin found in DB:', admin);

  const testPass = 'adminpassword123';
  const isMatch = await bcrypt.compare(testPass, admin.password);
  console.log(`Password "${testPass}" matches:`, isMatch);

  // Let's reset the admin password directly to 'adminpassword123' to be absolutely sure
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(testPass, salt);
  await mongoose.connection.db.collection('admins').updateOne(
    { email: 'admin@society.com' },
    { $set: { password: hash, loginAttempts: 0, lockUntil: null } }
  );
  console.log('Updated/Reset admin password to adminpassword123');

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
