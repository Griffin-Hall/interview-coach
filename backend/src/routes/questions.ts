import { Router, Request, Response } from 'express';
import { QuestionCategory, getNextQuestion, getQuestionsByCategory } from '../data/questions';
import { generateCustomQuestions } from '../services/customQuestionGeneration';
import { CustomQuestionMode, GenerateCustomQuestionsRequest } from '../types';

const router = Router();

// GET /api/questions - Get next question
// Query params: category (required), lastId (optional)
router.get('/', (req: Request, res: Response) => {
  const { category, lastId } = req.query;
  
  // Validate category
  if (!category || typeof category !== 'string') {
    res.status(400).json({ error: 'Category is required' });
    return;
  }
  
  const validCategories: QuestionCategory[] = ['cs_ops', 'tech_support', 'behavioral'];
  if (!validCategories.includes(category as QuestionCategory)) {
    res.status(400).json({ 
      error: 'Invalid category. Must be one of: cs_ops, tech_support, behavioral' 
    });
    return;
  }
  
  const lastIdStr = typeof lastId === 'string' ? lastId : undefined;
  const result = getNextQuestion(category as QuestionCategory, lastIdStr);
  
  if (!result.question) {
    res.status(404).json({ 
      error: 'No more questions available for this category',
      category,
      total: result.total
    });
    return;
  }
  
  res.json({
    question: result.question,
    pagination: {
      current: result.currentIndex,
      total: result.total,
      hasMore: result.hasMore
    }
  });
});

// GET /api/questions/categories - List all categories with counts
router.get('/categories', (_req: Request, res: Response) => {
  const categories: { id: QuestionCategory; name: string; count: number }[] = [
    { id: 'cs_ops', name: 'Customer Support Operations', count: getQuestionsByCategory('cs_ops').length },
    { id: 'tech_support', name: 'Technical Support / SaaS', count: getQuestionsByCategory('tech_support').length },
    { id: 'behavioral', name: 'Behavioral (STAR Method)', count: getQuestionsByCategory('behavioral').length }
  ];
  
  res.json({ categories });
});

// POST /api/questions/custom - Generate role-specific custom interview questions
router.post('/custom', async (req: Request, res: Response) => {
  try {
    const { mode, input, questionCount } = req.body as GenerateCustomQuestionsRequest;

    const validModes: CustomQuestionMode[] = ['job_description', 'role_prompt'];
    if (!mode || !validModes.includes(mode)) {
      res.status(400).json({
        error: 'Invalid mode. Must be one of: job_description, role_prompt'
      });
      return;
    }

    if (!input || typeof input !== 'string' || input.trim().length < 20) {
      res.status(400).json({
        error: 'Input is required and must be at least 20 characters.'
      });
      return;
    }

    const normalizedCount =
      typeof questionCount === 'number'
        ? Math.min(8, Math.max(5, Math.round(questionCount)))
        : 6;

    const generated = await generateCustomQuestions(input.trim(), mode, normalizedCount);

    res.json(generated);
  } catch (error) {
    console.error('Error generating custom questions:', error);
    res.status(500).json({
      error: 'Failed to generate custom questions. Please try again.'
    });
  }
});

export default router;
