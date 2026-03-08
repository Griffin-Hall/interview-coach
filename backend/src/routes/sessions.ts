import { Router, Request, Response } from 'express';
import { InterviewSession, QAExchange } from '../types';

const router = Router();

// In-memory storage for sessions (single-user demo)
// In production, this would be a database
const sessions: Map<string, InterviewSession> = new Map();

// POST /api/sessions - Save a new interview session
router.post('/', (req: Request, res: Response) => {
  try {
    const { type, exchanges } = req.body;
    
    if (!type || !exchanges || !Array.isArray(exchanges)) {
      res.status(400).json({ 
        error: 'Invalid session data. Required: type (string), exchanges (array)' 
      });
      return;
    }
    
    const validTypes = ['cs_ops', 'tech_support', 'behavioral'];
    if (!validTypes.includes(type)) {
      res.status(400).json({ 
        error: 'Invalid type. Must be one of: cs_ops, tech_support, behavioral' 
      });
      return;
    }
    
    const now = new Date().toISOString();
    const session: InterviewSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      exchanges: exchanges as QAExchange[],
      createdAt: now,
      updatedAt: now
    };
    
    sessions.set(session.id, session);
    
    res.status(201).json({
      message: 'Session saved successfully',
      session: {
        id: session.id,
        type: session.type,
        exchangeCount: session.exchanges.length,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// GET /api/sessions - List all sessions (sorted by newest first)
router.get('/', (_req: Request, res: Response) => {
  const sessionList = Array.from(sessions.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(session => ({
      id: session.id,
      type: session.type,
      exchangeCount: session.exchanges.length,
      createdAt: session.createdAt
    }));
  
  res.json({ 
    sessions: sessionList,
    total: sessionList.length 
  });
});

// GET /api/sessions/:id - Get a specific session with full details
router.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const session = sessions.get(id);
  
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  
  res.json({ session });
});

// DELETE /api/sessions/:id - Delete a session
router.delete('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  
  if (!sessions.has(id)) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  
  sessions.delete(id);
  res.json({ message: 'Session deleted successfully' });
});

// DELETE /api/sessions - Clear all sessions
router.delete('/', (_req: Request, res: Response) => {
  const count = sessions.size;
  sessions.clear();
  res.json({ message: `All ${count} sessions cleared` });
});

export default router;
