import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { UploadSection } from './components/UploadSection';
import { CandidateList } from './components/CandidateList';
import { CandidateDetailModal } from './components/CandidateDetailModal';
import { JobsManager } from './components/JobsManager';
import { getCandidates, deleteCandidate, getJobs, createJob } from './services/api';
import { Candidate, JobDescription } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'candidates' | 'jobs'>('upload');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch candidates and jobs on mount - safe with empty fallbacks
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [candList, jobList] = await Promise.allSettled([getCandidates(), getJobs()]);
      if (candList.status === 'fulfilled') setCandidates(candList.value);
      if (jobList.status === 'fulfilled') setJobs(jobList.value);
    } catch (err) {
      // Safe fallback - app still works without DB data on initial load
      console.warn('Initial data fetch unavailable. App running in standalone mode.');
    } finally {
      setLoading(false);
    }
  };

  const handleScreenSuccess = (newCandidate: Candidate) => {
    setCandidates((prev) => [newCandidate, ...prev]);
    setSelectedCandidate(newCandidate); // Open deep dive immediately
  };

  const handleDeleteCandidate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this candidate record?')) return;
    try {
      await deleteCandidate(id);
      setCandidates((prev) => prev.filter((c) => c._id !== id));
      if (selectedCandidate?._id === id) {
        setSelectedCandidate(null);
      }
    } catch (err) {
      console.error('Error deleting candidate:', err);
    }
  };

  const handleCreateJob = async (jobData: Partial<JobDescription>) => {
    try {
      const newJob = await createJob(jobData);
      setJobs((prev) => [newJob, ...prev]);
    } catch (err) {
      console.error('Error creating job:', err);
    }
  };

  const handleSelectJobForScreening = (_job: JobDescription) => {
    setActiveTab('upload');
  };

  const shortlistedCount = candidates.filter((c) => c.evaluation?.shortlisted).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FFEDD5] text-[#7C2D12]">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        candidateCount={candidates.length}
        shortlistedCount={shortlistedCount}
      />

      {/* Main Body with Richer Dark Orange Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* KPI Stats Overview Bar */}
        <StatsOverview candidates={candidates} />

        {/* Tab Content */}
        {activeTab === 'upload' && (
          <UploadSection onScreenSuccess={handleScreenSuccess} />
        )}

        {activeTab === 'candidates' && (
          <CandidateList
            candidates={candidates}
            onSelectCandidate={(cand) => setSelectedCandidate(cand)}
            onDeleteCandidate={handleDeleteCandidate}
          />
        )}

        {activeTab === 'jobs' && (
          <JobsManager
            jobs={jobs}
            onSelectJobForScreening={handleSelectJobForScreening}
            onCreateJob={handleCreateJob}
          />
        )}

      </main>

      {/* Candidate Deep Dive Modal */}
      {selectedCandidate && (
        <CandidateDetailModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-[#FDBA74] bg-white py-6 text-center text-xs text-[#9A3412]">
        <p>Resumind ATS • AI Applicant Screener — Powered by Google Gemini & Groq Cloud AI</p>
      </footer>

    </div>
  );
};

export default App;
