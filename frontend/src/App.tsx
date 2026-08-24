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
  const [_loading, setLoading] = useState<boolean>(false);

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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#D1F4E0]/80 via-[#E0E7FF]/70 to-[#E9D5FF]/60 text-slate-900 relative overflow-hidden font-sans">
      
      {/* ATMOSPHERIC ENHANCV PASTEL MESH BACKGROUND EFFECTS */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top-Left Soft Mint Aura */}
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] bg-emerald-200/50 rounded-full blur-3xl opacity-70 animate-pulse" style={{ animationDuration: '8s' }} />
        {/* Top-Right Soft Periwinkle Lavender Glow */}
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] bg-indigo-200/50 rounded-full blur-3xl opacity-70" />
        {/* Bottom-Right Soft Purple Aura */}
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-3xl opacity-60" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          candidateCount={candidates.length}
          shortlistedCount={shortlistedCount}
        />

        {/* Main Body Canvas */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Tab Content */}
          {activeTab === 'upload' && (
            <UploadSection onScreenSuccess={handleScreenSuccess} />
          )}

          {activeTab === 'candidates' && (
            <div className="space-y-8">
              {/* KPI Stats Overview Bar — Moved to Candidate Pipeline Tab */}
              <StatsOverview candidates={candidates} />
              <CandidateList
                candidates={candidates}
                onSelectCandidate={(cand) => setSelectedCandidate(cand)}
                onDeleteCandidate={handleDeleteCandidate}
              />
            </div>
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

        {/* Enhancv Light Mint Footer */}
        <footer className="border-t border-slate-200 bg-white/90 backdrop-blur-md py-6 text-center text-xs text-slate-500 mt-12">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span className="font-extrabold text-slate-900 tracking-wider">HireLens ATS</span>
              <span className="text-slate-500 font-medium">• AI Resume Screener</span>
            </div>
            <p className="text-slate-500 font-medium">Powered by Google Gemini 1.5 Flash & Groq Cloud AI</p>
          </div>
        </footer>
      </div>

    </div>
  );
};

export default App;
