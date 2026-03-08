import { InterviewType, AnalyzeResponse } from '../types';

// Simple prompt builder for interview answer analysis
export function buildAnalysisPrompt(
  question: string,
  answer: string,
  interviewType: InterviewType
): string {
  const typeDescriptions: Record<InterviewType, string> = {
    cs_ops: 'Customer Support / Systems Enablement',
    tech_support: 'Technical Support / SaaS',
    behavioral: 'Behavioral / STAR Method'
  };

  return `You are an expert interview coach specializing in ${typeDescriptions[interviewType]} interviews.

Your task is to analyze a candidate's answer to an interview question and provide constructive feedback.

## Interview Question:
${question}

## Candidate's Answer:
${answer}

## Instructions:
Please analyze the answer and provide feedback in the following JSON format:

{
  "strengths": [
    "Specific strength 1 - what the candidate did well",
    "Specific strength 2",
    "Specific strength 3"
  ],
  "gaps": [
    "Specific gap or area for improvement 1",
    "Specific gap or area for improvement 2",
    "Specific gap or area for improvement 3"
  ],
  "followUp": "A relevant follow-up question that would help the candidate elaborate or clarify their answer. This should be a single question that digs deeper into their experience or approach."
}

## Guidelines:
- Provide 2-3 specific, actionable strengths
- Provide 2-3 specific, actionable gaps or improvement areas
- The follow-up question should be relevant to the original question and the candidate's answer
- Be constructive and professional in tone
- For behavioral questions, consider STAR method completeness (Situation, Task, Action, Result)
- For technical/support questions, consider technical accuracy, troubleshooting approach, and communication clarity

Return ONLY the JSON object, no additional text.`;
}

// Mock AI analysis for development/demo purposes
// In production, this would call OpenAI, Gemini, or another LLM API
export async function analyzeAnswerWithAI(
  question: string,
  answer: string,
  interviewType: InterviewType
): Promise<AnalyzeResponse> {
  // Check if we have an API key for a real LLM service
  const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (apiKey) {
    // In a real implementation, you would call the LLM API here
    // For now, we'll use the mock implementation
    return mockAnalyzeAnswer(question, answer, interviewType);
  }
  
  // Default to mock analysis for demo/portfolio purposes
  return mockAnalyzeAnswer(question, answer, interviewType);
}

// Mock analysis function for demo purposes
// Provides realistic feedback without requiring API keys
function mockAnalyzeAnswer(
  question: string,
  answer: string,
  interviewType: InterviewType
): AnalyzeResponse {
  const answerLength = answer.length;
  const hasSpecificExample = /\b(for example|such as|instance|specifically|in one case|when I|at my previous)/i.test(answer);
  const hasMetrics = /\b(percent|%|number|increased|decreased|reduced|improved|by \d|time|hours|days)/i.test(answer);
  const hasSTAR = /\b(situation|context|task|action|result|outcome|learned)/i.test(answer);
  
  // Build strengths based on answer quality
  const strengths: string[] = [];
  
  if (hasSpecificExample) {
    strengths.push('Provided specific examples to support your points');
  }
  if (hasMetrics) {
    strengths.push('Used metrics and quantifiable results to demonstrate impact');
  }
  if (answerLength > 200) {
    strengths.push('Answer was comprehensive and well-developed');
  } else if (answerLength > 100) {
    strengths.push('Answer was concise and to the point');
  }
  if (hasSTAR && interviewType === 'behavioral') {
    strengths.push('Good use of STAR method structure (Situation, Task, Action, Result)');
  }
  if (/\b(team|collaborate|worked with|together)/i.test(answer)) {
    strengths.push('Demonstrated teamwork and collaboration skills');
  }
  if (/\b(customer|user|client|stakeholder)/i.test(answer)) {
    strengths.push('Showed customer-centric thinking and empathy');
  }
  
  // Build gaps based on answer quality
  const gaps: string[] = [];
  
  if (!hasSpecificExample) {
    gaps.push('Could benefit from more specific examples - try using the STAR method for behavioral questions');
  }
  if (!hasMetrics) {
    gaps.push('Consider adding quantifiable metrics or specific outcomes to strengthen your answer');
  }
  if (answerLength < 150) {
    gaps.push('Answer was quite brief - expand on your thought process and actions taken');
  }
  if (interviewType === 'behavioral' && !hasSTAR) {
    gaps.push('For behavioral questions, structure your answer using STAR: Situation, Task, Action, Result');
  }
  if (!/\b(learned|would do differently|improve|growth)/i.test(answer) && interviewType === 'behavioral') {
    gaps.push('Consider mentioning what you learned or how you would approach it differently next time');
  }
  
  // Generate follow-up question
  const followUpQuestions: Record<InterviewType, string[]> = {
    cs_ops: [
      'Can you walk me through the specific steps you took to resolve that situation?',
      'How did you measure the success of your approach?',
      'What would you have done differently if you had more time or resources?',
      'How did you ensure the customer felt heard and valued throughout the interaction?',
      'Can you share a specific metric or KPI that improved as a result of your actions?'
    ],
    tech_support: [
      'What diagnostic steps would you take first to isolate the root cause?',
      'How would you communicate your findings to a non-technical stakeholder?',
      'Can you explain the technical trade-offs you considered in your solution?',
      'What documentation or runbooks would you create to prevent this issue in the future?',
      'How did you verify that your solution actually resolved the underlying problem?'
    ],
    behavioral: [
      'What was the most challenging part of that situation for you personally?',
      'How did you prioritize when faced with competing demands?',
      'What specific feedback did you receive, and how did you act on it?',
      'Can you share a concrete metric or outcome that resulted from your actions?',
      'Looking back, what would you do differently if you faced a similar situation today?'
    ]
  };
  
  // Select a relevant follow-up based on answer content
  const relevantFollowUps = followUpQuestions[interviewType];
  const followUp = relevantFollowUps[Math.floor(Math.random() * relevantFollowUps.length)];
  
  return {
    strengths: strengths.slice(0, 3),
    gaps: gaps.slice(0, 3),
    followUp
  };
}
