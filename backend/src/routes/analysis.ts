import { Router, Request, Response } from 'express';
import { InterviewType, AnalyzeRequest, AnalyzeResponse } from '../types';
import { analyzeAnswerWithAI, buildAnalysisPrompt } from '../services/aiAnalysis';

const router = Router();

// POST /api/analyze-answer - Analyze a candidate's interview answer
router.post('/', async (req: Request, res: Response) => {
  try {
    const { question, answer, interviewType } = req.body as AnalyzeRequest;
    
    // Validate required fields
    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question is required and must be a string' });
      return;
    }
    
    if (!answer || typeof answer !== 'string') {
      res.status(400).json({ error: 'Answer is required and must be a string' });
      return;
    }
    
    if (!interviewType || typeof interviewType !== 'string') {
      res.status(400).json({ error: 'Interview type is required' });
      return;
    }
    
    // Validate interview type
    const validTypes: InterviewType[] = ['cs_ops', 'tech_support', 'behavioral'];
    if (!validTypes.includes(interviewType as InterviewType)) {
      res.status(400).json({ 
        error: 'Invalid interview type. Must be one of: cs_ops, tech_support, behavioral' 
      });
      return;
    }
    
    // Check for minimum answer length
    if (answer.trim().length < 20) {
      res.status(400).json({ 
        error: 'Answer is too short. Please provide a more detailed response (at least 20 characters).' 
      });
      return;
    }
    
    // Call AI analysis service
    const analysis = await analyzeAnswerWithAI(question, answer, interviewType as InterviewType);
    
    const response: AnalyzeResponse = {
      strengths: analysis.strengths,
      gaps: analysis.gaps,
      followUp: analysis.followUp
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Error analyzing answer:', error);
    res.status(500).json({ 
      error: 'Failed to analyze answer. Please try again later.' 
    });
  }
});

// GET /api/analyze-answer/preview-prompt - Preview the prompt that would be sent to AI (for debugging)
router.get('/preview-prompt', (req: Request, res: Response) => {
  const { question, answer, interviewType } = req.query;
  
  if (!question || !answer || !interviewType) {
    res.status(400).json({ 
      error: 'Missing required query parameters: question, answer, interviewType' 
    });
    return;
  }
  
  const prompt = buildAnalysisPrompt(
    question as string,
    answer as string,
    interviewType as InterviewType
  );
  
  res.json({ prompt });
});

export default router;
