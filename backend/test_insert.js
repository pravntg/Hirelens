const dns = require('dns');
const { Resolver } = require('dns');

// Use Google DNS for SRV resolution
const resolver = new Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

resolver.resolveSrv('_mongodb._tcp.cluster0.nadsz43.mongodb.net', async (err, addrs) => {
  if (err) {
    console.error('SRV lookup error:', err);
    return;
  }
  
  const mongoose = require('mongoose');
  const hosts = addrs.map(a => `${a.name}:${a.port}`).join(',');
  const uri = `mongodb://praveen23bce8642_db_user:123456%26@${hosts}/smart_resume?ssl=true&replicaSet=atlas-13tffj-shard-0&authSource=admin&retryWrites=true&w=majority`;

  console.log('Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas [smart_resume] database!');

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
      filename: 'sample_resume.pdf',
      raw_text: 'Praveen KS - Senior Full Stack Engineer with 4 years experience in React, Node.js, and MongoDB.',
      target_role: 'Full Stack Engineer',
      target_company: 'Tech Corp',
      job_description: 'Looking for React and Node.js developer.',
      provider_used: 'Groq Cloud AI (Qwen-3.6-27B)',
      candidate_profile: {
        name: 'Praveen KS',
        contact: { email: 'praveen@example.com', phone: '+919876543210' },
        total_years_experience: 4,
        current_or_latest_role: 'Senior Full Stack Engineer',
        skills: { technical: ['React', 'Node.js', 'TypeScript', 'MongoDB'], soft: ['Problem Solving'] }
      },
      evaluation: {
        overall_score: 9,
        shortlisted: true,
        breakdown: { skills_score: 90, experience_score: 85, education_score: 85, tone_and_relevance_score: 90 },
        justification: 'Strong match for Full Stack Engineer role.',
        ai_summary: 'Highly qualified candidate with 4 years full stack experience.',
        strengths: ['4 years full stack experience', 'Proficient in React, Node.js and MongoDB'],
        missing_requirements: [],
        recruiter_notes: ['Proceed to technical screen.']
      }
    });

    const saved = await doc.save();
    console.log(`\n======================================================`);
    console.log(`🎉 SUCCESS! SAVED RECORD TO MONGODB ATLAS!`);
    console.log(`Record ID: ${saved._id}`);
    console.log(`Database Name: smart_resume`);
    console.log(`Collection Name: candidates`);
    console.log(`======================================================\n`);

    await mongoose.disconnect();
  } catch (e) {
    console.error('Error saving to MongoDB:', e.message);
  }
});
