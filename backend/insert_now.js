const dns = require('dns');
const { Resolver } = require('dns');

dns.setDefaultResultOrder('ipv4first');
const resolver = new Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

resolver.resolveSrv('_mongodb._tcp.cluster0.nadsz43.mongodb.net', async (err, addrs) => {
  if (err) {
    console.error('SRV lookup error:', err.message);
    return;
  }
  
  const mongoose = require('mongoose');
  const hosts = addrs.map(a => `${a.name}:${a.port}`).join(',');
  const uri = `mongodb://praveen23bce8642_db_user:123456%26@${hosts}/smart_resume?ssl=true&replicaSet=atlas-13tffj-shard-0&authSource=admin&retryWrites=true&w=majority`;

  console.log('Connecting to MongoDB Atlas Cluster...');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
    console.log('✅ Connected successfully to MongoDB Atlas!');

    const candidateSchema = new mongoose.Schema({
      filename: String,
      raw_text: String,
      target_role: String,
      target_company: String,
      job_description: String,
      provider_used: String,
      candidate_profile: mongoose.Schema.Types.Mixed,
      evaluation: mongoose.Schema.Types.Mixed
    }, { timestamps: true });

    const Candidate = mongoose.models.Candidate || mongoose.model('Candidate', candidateSchema);

    const doc = new Candidate({
      filename: 'praveen_resume.pdf',
      raw_text: 'Praveen KS - Senior Full Stack Software Engineer (React, Node.js, MongoDB, TypeScript)',
      target_role: 'Senior Full Stack Engineer',
      target_company: 'Resumind ATS',
      job_description: 'Looking for Senior React and Node.js engineer with database experience.',
      provider_used: 'Groq Cloud AI (Qwen-3.6-27B)',
      candidate_profile: {
        name: 'Praveen KS',
        contact: { email: 'praveen@example.com', phone: '+919876543210' },
        total_years_experience: 4,
        current_or_latest_role: 'Senior Full Stack Engineer',
        skills: { technical: ['React', 'Node.js', 'MongoDB', 'TypeScript'], soft: ['Problem Solving'] }
      },
      evaluation: {
        overall_score: 9,
        shortlisted: true,
        breakdown: { skills_score: 95, experience_score: 90, education_score: 85, tone_and_relevance_score: 90 },
        justification: 'Excellent match for Senior Full Stack Engineer role.',
        ai_summary: 'Highly qualified candidate with 4 years of full stack experience.',
        strengths: ['4 years full stack engineering experience', 'Proficient in React, Node.js and MongoDB'],
        missing_requirements: [],
        recruiter_notes: ['Fast track to technical screen.']
      }
    });

    const saved = await doc.save();
    console.log(`\n======================================================`);
    console.log(`🎉 SUCCESS! CREATED DATABASE [smart_resume] AND INSERTED DOCUMENT!`);
    console.log(`Document ID: ${saved._id}`);
    console.log(`======================================================\n`);

    await mongoose.disconnect();
  } catch (e) {
    console.error('❌ Insert Error:', e.message);
  }
});
