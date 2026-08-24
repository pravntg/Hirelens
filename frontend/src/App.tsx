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
    <div className="min-h-screen flex flex-col bg-[#0A0A0E] text-slate-100 relative overflow-hidden font-sans">
      
      {/* ATMOSPHERIC BACKGROUND EFFECTS */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top-Right Glowing Crimson Aura */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-[#FF1744]/20 via-[#D50000]/5 to-transparent rounded-full blur-3xl opacity-70 animate-pulse" style={{ animationDuration: '6s' }} />
        {/* Bottom-Left Ambient Charcoal-Red Glow */}
        <div className="absolute -bottom-40 -left-40 w-[700px] h-[700px] bg-gradient-to-tr from-[#900C3F]/15 via-[#FF1744]/5 to-transparent rounded-full blur-3xl opacity-60" />
        {/* Subtle Katana Blade Line */}
        <div className="absolute top-1/3 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF1744]/30 to-transparent shadow-[0_0_8px_#FF1744]" />
        
        {/* Floating Crimson Petals */}
        <div className="absolute top-16 left-12 w-2 h-4 bg-[#FF1744]/40 rounded-full rotate-45 blur-[0.5px] animate-petal" style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/4 right-20 w-3 h-5 bg-[#D50000]/50 rounded-full -rotate-12 blur-[0.5px] animate-petal" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/3 left-1/4 w-2 h-3 bg-[#FF5252]/40 rounded-full rotate-90 blur-[0.5px] animate-petal" style={{ animationDelay: '4s' }} />
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

        {/* Dark Cyber Footer */}
        <footer className="border-t border-[#FF1744]/20 bg-[#0C0C12]/90 backdrop-blur-md py-6 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF1744] shadow-[0_0_8px_#FF1744]" />
              <span className="font-extrabold text-slate-200 tracking-wider">HIRELENS ATS</span>
              <span className="text-slate-500">• Shadow Crimson AI Screener</span>
            </div>
            <p className="text-slate-400">Powered by Google Gemini 3.6 Flash & Groq Cloud AI</p>
          </div>
        </footer>
      </div>

    </div>
  );
};

export default App;
