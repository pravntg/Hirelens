import { Candidate } from '../types';

export function exportCandidatePdf(candidate: Candidate) {
  const profile = candidate.candidate_profile;
  const contact = profile?.contact || { email: null, phone: null };
  const evaluation = candidate.evaluation;
  const breakdown = evaluation?.breakdown || { skills_score: 0, experience_score: 0, education_score: 0, tone_and_relevance_score: 0 };
  const overallPercentage = (evaluation?.overall_score || 0) * 10;
  const techSkills = profile?.skills?.technical || [];
  const strengths = evaluation?.strengths || [];
  const missing = evaluation?.missing_requirements || [];
  const notes = evaluation?.recruiter_notes || [];

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>ATS Candidate Assessment Report - ${profile?.name || 'Candidate'}</title>
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1e293b;
          background: #ffffff;
          margin: 0;
          padding: 0;
          font-size: 13px;
          line-height: 1.5;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #6366f1;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .brand {
          font-size: 18px;
          font-weight: 900;
          color: #4f46e5;
          letter-spacing: -0.5px;
        }
        .date {
          font-size: 11px;
          color: #64748b;
        }
        .profile-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .candidate-name {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
        }
        .role-company {
          font-size: 13px;
          font-weight: 700;
          color: #4f46e5;
          margin-bottom: 8px;
        }
        .contact-info {
          font-size: 11px;
          color: #475569;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .score-badge {
          background: #EEF2FF;
          border: 2px solid #6366f1;
          border-radius: 16px;
          padding: 12px 20px;
          text-align: center;
          min-width: 100px;
        }
        .score-number {
          font-size: 26px;
          font-weight: 900;
          color: #4f46e5;
          line-height: 1;
        }
        .score-label {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          color: #4338ca;
          margin-top: 4px;
        }
        .shortlist-tag {
          display: inline-block;
          font-size: 11px;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 20px;
          margin-top: 6px;
        }
        .shortlist-tag.yes {
          background: #dcfce7;
          color: #166534;
        }
        .shortlist-tag.no {
          background: #fef3c7;
          color: #92400e;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          color: #475569;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
        }
        .score-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px dashed #f1f5f9;
          font-size: 12px;
        }
        .score-val {
          font-weight: 800;
          color: #0f172a;
        }
        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }
        .skill-chip {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #334155;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
        }
        .list-item {
          margin-bottom: 4px;
          padding-left: 14px;
          position: relative;
          font-size: 12px;
        }
        .list-item::before {
          content: "•";
          position: absolute;
          left: 0;
          color: #6366f1;
          font-weight: bold;
        }
        .summary-box {
          background: #f8fafc;
          border-left: 4px solid #6366f1;
          padding: 12px;
          font-style: italic;
          color: #334155;
          margin-bottom: 20px;
          font-size: 12px;
        }
        .footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
          font-size: 10px;
          color: #94a3b8;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">Smart ATS Candidate Evaluation</div>
        <div class="date">Report Generated: ${new Date().toLocaleDateString()}</div>
      </div>

      <div class="profile-card">
        <div>
          <h1 class="candidate-name">${profile?.name || 'Unnamed Candidate'}</h1>
          <div class="role-company">
            Target Role: ${candidate.target_role} ${candidate.target_company ? '| ' + candidate.target_company : ''}
          </div>
          <div class="contact-info">
            ${contact.email ? `<span>Email: ${contact.email}</span>` : ''}
            ${contact.phone ? `<span>Phone: ${contact.phone}</span>` : ''}
            ${contact.location ? `<span>Location: ${contact.location}</span>` : ''}
            ${profile?.total_years_experience ? `<span>Experience: ${profile.total_years_experience}</span>` : ''}
          </div>
        </div>

        <div class="score-badge">
          <div class="score-number">${overallPercentage}%</div>
          <div class="score-label">ATS Fit Score</div>
          <div class="shortlist-tag ${evaluation?.shortlisted ? 'yes' : 'no'}">
            ${evaluation?.shortlisted ? 'Shortlisted' : 'Under Review'}
          </div>
        </div>
      </div>

      <div class="summary-box">
        "${evaluation?.ai_summary || evaluation?.justification || 'Evaluation completed by Smart ATS Screener.'}"
      </div>

      <div class="grid">
        <div>
          <div class="section-title">Dimensional Match Scores</div>
          <div class="score-row">
            <span>Skills Match Score</span>
            <span class="score-val">${breakdown.skills_score}/100</span>
          </div>
          <div class="score-row">
            <span>Experience Score</span>
            <span class="score-val">${breakdown.experience_score}/100</span>
          </div>
          <div class="score-row">
            <span>Education Score</span>
            <span class="score-val">${breakdown.education_score}/100</span>
          </div>
          <div class="score-row">
            <span>Tone & ATS Formatting Score</span>
            <span class="score-val">${breakdown.tone_and_relevance_score}/100</span>
          </div>
        </div>

        <div>
          <div class="section-title">Key Technical Skills</div>
          <div class="skills-container">
            ${techSkills.map(s => `<span class="skill-chip">${s}</span>`).join('')}
          </div>
        </div>
      </div>

      <div class="grid">
        <div>
          <div class="section-title">Candidate Strengths</div>
          ${strengths.map(s => `<div class="list-item">${s}</div>`).join('')}
        </div>

        <div>
          <div class="section-title">Gaps & Missing Requirements</div>
          ${missing.map(m => `<div class="list-item">${m}</div>`).join('')}
        </div>
      </div>

      ${notes.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <div class="section-title">Recruiter Action Notes</div>
          ${notes.map(n => `<div class="list-item">${n}</div>`).join('')}
        </div>
      ` : ''}

      <div class="footer">
        Confidential Recruiter Report • Smart Resume Screener ATS • Powered by Google Gemini & Groq Cloud AI
      </div>

      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 500);
        }
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    alert('Please allow popup windows in your browser to export the PDF report.');
  }
}
