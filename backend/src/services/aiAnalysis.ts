import { AnalyzeResponse, InterviewType } from '../types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

const analysisJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['strengths', 'gaps', 'followUp'],
  properties: {
    strengths: {
      type: 'array',
      minItems: 2,
      maxItems: 3,
      items: { type: 'string' }
    },
    gaps: {
      type: 'array',
      minItems: 2,
      maxItems: 3,
      items: { type: 'string' }
    },
    followUp: {
      type: 'string',
      minLength: 1
    }
  }
} as const;

const typePlaybooks: Record<
  InterviewType,
  {
    label: string;
    focusAreas: string;
  }
> = {
  cs_ops: {
    label: 'Customer Support Operations',
    focusAreas:
      'empathy, de-escalation, prioritization, process ownership, and customer retention'
  },
  tech_support: {
    label: 'Technical Support / SaaS',
    focusAreas:
      'structured troubleshooting, technical accuracy, communication clarity, and verification steps'
  },
  behavioral: {
    label: 'Behavioral / STAR',
    focusAreas:
      'STAR completeness, ownership, collaboration, and measurable outcomes'
  }
};

interface OpenAIChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

interface OpenAIChatCompletionRequest {
  model: string;
  temperature: number;
  messages: Array<{
    role: 'system' | 'user';
    content: string;
  }>;
  response_format: {
    type: 'json_schema';
    json_schema: {
      name: string;
      strict: true;
      schema: typeof analysisJsonSchema;
    };
  };
}

type ParsedAnalysis = Pick<AnalyzeResponse, 'strengths' | 'gaps' | 'followUp'>;

export function buildAnalysisPrompt(
  question: string,
  answer: string,
  interviewType: InterviewType
): string {
  const playbook = typePlaybooks[interviewType];

  return `You are a senior interview coach reviewing a ${playbook.label} answer.

Evaluate with emphasis on: ${playbook.focusAreas}.

Return strict JSON only with this shape:
{
  "strengths": ["string", "string", "string(optional)"],
  "gaps": ["string", "string", "string(optional)"],
  "followUp": "single follow-up question"
}

Rules:
- Strengths and gaps must each contain 2-3 concise, actionable bullets.
- Each bullet should reference observable evidence from the answer.
- Follow-up should probe missing detail and be easy to answer in 2-5 sentences.
- Keep tone professional and constructive.
- Do not include markdown, code fences, or commentary.

Question:
${question}

Candidate Answer:
${answer}`;
}

