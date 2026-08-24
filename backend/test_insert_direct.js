const { MongoClient } = require('mongodb');
const { Resolver } = require('dns');

const resolver = new Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

resolver.resolveSrv('_mongodb._tcp.cluster0.nadsz43.mongodb.net', async (err, addrs) => {
  if (err) {
    console.error('SRV lookup error:', err);
    return;
  }
  
  const hosts = addrs.map(a => `${a.name}:${a.port}`).join(',');
  const uri = `mongodb://praveen23bce8642_db_user:123456%26@${hosts}/smart_resume?ssl=true&replicaSet=atlas-13tffj-shard-0&authSource=admin&retryWrites=true&w=majority`;

  console.log('Connecting via MongoClient...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas via MongoClient!');
    
    const db = client.db('smart_resume');
    const col = db.collection('candidates');
    
    const result = await col.insertOne({
      filename: 'praveen_resume.pdf',
      raw_text: 'Praveen KS - Senior Full Stack Developer (React, Node.js, MongoDB)',
      target_role: 'Full Stack Developer',
      target_company: 'Resumind ATS',
      candidate_profile: {
        name: 'Praveen KS',
        contact: { email: 'praveen@example.com' },
        skills: { technical: ['React', 'Node.js', 'MongoDB', 'TypeScript'] }
      },
      evaluation: {
        overall_score: 9,
        shortlisted: true,
        justification: 'Highly qualified Full Stack Candidate.'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`\n======================================================`);
    console.log(`🎉 CANDIDATE DOCUMENT INSERTED SUCCESSFULLY!`);
    console.log(`Inserted ID: ${result.insertedId}`);
    console.log(`Database Name: smart_resume`);
    console.log(`Collection Name: candidates`);
    console.log(`======================================================\n`);

    await client.close();
  } catch (e) {
    console.error('MongoClient Insert Error:', e.message);
  }
});
