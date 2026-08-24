import React, { useState } from 'react';
import { Briefcase, Plus, Sparkles } from 'lucide-react';
import { JobDescription } from '../types';

interface JobsManagerProps {
  jobs: JobDescription[];
  onSelectJobForScreening: (job: JobDescription) => void;
  onCreateJob: (job: Partial<JobDescription>) => Promise<void>;
}

export const JobsManager: React.FC<JobsManagerProps> = ({
  jobs,
  onSelectJobForScreening,
  onCreateJob,
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    setLoading(true);
    try {
      await onCreateJob({ title, company, department, description });
      setTitle('');
      setCompany('');
      setDescription('');
      setShowCreate(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2 drop-shadow-[0_0_10px_rgba(255,23,68,0.4)]">
            <Briefcase className="w-5 h-5 text-[#FF1744]" />
            Target Job Descriptions
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage position requirements used for candidate screening.</p>
        </div>

        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center space-x-2 bg-gradient-to-r from-[#FF1744] to-[#D50000] hover:from-[#E60039] hover:to-[#FF1744] text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-lg shadow-[#FF1744]/30 border border-[#FF5252]/40"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Job</span>
        </button>
      </div>

      {/* Create Job Form */}
      {showCreate && (
        <form onSubmit={handleSubmit} className="cyber-card rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white">Create Target Job Description</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Job Title (e.g. Senior Frontend Engineer)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-[#0D0D14] border border-[#FF1744]/30 rounded-xl px-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF1744]"
            />
            <input
              type="text"
              placeholder="Company Name (e.g. TechCorp)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="bg-[#0D0D14] border border-[#FF1744]/30 rounded-xl px-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF1744]"
            />
            <input
              type="text"
              placeholder="Department (e.g. Product)"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="bg-[#0D0D14] border border-[#FF1744]/30 rounded-xl px-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF1744]"
            />
          </div>

          <textarea
            placeholder="Paste full Job Description text here..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            required
            className="w-full bg-[#0D0D14] border border-[#FF1744]/30 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#FF1744] placeholder:text-slate-500 resize-none"
          />

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/30"
            >
              Save Job Description
            </button>
          </div>
        </form>
      )}

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <div
            key={job._id || job.title}
            className="cyber-card rounded-3xl p-6 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-base text-white">{job.title}</h3>
                <span className="text-[11px] bg-[#0D0D14] border border-[#FF1744]/30 text-[#FF5252] px-2.5 py-0.5 rounded-full font-medium">
                  {job.department || 'Tech'}
                </span>
              </div>
              {job.company && <p className="text-xs text-slate-400 mb-3">{job.company}</p>}

              <p className="text-xs text-slate-300 line-clamp-4 font-mono bg-[#0D0D14]/80 p-3 rounded-xl border border-[#FF1744]/20 mb-4">
                {job.description}
              </p>
            </div>

            <button
              onClick={() => onSelectJobForScreening(job)}
              className="w-full bg-[#FF1744]/15 hover:bg-[#FF1744] text-[#FF5252] hover:text-white border border-[#FF1744]/40 font-semibold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(255,23,68,0.2)]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Use for Resume Screening</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
