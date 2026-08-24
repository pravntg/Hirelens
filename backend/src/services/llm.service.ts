import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompts/screening.prompt.js';
import { EvaluationSchema } from '../utils/validator.js';
import { runMockScreening } from './mock-llm.service.js';
import { CandidateProfile, EvaluationResult } from '../types/index.js';

function extractAndParseJSON(rawText: string): any {
  if (!rawText) throw new Error('Empty response from LLM.');
  
  // 1. Remove thinking tags (<think>...</think>) from reasoning models like Qwen 3.6
  let cleaned = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. Remove markdown code fences (```json ... ```)
  cleaned = cleaned.replace(/```json/gi, '').replace(/```/gi, '').trim();

  // 3. Extract JSON object substring between first '{' and last '}'
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  const obj = JSON.parse(cleaned);

  // Normalize common wrapper keys if an LLM wraps the response in a root property
  const target = obj.result || obj.response || obj.data || obj.candidate_evaluation || obj;

  if (!target.evaluation && (target.assessment || target.scoring || target.fit_evaluation)) {
    target.evaluation = target.assessment || target.scoring || target.fit_evaluation;
  }

  return target;
}

export async function evaluateResumeWithLLM(
  resumeText: string,
  jobDescription: string,
  targetRole: string = 'Software Professional',
  providerPreference: string = 'auto',
  customApiKey?: string
): Promise<{ candidate_profile: CandidateProfile; evaluation: EvaluationResult; provider_used: string }> {
  
  const geminiApiKey = customApiKey?.startsWith('AIza') || customApiKey?.startsWith('AQ') ? customApiKey : (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  const groqApiKey = customApiKey?.startsWith('gsk_') ? customApiKey : process.env.GROQ_API_KEY;
  const openaiApiKey = customApiKey?.startsWith('sk-') ? customApiKey : process.env.OPENAI_API_KEY;

  const userPrompt = buildUserPrompt(resumeText, jobDescription, targetRole);

  // 1. Gemini REST API (gemini-3.6-flash) — Fast 0.5s response with AQ... or AIza... keys
  if (geminiApiKey) {
    try {
      console.log('Running REAL Live LLM evaluation using Google Gemini REST API (gemini-3.6-flash)...');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: SYSTEM_PROMPT + '\n\n' + userPrompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) {
          const parsed = extractAndParseJSON(text);
          const validated = EvaluationSchema.parse(parsed);
          console.log(`Google Gemini 3.6 Flash Evaluation Success! Score: ${validated.evaluation.overall_score}/10`);
          return {
            candidate_profile: validated.candidate_profile as CandidateProfile,
            evaluation: validated.evaluation as EvaluationResult,
            provider_used: 'Google Gemini 3.6 Flash (Live LLM)'
          };
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('Gemini REST API response error:', errJson?.error?.message || res.statusText);
      }
    } catch (err: any) {
      console.warn('Gemini REST API attempt failed:', err.message);
    }
  }

  // 2. Groq Cloud API (Qwen 3.6 27B)
  if (groqApiKey && (groqApiKey.startsWith('gsk_') || providerPreference === 'groq' || providerPreference === 'auto')) {
    try {
      console.log('Running REAL Live LLM evaluation using Groq Cloud API (Qwen 3.6 27B)...');
      const groq = new OpenAI({
        apiKey: groqApiKey,
        baseURL: 'https://api.groq.com/openai/v1'
      });

      const completion = await groq.chat.completions.create({
        model: 'qwen/qwen3.6-27b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      });

      const content = completion.choices[0]?.message?.content || '{}';
      const parsed = extractAndParseJSON(content);
      const validated = EvaluationSchema.parse(parsed);

      console.log(`Groq AI Evaluation Success! Score: ${validated.evaluation.overall_score}/10`);

      return {
        candidate_profile: validated.candidate_profile as CandidateProfile,
        evaluation: validated.evaluation as EvaluationResult,
        provider_used: 'Groq Cloud AI (Qwen-3.6-27B)'
      };
    } catch (err: any) {
      console.warn('Groq API call note:', err.message);
    }
  }

  // 3. Try OpenAI API
  if (openaiApiKey) {
    try {
      console.log('Running LLM evaluation using OpenAI API...');
      const openai = new OpenAI({ apiKey: openaiApiKey });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      });

      const content = completion.choices[0]?.message?.content || '{}';
      const parsed = extractAndParseJSON(content);
      const validated = EvaluationSchema.parse(parsed);

      return {
        candidate_profile: validated.candidate_profile as CandidateProfile,
        evaluation: validated.evaluation as EvaluationResult,
        provider_used: 'OpenAI GPT-4o (Live LLM)'
      };
    } catch (err: any) {
      console.warn('OpenAI API call note:', err.message);
    }
  }

  // STRICT RULE: THROW EXPLICIT ERROR — NO MOCK / DEFAULT FALLBACK ALLOWED!
  throw new Error('Live AI Evaluation Failed: Unable to reach Groq Cloud or Google Gemini AI endpoints. Please verify API key.');
}
