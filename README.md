# 🤖 AI Interview Coach

A web-based AI-powered interview practice platform built as a portfolio-grade full-stack application. Practice customer support, technical support, and behavioral interviews with real-time AI feedback.

![Tech Stack](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Features

### Core Interview Experience
- **Three Interview Categories**: Customer Support, Technical Support, and Behavioral (STAR-method)
- **16 Curated Questions**: Professionally crafted questions with tags for organization
- **AI-Powered Feedback**: Instant analysis with strengths, gaps, and follow-up questions
- **Follow-up Questions**: Deep-dive follow-ups to practice elaboration

### Voice Input (Speech-to-Text)
- **Browser-based STT**: Use Web Speech API for hands-free answering
- **Real-time Transcription**: See your words appear as you speak
- **Chrome/Edge Support**: Best experience on modern browsers

### Session Management
- **Local Persistence**: Sessions saved to localStorage automatically
- **Backend Storage**: Optional server-side persistence with in-memory store
- **Session History**: Review past interviews with full Q/A and feedback
- **Export as Markdown**: Download sessions for offline review

### User Experience
- **Responsive Design**: Clean, modern UI with Tailwind CSS v4
- **Progress Tracking**: Visual progress indicators during interviews
- **STAR Method Tips**: Contextual reminders for behavioral questions
- **Keyboard Shortcuts**: Ctrl+Enter to submit answers

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- (Optional) OpenAI API key for real AI analysis

### Installation

1. **Clone and install dependencies:**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

2. **Configure environment variables:**

Backend (`backend/.env`):
```env
PORT=3001
# Optional: Add for real AI analysis
# OPENAI_API_KEY=your_openai_key_here
```

Frontend (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3001/api
```

3. **Run the application:**

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

4. **Open your browser:**
Navigate to `http://localhost:5173`

## 📁 Project Structure

```
interview-website/
├── backend/                 # Express + TypeScript API
│   ├── src/
│   │   ├── data/           # Question bank
│   │   ├── routes/         # API routes
│   │   ├── services/       # AI analysis service
│   │   ├── types/          # Shared types
│   │   └── index.ts        # Server entry
│   └── package.json
├── frontend/               # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks (STT)
│   │   ├── services/       # API client
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Main app
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

### Health Check
```
GET /api/health
```

### Questions
```
GET /api/questions?category=<cs_ops|tech_support|behavioral>&lastId=<optional>
GET /api/questions/categories
```

### AI Analysis
```
POST /api/analyze-answer
Content-Type: application/json

{
  "question": "Tell me about a time...",
  "answer": "User's answer text...",
  "interviewType": "behavioral"
}
```

### Sessions
```
GET    /api/sessions           # List all sessions
POST   /api/sessions           # Save a session
GET    /api/sessions/:id       # Get session details
DELETE /api/sessions/:id       # Delete a session
```

## 🤖 AI Analysis System

The platform includes a **mock AI analysis** that works without API keys for demo purposes:

### Mock Analysis Features
- Detects specific examples and metrics in answers
- Checks for STAR method structure (behavioral questions)
- Provides contextual feedback based on answer length and content
- Generates relevant follow-up questions

### Using Real AI (Optional)
To use OpenAI or other LLM providers:

1. Add your API key to `backend/.env`:
```env
OPENAI_API_KEY=sk-your-key-here
```

2. Update `backend/src/services/aiAnalysis.ts` to call the actual API:
```typescript
export async function analyzeAnswerWithAI(
  question: string,
  answer: string,
  interviewType: InterviewType
): Promise<AnalyzeResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (apiKey) {
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      // ... implementation
    });
    return parseResponse(response);
  }
  
  return mockAnalyzeAnswer(question, answer, interviewType);
}
```

## 📝 Prompt Template

The analysis uses this prompt structure:

```
You are an expert interview coach specializing in [INTERVIEW_TYPE] interviews.

## Interview Question:
[QUESTION_TEXT]

## Candidate's Answer:
[ANSWER_TEXT]

## Instructions:
Please analyze the answer and provide feedback in the following JSON format:
{
  "strengths": ["..."],
  "gaps": ["..."],
  "followUp": "..."
}
```

## 🎯 Interview Question Bank

### Customer Support (cs_ops)
- Handling frustrated customers
- Ticket prioritization
- VIP customer communication
- Identifying pain points
- Enterprise onboarding

### Technical Support (tech_support)
- Performance troubleshooting
- Explaining technical issues
- SSO configuration problems
- Bug reporting process
- Data export challenges

### Behavioral (STAR Method)
- Difficult customers/stakeholders
- Quick learning situations
- Process improvements
- Learning from mistakes
- Team collaboration
- Meeting tight deadlines

## 🛠️ Development

### Backend Scripts
```bash
npm run dev      # Development with hot reload
npm run build    # Compile TypeScript
npm start        # Run compiled code
```

### Frontend Scripts
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

## 🌐 Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Basic App | ✅ | ✅ | ✅ | ✅ |
| Speech-to-Text | ✅ | ❌ | ❌ | ✅ |

## 📸 Screenshots

*Screenshots would go here showing:*
- Interview type selection screen
- Active interview with question and answer panel
- AI feedback panel showing strengths and gaps
- Session history list
- Session detail view with export option

## 🔮 Future Enhancements

- [ ] Adaptive difficulty based on performance
- [ ] More sophisticated question selection algorithm
- [ ] Progress tracking across multiple sessions
- [ ] Integration with more AI providers (Gemini, Claude)
- [ ] User authentication for multi-user support
- [ ] Interview recording and playback
- [ ] Analytics dashboard

## 📄 License

MIT License - Built for educational and portfolio purposes.

## 🙏 Acknowledgments

- Built with [React](https://react.dev/), [Express](https://expressjs.com/), and [Tailwind CSS](https://tailwindcss.com/)
- Speech recognition via [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- Icons via Heroicons
