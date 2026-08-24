import mongoose, { Schema, Document } from 'mongoose';

export interface IJobDocument extends Document {
  title: string;
  company?: string;
  department?: string;
  description: string;
  required_skills?: string[];
  createdAt?: Date;
}

const JobSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    company: { type: String, default: 'Tech Corp' },
    department: { type: String, default: 'Engineering' },
    description: { type: String, required: true },
    required_skills: [{ type: String }]
  },
  { timestamps: true }
);

export const JobModel = mongoose.model<IJobDocument>('Job', JobSchema);
