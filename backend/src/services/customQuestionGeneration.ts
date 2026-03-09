import {
  CustomQuestionMode,
  GenerateCustomQuestionsResponse,
  GeneratedCustomQuestion
} from '../types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

const questionGenerationSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['roleLabel', 'questions'],
  properties: {
    roleLabel: {
      type: 'string',
      minLength: 3
    },
    questions: {
      type: 'array',
      minItems: 5,
      maxItems: 8,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['text', 'tags'],
        properties: {
          text: {
            type: 'string',
            minLength: 12
          },
          tags: {
            type: 'array',
            minItems: 1,
            maxItems: 4,
            items: {
              type: 'string'
            }
          }
        }
      }
    }
  }
} as const;

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
      schema: typeof questionGenerationSchema;
    };
  };
}

interface ParsedGeneratedQuestions {
  roleLabel: string;
  questions: Array<{
    text: string;
    tags: string[];
  }>;
}

export async function generateCustomQuestions(
  input: string,
  mode: CustomQuestionMode,
  questionCount: number
): Promise<GenerateCustomQuestionsResponse> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return buildFallbackQuestions(
      input,
      mode,
      questionCount,
      'Live AI question generation is unavailable. Showing fallback role-based questions.'
    );
  }

  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
  const prompt = buildQuestionGenerationPrompt(input, mode, questionCount);

  const requestBody: OpenAIChatCompletionRequest = {
    model,
    temperature: 0.35,
    messages: [
      {
        role: 'system',
        content:
          'You are an interview prep assistant. Return valid JSON only that strictly matches the schema.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'custom_interview_questions',
        strict: true,
        schema: questionGenerationSchema
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
      throw new Error(`OpenAI request failed (${response.status}).`);
    }

    const completion = (await response.json()) as OpenAIChatCompletionResponse;
    const content = completion.choices?.[0]?.message?.content;

    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('OpenAI returned an empty response for custom questions.');
    }

    const parsed = parseGeneratedQuestions(content);

    if (!parsed) {
      throw new Error('OpenAI custom questions response failed validation.');
    }

    return {
      roleLabel: parsed.roleLabel,
      questions: toGeneratedCustomQuestions(parsed.questions, questionCount),
      meta: {
        source: 'llm'
      }
    };
  } catch (error) {
    console.error('OpenAI custom question generation failed. Falling back.', error);

    return buildFallbackQuestions(
      input,
      mode,
      questionCount,
      'Live AI question generation failed. Showing fallback role-based questions.'
    );
  }
}

export function buildQuestionGenerationPrompt(
  input: string,
  mode: CustomQuestionMode,
  questionCount: number
): string {
  const normalizedCount = Math.min(8, Math.max(5, questionCount));

  const modeInstruction =
    mode === 'job_description'
      ? 'The source text is a full or partial job description. Infer responsibilities, requirements, and expected behaviors.'
      : 'The source text is a role description from the candidate. Infer interview themes and likely interviewer priorities.';

  return `Generate ${normalizedCount} high-quality interview questions tailored to the provided role context.

${modeInstruction}

Output rules:
- Return JSON only.
- Set roleLabel to a clean role title.
- Include 5-8 questions, prioritizing practical technical and behavioral depth.
- Each question should be specific and realistic for real interviews.
- Provide 1-4 short tags per question.

Source text:
${input}`;
}

function buildFallbackQuestions(
  input: string,
  mode: CustomQuestionMode,
  questionCount: number,
  message: string
): GenerateCustomQuestionsResponse {
  const roleLabel = inferRoleLabel(input, mode);
  const tags = extractKeywords(input);

  const templates = [
    `Walk me through how you would prioritize your first 90 days as a ${roleLabel}.`,
    `Describe a complex project relevant to this ${roleLabel} role and how you delivered it end-to-end.`,
    `How do you approach trade-offs between speed, quality, and maintainability for this role?`,
    `Tell me about a time you resolved ambiguity while working in a ${roleLabel} scope.`,
    `What metrics would you use to measure success in this role, and why?`,
    `Describe a challenging stakeholder conversation you've handled that is relevant to this role.`,
    `How would you debug a high-impact production issue in a ${roleLabel} context?`,
    `What would your interviewers most likely want to hear from you for this role?`
  ];

  const desiredCount = Math.min(8, Math.max(5, questionCount));

  const generated = templates.slice(0, desiredCount).map((text, index) => ({
    id: `custom_${Date.now()}_${index + 1}`,
    category: 'custom' as const,
    text,
    tags: buildFallbackTags(tags, index)
  }));

  return {
    roleLabel,
    questions: generated,
    meta: {
      source: 'fallback',
      message
    }
  };
}

