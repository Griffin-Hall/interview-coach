import { useState, useEffect, useCallback } from 'react';
import type { InterviewType, CategoryInfo, QAExchange, InterviewSession } from './types';
import { fetchCategories, saveSession } from './services/api';
import InterviewTypeSelector from './components/InterviewTypeSelector';
import InterviewSessionComponent from './components/InterviewSession';
import HistoryView from './components/HistoryView';
import './index.css';

type View = 'home' | 'interview' | 'history';

const LOCAL_STORAGE_KEY = 'interview-history';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedType, setSelectedType] = useState<InterviewType | null>(null);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetchCategories();
      setCategories(response.categories);
    } catch (err) {
      setError('Failed to load interview categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartInterview = () => {
    if (selectedType) {
      setCurrentView('interview');
    }
  };

  const handleCompleteInterview = useCallback(async (exchanges: QAExchange[]) => {
    if (!selectedType) return;

    const session: InterviewSession = {
      type: selectedType,
      exchanges,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to localStorage
    try {
      const existingHistory = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      const updatedHistory = [session, ...existingHistory];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }

    // Try to save to backend (optional)
    try {
      await saveSession(session);
    } catch (e) {
      console.log('Backend save failed (optional):', e);
    }

    setSelectedType(null);
    setCurrentView('home');
  }, [selectedType]);

  const handleExitInterview = () => {
    if (confirm('Are you sure you want to exit? Your progress will not be saved.')) {
      setSelectedType(null);
      setCurrentView('home');
    }
  };

  // Render current view
  const renderView = () => {
    switch (currentView) {
      case 'interview':
        if (!selectedType) return null;
        return (
          <InterviewSessionComponent
            type={selectedType}
            onComplete={handleCompleteInterview}
            onExit={handleExitInterview}
          />
        );

      case 'history':
        return <HistoryView onBack={() => setCurrentView('home')} />;

      case 'home':
      default:
        return (
          <div className="min-h-screen bg-gray-900">
            {/* Header */}
            <header className="border-b border-gray-800">
              <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🎯</div>
                  <h1 className="text-xl font-bold text-white">AI Interview Coach</h1>
                </div>
                <nav className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentView('history')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    History
                  </button>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    GitHub
                  </a>
                </nav>
              </div>
            </header>

            {/* Main Content */}
            <main className="py-12">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-400 mb-4">{error}</p>
                  <button
                    onClick={loadCategories}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <InterviewTypeSelector
                  categories={categories}
                  selectedType={selectedType}
                  onSelect={setSelectedType}
                  onStart={handleStartInterview}
                />
              )}
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-800 mt-auto">
              <div className="max-w-6xl mx-auto px-6 py-6 text-center text-gray-500 text-sm">
                <p>Practice interviews with AI-powered feedback • Built with React + Express + TypeScript</p>
              </div>
            </footer>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {renderView()}
    </div>
  );
}

export default App;