export async function analyzeAnswerWithAI(
  question: string,
  answer: string,
  interviewType: InterviewType
): Promise<AnalyzeResponse> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return buildFallbackAnalysis(
      question,
      answer,
      interviewType,
      'Live AI is not configured. Showing local coaching feedback.'
    );
  }

  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
  const prompt = buildAnalysisPrompt(question, answer, interviewType);

  const requestBody: OpenAIChatCompletionRequest = {
    model,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'You are an interview coach. Produce valid JSON only and match the schema exactly.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'interview_analysis',
        strict: true,
        schema: analysisJsonSchema
      }
    }
  };

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI request failed (${response.status}): ${errorText}`);
    }

    const completion = (await response.json()) as OpenAIChatCompletionResponse;
    const content = completion.choices?.[0]?.message?.content;

    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('OpenAI returned an empty response.');
    }

    const parsed = parseAndValidateAnalysis(content);
    if (!parsed) {
      throw new Error('OpenAI response did not match expected analysis shape.');
    }

    return {
      ...parsed,
      meta: {
        source: 'llm'
      }
    };
  } catch (error) {
    console.error('OpenAI analysis failed. Falling back to local analysis.', error);
    return buildFallbackAnalysis(
      question,
      answer,
      interviewType,
      'Live AI was unavailable. Showing fallback coaching feedback.'
    );
  }
}

function buildFallbackAnalysis(
  question: string,
  answer: string,
  interviewType: InterviewType,
  message: string
): AnalyzeResponse {
  const fallback = mockAnalyzeAnswer(question, answer, interviewType);

  return {
    ...fallback,
    meta: {
      source: 'fallback',
      message
    }
  };
}

function mockAnalyzeAnswer(
  _question: string,
  answer: string,
  interviewType: InterviewType
): ParsedAnalysis {
  const answerLength = answer.length;
  const hasSpecificExample =
    /\b(for example|such as|instance|specifically|in one case|when I|at my previous)\b/i.test(
      answer
    );
  const hasMetrics =
    /\b(percent|%|number|increased|decreased|reduced|improved|by \d|time|hours|days)\b/i.test(
      answer
    );
  const hasSTAR =
    /\b(situation|context|task|action|result|outcome|learned)\b/i.test(answer);

  const strengths: string[] = [];

  if (hasSpecificExample) {
    strengths.push('You used specific examples to support your answer.');
  }

  if (hasMetrics) {
    strengths.push('You included measurable impact, which strengthens credibility.');
  }

  if (answerLength > 200) {
    strengths.push('Your response was detailed and covered meaningful context.');
  } else if (answerLength > 100) {
    strengths.push('Your response was concise while still communicating key points.');
  }

  if (hasSTAR && interviewType === 'behavioral') {
    strengths.push('You showed a STAR-like structure with clear actions and outcomes.');
  }

  if (/\b(team|collaborate|worked with|together)\b/i.test(answer)) {
    strengths.push('You demonstrated cross-functional collaboration.');
  }

  if (/\b(customer|user|client|stakeholder)\b/i.test(answer)) {
    strengths.push('You showed customer and stakeholder awareness.');
  }

  const gaps: string[] = [];

  if (!hasSpecificExample) {
    gaps.push('Add a specific example so the interviewer can assess your process and judgment.');
  }

  if (!hasMetrics) {
    gaps.push('Include at least one measurable outcome to show impact.');
  }

  if (answerLength < 150) {
    gaps.push('Expand on your actions and decision-making to add depth.');
  }

  if (interviewType === 'behavioral' && !hasSTAR) {
    gaps.push('Use STAR structure explicitly: Situation, Task, Action, and Result.');
  }

  if (
    !/\b(learned|would do differently|improve|growth|next time)\b/i.test(answer) &&
    interviewType === 'behavioral'
  ) {
    gaps.push('Mention what you learned and how you would improve in a future scenario.');
  }

  const followUpByType: Record<InterviewType, string[]> = {
    cs_ops: [
      'How did you prioritize immediate customer recovery versus long-term process fixes?',
      'Which signal or metric told you your approach actually improved the customer experience?',
      'What would you document to prevent this issue from repeating for other customers?'
    ],
    tech_support: [
      'What was your exact step-by-step process for isolating root cause?',
      'How did you confirm the issue was fixed and not just temporarily masked?',
      'How would you explain your technical findings to a non-technical stakeholder?'
    ],
    behavioral: [
      'What trade-off did you face, and how did you decide which path to take?',
      'What concrete result came from your actions, and how did you measure it?',
      'If this happened again today, what would you do differently and why?'
    ]
  };

  const baseStrengths = strengths.slice(0, 3);
  const baseGaps = gaps.slice(0, 3);

  return {
    strengths:
      baseStrengths.length >= 2
        ? baseStrengths
        : [
            'Your response addressed the prompt and stayed relevant to the scenario.',
            'You communicated your approach in a clear, interview-appropriate tone.'
          ],
    gaps:
      baseGaps.length >= 2
        ? baseGaps
        : [
            'Add more detail about your decision-making process and rationale.',
            'Highlight a measurable outcome so impact is easier to evaluate.'
          ],
    followUp: followUpByType[interviewType][Math.floor(Math.random() * followUpByType[interviewType].length)]
  };
}

function parseAndValidateAnalysis(content: string): ParsedAnalysis | null {
  const candidates = buildParseCandidates(content);

  for (const candidate of candidates) {
    const parsed = tryParseAnalysis(candidate);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

function buildParseCandidates(content: string): string[] {
  const trimmed = content.trim();
  const candidates = new Set<string>();

  if (trimmed) {
    candidates.add(trimmed);
  }

  const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeFenceMatch?.[1]) {
    candidates.add(codeFenceMatch[1].trim());
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidates.add(trimmed.slice(firstBrace, lastBrace + 1));
  }

  return Array.from(candidates);
}

function tryParseAnalysis(content: string): ParsedAnalysis | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const candidate = parsed as {
    strengths?: unknown;
    gaps?: unknown;
    followUp?: unknown;
  };

  const strengths = toStringArray(candidate.strengths);
  const gaps = toStringArray(candidate.gaps);
  const followUp = typeof candidate.followUp === 'string' ? candidate.followUp.trim() : '';

  if (!strengths || !gaps || strengths.length < 2 || gaps.length < 2 || !followUp) {
    return null;
  }

  return {
    strengths: strengths.slice(0, 3),
    gaps: gaps.slice(0, 3),
    followUp
  };
}

function toStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : null;
}
