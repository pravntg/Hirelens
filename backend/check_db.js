const mongoose = require('mongoose');

const uri = 'mongodb://praveen23bce8642_db_user:123456%26@ac-fgnwf7r-shard-00-00.nadsz43.mongodb.net:27017,ac-fgnwf7r-shard-00-01.nadsz43.mongodb.net:27017,ac-fgnwf7r-shard-00-02.nadsz43.mongodb.net:27017/smart_resume?ssl=true&replicaSet=atlas-13tffj-shard-0&authSource=admin&retryWrites=true&w=majority';

async function checkDatabase() {
  console.log('Connecting to MongoDB Atlas Cluster via Direct Shard Nodes...');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected successfully to MongoDB Atlas Database!\n');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections in database [smart_resume]:', collections.map(c => c.name));

    const candidatesCount = await db.collection('candidates').countDocuments();
    console.log(`\n======================================================`);
    console.log(`📊 TOTAL CANDIDATE RECORDS STORED IN MONGODB: ${candidatesCount}`);
    console.log(`======================================================\n`);

    if (candidatesCount > 0) {
      const records = await db.collection('candidates').find({}).sort({ createdAt: -1 }).limit(10).toArray();
      console.log('Recent Stored Candidates in MongoDB Atlas:\n');
      records.forEach((c, index) => {
        console.log(`--- Record #${index + 1} ---`);
        console.log(`ID: ${c._id}`);
        console.log(`Filename: ${c.filename}`);
        console.log(`Candidate Name: ${c.candidate_profile?.name || c.name}`);
        console.log(`Target Role: ${c.target_role || c.role}`);
        console.log(`Overall Score: ${c.evaluation?.overall_score ?? c.overall_score}/10`);
        console.log(`Shortlisted: ${c.evaluation?.shortlisted ?? c.shortlisted}`);
        console.log(`AI Provider Used: ${c.provider_used}`);
        console.log(`Created At: ${c.createdAt}`);
        console.log(`-------------------------\n`);
      });
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
  }
}

checkDatabase();