function inferRoleLabel(input: string, mode: CustomQuestionMode): string {
  const normalized = input
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);

  if (!normalized) {
    return mode === 'job_description' ? 'Target Role' : 'Custom Role';
  }

  const titleMatch = normalized.match(/(?:title|role)\s*:\s*([^\.|,]+)/i);
  if (titleMatch?.[1]) {
    return toTitleCase(titleMatch[1].trim());
  }

  const compact = normalized
    .split(/[\.|,]/)
    .map((part) => part.trim())
    .find(Boolean);

  if (!compact) {
    return mode === 'job_description' ? 'Target Role' : 'Custom Role';
  }

  return toTitleCase(compact.slice(0, 48));
}

function toTitleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((token) => `${token.slice(0, 1).toUpperCase()}${token.slice(1).toLowerCase()}`)
    .join(' ');
}

function extractKeywords(input: string): string[] {
  const stopwords = new Set([
    'about',
    'which',
    'there',
    'their',
    'would',
    'could',
    'should',
    'with',
    'from',
    'that',
    'this',
    'have',
    'will',
    'your',
    'role',
    'team',
    'work',
    'years',
    'experience'
  ]);

  const frequency = new Map<string, number>();

  input
    .toLowerCase()
    .match(/[a-z][a-z0-9_\-]{3,}/g)
    ?.forEach((token) => {
      if (stopwords.has(token)) {
        return;
      }

      frequency.set(token, (frequency.get(token) || 0) + 1);
    });

  return Array.from(frequency.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([token]) => token);
}

function buildFallbackTags(tags: string[], index: number): string[] {
  const defaults = ['role-fit', 'execution', 'communication', 'problem-solving'];
  const selected = tags.slice(index % 3, (index % 3) + 2);
  const merged = [...selected, ...defaults].filter(Boolean);

  return Array.from(new Set(merged)).slice(0, 4);
}

function parseGeneratedQuestions(content: string): ParsedGeneratedQuestions | null {
  const candidates = buildParseCandidates(content);

  for (const candidate of candidates) {
    const parsed = tryParseGeneratedQuestions(candidate);
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

function tryParseGeneratedQuestions(content: string): ParsedGeneratedQuestions | null {
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
    roleLabel?: unknown;
    questions?: unknown;
  };

  const roleLabel = typeof candidate.roleLabel === 'string' ? candidate.roleLabel.trim() : '';
  const questions = normalizeQuestionArray(candidate.questions);

  if (!roleLabel || !questions || questions.length < 5) {
    return null;
  }

  return {
    roleLabel,
    questions
  };
}

function normalizeQuestionArray(value: unknown): Array<{ text: string; tags: string[] }> | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const raw = entry as {
        text?: unknown;
        tags?: unknown;
      };

      const text = typeof raw.text === 'string' ? raw.text.trim() : '';

      if (text.length < 12) {
        return null;
      }

      const tags = Array.isArray(raw.tags)
        ? raw.tags
            .filter((tag): tag is string => typeof tag === 'string')
            .map((tag) => tag.trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 4)
        : [];

      return {
        text,
        tags: tags.length > 0 ? tags : ['role-fit']
      };
    })
    .filter((entry): entry is { text: string; tags: string[] } => entry !== null);

  return normalized.length > 0 ? normalized : null;
}

function toGeneratedCustomQuestions(
  questions: Array<{ text: string; tags: string[] }>,
  questionCount: number
): GeneratedCustomQuestion[] {
  const desiredCount = Math.min(8, Math.max(5, questionCount));
  const uniqueQuestions: Array<{ text: string; tags: string[] }> = [];

  for (const question of questions) {
    if (uniqueQuestions.find((existing) => existing.text === question.text)) {
      continue;
    }

    uniqueQuestions.push(question);

    if (uniqueQuestions.length === desiredCount) {
      break;
    }
  }

  const timestamp = Date.now();

  return uniqueQuestions.map((question, index) => ({
    id: `custom_${timestamp}_${index + 1}`,
    category: 'custom',
    text: question.text,
    tags: question.tags
  }));
}
