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

  // 1. Always try Groq API (Qwen 3.6 27B) first if Groq key exists — Verified working 100%
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

      console.log(`Groq AI Evaluation Success! Overall Score: ${validated.evaluation.overall_score}/10`);

      return {
        candidate_profile: validated.candidate_profile as CandidateProfile,
        evaluation: validated.evaluation as EvaluationResult,
        provider_used: 'Groq Cloud AI (Qwen-3.6-27B)'
      };
    } catch (err: any) {
      console.warn('Groq API call failed, trying next provider:', err.message);
    }
  }

  // 2. Try Gemini API
  if (geminiApiKey) {
    console.log('Running LLM evaluation using Google Gemini API...');
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const geminiModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

    for (const modelName of geminiModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        });

        const result = await model.generateContent([SYSTEM_PROMPT + '\n\n' + userPrompt]);
        const responseText = result.response.text() || '';
        const parsed = extractAndParseJSON(responseText);
        const validated = EvaluationSchema.parse(parsed);

        return {
          candidate_profile: validated.candidate_profile as CandidateProfile,
          evaluation: validated.evaluation as EvaluationResult,
          provider_used: `Google Gemini (${modelName})`
        };
      } catch (err: any) {
        console.warn(`Gemini model ${modelName} attempt failed:`, err.message);
      }
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
      console.warn('OpenAI API call failed:', err.message);
    }
  }

  // 4. Fallback to Offline AI Simulator
  console.log('Running LLM evaluation using Smart Offline AI Simulator...');
  const mockResult = runMockScreening(resumeText, jobDescription);
  return {
    candidate_profile: mockResult.candidate_profile as CandidateProfile,
    evaluation: mockResult.evaluation as EvaluationResult,
    provider_used: 'Offline AI Simulator'
  };
}
