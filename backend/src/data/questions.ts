export type QuestionCategory = 'cs_ops' | 'tech_support' | 'behavioral';

export interface Question {
  id: string;
  category: QuestionCategory;
  text: string;
  tags?: string[];
}

export const questionBank: Question[] = [
  // Customer Support Operations (cs_ops)
  {
    id: 'cs_ops_001',
    category: 'cs_ops',
    text: 'A customer is frustrated because they received the wrong order for the third time. How would you handle this situation?',
    tags: ['conflict', 'process', 'retention']
  },
  {
    id: 'cs_ops_002',
    category: 'cs_ops',
    text: 'Describe how you would prioritize support tickets when you have 50+ in the queue with varying urgency levels.',
    tags: ['process', 'time-management', 'prioritization']
  },
  {
    id: 'cs_ops_003',
    category: 'cs_ops',
    text: 'A VIP customer is demanding a feature that your product team has decided not to build. How do you communicate this?',
    tags: ['communication', 'expectation-setting', 'product']
  },
  {
    id: 'cs_ops_004',
    category: 'cs_ops',
    text: 'How would you identify and address a recurring customer pain point that isn\'t being tracked by your current metrics?',
    tags: ['metrics', 'proactive', 'process-improvement']
  },
  {
    id: 'cs_ops_005',
    category: 'cs_ops',
    text: 'Walk me through how you would onboard a new enterprise customer to ensure their long-term success.',
    tags: ['onboarding', 'enablement', 'relationship-building']
  },
  
  // Tech Support / SaaS (tech_support)
  {
    id: 'tech_001',
    category: 'tech_support',
    text: 'A customer reports that your SaaS application is loading slowly. What steps would you take to troubleshoot?',
    tags: ['troubleshooting', 'performance', 'technical']
  },
  {
    id: 'tech_002',
    category: 'tech_support',
    text: 'How would you explain a complex API integration issue to a non-technical customer?',
    tags: ['communication', 'technical', 'translation']
  },
  {
    id: 'tech_003',
    category: 'tech_support',
    text: 'A customer has broken their SSO configuration and can\'t access the platform. Describe your troubleshooting approach.',
    tags: ['troubleshooting', 'sso', 'security', 'urgent']
  },
  {
    id: 'tech_004',
    category: 'tech_support',
    text: 'What information would you gather before escalating a bug report to the engineering team?',
    tags: ['process', 'bug-reporting', 'documentation']
  },
  {
    id: 'tech_005',
    category: 'tech_support',
    text: 'A customer wants to export 5 years of historical data but encounters timeout errors. How would you help?',
    tags: ['technical', 'data', 'workarounds', 'problem-solving']
  },
  
  // Behavioral (STAR-style)
  {
    id: 'beh_001',
    category: 'behavioral',
    text: 'Tell me about a time when you had to deal with a very difficult customer or stakeholder. What was the situation and how did you handle it?',
    tags: ['conflict', 'communication', 'star-method']
  },
  {
    id: 'beh_002',
    category: 'behavioral',
    text: 'Describe a situation where you had to learn something completely new quickly to solve a problem.',
    tags: ['learning', 'adaptability', 'problem-solving', 'star-method']
  },
  {
    id: 'beh_003',
    category: 'behavioral',
    text: 'Give me an example of a time when you identified a process that needed improvement and took the initiative to fix it.',
    tags: ['initiative', 'process-improvement', 'ownership', 'star-method']
  },
  {
    id: 'beh_004',
    category: 'behavioral',
    text: 'Tell me about a time when you made a mistake at work. How did you handle it and what did you learn?',
    tags: ['accountability', 'growth-mindset', 'learning', 'star-method']
  },
  {
    id: 'beh_005',
    category: 'behavioral',
    text: 'Describe a situation where you had to work with a team member who wasn\'t pulling their weight. How did you address it?',
    tags: ['collaboration', 'conflict', 'teamwork', 'star-method']
  },
  {
    id: 'beh_006',
    category: 'behavioral',
    text: 'Tell me about a time when you had to meet a tight deadline with competing priorities. How did you manage your time?',
    tags: ['time-management', 'prioritization', 'pressure', 'star-method']
  }
];

// Helper function to get questions by category
export function getQuestionsByCategory(category: QuestionCategory): Question[] {
  return questionBank.filter(q => q.category === category);
}

// Helper function to get a single question by ID
export function getQuestionById(id: string): Question | undefined {
  return questionBank.find(q => q.id === id);
}

// Helper function to get next question (simple pagination)
export function getNextQuestion(
  category: QuestionCategory, 
  lastId?: string
): { question: Question | null; hasMore: boolean; total: number; currentIndex: number } {
  const questions = getQuestionsByCategory(category);
  
  if (questions.length === 0) {
    return { question: null, hasMore: false, total: 0, currentIndex: 0 };
  }
  
  let currentIndex = 0;
  if (lastId) {
    const lastIndex = questions.findIndex(q => q.id === lastId);
    if (lastIndex !== -1) {
      currentIndex = lastIndex + 1;
    }
  }
  
  const question = currentIndex < questions.length ? questions[currentIndex] : null;
  const hasMore = currentIndex < questions.length - 1;
  
  return { 
    question, 
    hasMore, 
    total: questions.length, 
    currentIndex: question ? currentIndex + 1 : 0 
  };
}
