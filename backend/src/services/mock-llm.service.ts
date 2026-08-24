import { CandidateProfile, EvaluationResult } from '../types/index.js';

export function runMockScreening(resumeText: string, jobDescription: string): { candidate_profile: CandidateProfile; evaluation: EvaluationResult } {
  // 1. Extract contact details via regex heuristics
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : null;

  const phoneMatch = resumeText.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : null;

  // 2. Extract candidate name from top lines
  const lines = resumeText.split('\n').map(l => l.trim()).filter(Boolean);
  let name = 'Candidate';
  if (lines.length > 0) {
    const firstLine = lines[0].replace(/^#+\s*/, '');
    if (firstLine.length < 40 && !firstLine.toLowerCase().includes('resume') && !firstLine.toLowerCase().includes('curriculum')) {
      name = firstLine;
    }
  }

  // 3. Extract technical & soft skills
  const commonTechSkills = [
    'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Python', 'Django',
    'FastAPI', 'Java', 'Spring Boot', 'C++', 'C#', '.NET', 'SQL', 'PostgreSQL', 'MongoDB', 'Redis',
    'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Git', 'GraphQL', 'REST API', 'Microservices',
    'Tailwind CSS', 'HTML', 'CSS', 'Redux', 'Jest', 'CI/CD', 'Machine Learning', 'PyTorch', 'TensorFlow'
  ];

  const foundTech = commonTechSkills.filter(skill => 
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(resumeText)
  );

  const commonSoftSkills = [
    'Problem Solving', 'Leadership', 'Communication', 'Teamwork', 'Agile', 'Scrum',
    'Critical Thinking', 'Time Management', 'Mentorship', 'Collaboration'
  ];

  const foundSoft = commonSoftSkills.filter(skill => 
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(resumeText)
  );

  // 4. Calculate skill overlap with JD
  const jdLower = jobDescription.toLowerCase();
  const jdMatchedTech = foundTech.filter(tech => jdLower.includes(tech.toLowerCase()));
  const missingTechFromJd = commonTechSkills.filter(skill => 
    jdLower.includes(skill.toLowerCase()) && !foundTech.map(t => t.toLowerCase()).includes(skill.toLowerCase())
  ).slice(0, 4);

  // 5. Estimate years of experience
  const expMatches = resumeText.match(/(\d+)\+?\s*(years|yrs)\s*(of)?\s*(experience|exp)?/i);
  let yearsExp: number | string = 3;
  if (expMatches && expMatches[1]) {
    yearsExp = parseInt(expMatches[1], 10);
  } else {
    const yearMatches = resumeText.match(/\b(20\d{2}|19\d{2})\b/g);
    if (yearMatches && yearMatches.length >= 2) {
      const years = yearMatches.map(Number).sort((a, b) => a - b);
      const diff = years[years.length - 1] - years[0];
      if (diff > 0 && diff <= 35) yearsExp = diff;
    }
  }

  // 6. Calculate category scores (0-100)
  const skillsScore = Math.min(100, Math.max(30, Math.round((jdMatchedTech.length / Math.max(1, foundTech.length + 2)) * 100) + 40));
  const expScore = Math.min(100, Math.max(40, (typeof yearsExp === 'number' ? yearsExp * 12 : 50)));
  const eduScore = resumeText.toLowerCase().includes('bachelor') || resumeText.toLowerCase().includes('master') || resumeText.toLowerCase().includes('degree') || resumeText.toLowerCase().includes('bs') || resumeText.toLowerCase().includes('ms') ? 85 : 70;
  const toneScore = 80;

  const weightedSum = (skillsScore * 0.4) + (expScore * 0.4) + (eduScore * 0.1) + (toneScore * 0.1);
  const overallScore = Math.min(10, Math.max(1, Math.round(weightedSum / 10)));
  const shortlisted = overallScore >= 7;

  // 7. Formulate strengths, missing requirements, and recruiter notes
  const strengths: string[] = [];
  if (foundTech.length > 0) {
    strengths.push(`Extensive technical stack matching JD: ${foundTech.slice(0, 4).join(', ')}`);
  }
  if (typeof yearsExp === 'number' && yearsExp >= 3) {
    strengths.push(`Solid industry experience (~${yearsExp} years) demonstrating career growth`);
  }
  if (foundSoft.length > 0) {
    strengths.push(`Demonstrated soft skills in ${foundSoft.slice(0, 3).join(', ')}`);
  }
  if (strengths.length === 0) {
    strengths.push('Clear resume presentation with relevant technical project history');
  }

  const missingRequirements: string[] = [];
  if (missingTechFromJd.length > 0) {
    missingRequirements.push(`Key JD technologies missing or not highlighted: ${missingTechFromJd.join(', ')}`);
  } else {
    missingRequirements.push('Could benefit from more quantifiable metrics in past role outcomes');
  }
  if (typeof yearsExp === 'number' && yearsExp < 3) {
    missingRequirements.push('Seniority level slightly below target JD expectations');
  }

  const recruiterNotes = shortlisted ? [
    `Strong candidate match (${overallScore}/10 overall fit score).`,
    'Recommend scheduling candidate for initial technical screening interview.',
    `Highlight expertise in ${foundTech.slice(0, 3).join(', ')} during initial call.`
  ] : [
    `Candidate fit score is ${overallScore}/10 (Under Review).`,
    'Hold candidate in talent pipeline or review for alternative junior/adjacent roles.',
    missingTechFromJd.length > 0 ? `Evaluate if missing skill (${missingTechFromJd[0]}) can be trained on the job.` : 'Review past portfolio projects for deeper evaluation.'
  ];

  return {
    candidate_profile: {
      name,
      contact: { email, phone },
      total_years_experience: typeof yearsExp === 'number' ? `${yearsExp} years` : yearsExp,
      education: [
        {
          degree: resumeText.toLowerCase().includes('master') ? 'Master of Science' : 'Bachelor of Science in Computer Science',
          institution: 'Accredited University',
          year: null
        }
      ],
      skills: {
        technical: foundTech.length > 0 ? foundTech : ['Software Engineering', 'Problem Solving'],
        soft: foundSoft.length > 0 ? foundSoft : ['Communication', 'Teamwork']
      }
    },
    evaluation: {
      overall_score: overallScore,
      shortlisted,
      breakdown: {
        skills_score: skillsScore,
        experience_score: expScore,
        education_score: eduScore,
        tone_and_relevance_score: toneScore
      },
      justification: `Candidate evaluated with an overall fit score of ${overallScore}/10 based on a ${skillsScore}% skills match and ${expScore}% experience relevance against the target job description.`,
      strengths,
      missing_requirements: missingRequirements,
      recruiter_notes: recruiterNotes
    }
  };
}
