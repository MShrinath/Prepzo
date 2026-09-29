import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import HomeScreen from './components/HomeScreen';
import PracticeScreen from './components/PracticeScreen';
import ResultsScreen from './components/ResultsScreen';
import PlansScreen from './components/PlansScreen';
import ResumeAnalysisView from './components/ResumeAnalysisView';
import ResourcesView from './components/ResourcesView';
import SettingsView from './components/SettingsView';
import { fetchCandidateProfile, startRolePractice, startHRInterview } from './services/api';

export default function App() {
  // Theme state: 'light' or 'dark'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('prepzo-theme') || 'light';
  });

  // Current view: 'home' | 'practice' | 'resume' | 'progress' | 'plans' | 'resources' | 'settings'
  const [currentView, setView] = useState('home');
  const [resultsTab, setResultsTab] = useState('detailed');

  const [candidate, setCandidate] = useState({
    candidate_id: 'candidate_001',
    name: 'Sai Revanth',
    email: 'sai.revanth@example.com',
    target_role: 'Software Engineer',
    experience_years: 2,
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'AWS'],
    projects: [],
  });

  const [sessionData, setSessionData] = useState({
    session_id: 'sess_live_101',
    role: 'Software Engineer – Technical Interview',
    question_number: 3,
    total_questions: 10,
    difficulty: 'Medium',
    question: {
      question:
        'Explain the difference between SQL and NoSQL databases. When would you choose one over the other?',
      competency: 'Technical Knowledge',
      difficulty: 'Medium',
    },
  });

  const [evaluationResult, setEvaluationResult] = useState(null);

  // Sync theme to <html> tag
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('prepzo-theme', theme);
  }, [theme]);

  // Load candidate profile from API if available
  useEffect(() => {
    fetchCandidateProfile('candidate_001')
      .then((profile) => {
        if (profile) {
          setCandidate((prev) => ({
            ...prev,
            ...profile,
            name: profile.name && profile.name !== 'Alex Taylor' ? profile.name : 'Sai Revanth',
          }));
        }
      })
      .catch((err) => console.log('Using baseline candidate data:', err));
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleStartTechnical = async () => {
    setView('practice');
    try {
      const data = await startRolePractice(candidate.candidate_id, 'Software Engineer', 'Technical');
      if (data && data.session_id) {
        setSessionData(data);
      }
    } catch (e) {
      console.warn('Using default technical practice session:', e);
    }
  };

  const handleStartResumeJD = () => {
    setView('resume');
  };

  const handleStartHR = async () => {
    setSessionData({
      session_id: 'hr_' + Date.now(),
      role: 'HR & Behavioral Interview',
      question_number: 1,
      total_questions: 5,
      difficulty: 'Medium',
      question: {
        question: 'Tell me about a time you received difficult constructive feedback. How did you process and apply it?',
        competency: 'Receiving Feedback & Growth Mindset',
        difficulty: 'Medium',
      },
    });
    setView('practice');
    try {
      const data = await startHRInterview(candidate.candidate_id, ['conflict_resolution', 'receiving_feedback']);
      if (data && data.session_id) {
        setSessionData(data);
      }
    } catch (e) {
      console.warn('Using default HR session:', e);
    }
  };

  const handleEndInterview = () => {
    setResultsTab('detailed');
    setView('progress');
  };

  const handleRetakeInterview = () => {
    setSessionData({
      session_id: 'sess_' + Date.now(),
      role: 'Software Engineer – Technical Interview',
      question_number: 1,
      total_questions: 10,
      difficulty: 'Medium',
      question: {
        question:
          'Explain the difference between SQL and NoSQL databases. When would you choose one over the other?',
        competency: 'Technical Knowledge',
        difficulty: 'Medium',
      },
    });
    setView('practice');
  };

  const handleDownloadReport = () => {
    window.print();
  };

  const handleRegeneratePlan = () => {
    // Handled in PlansScreen with state feedback
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070B14] text-slate-900 dark:text-slate-100 flex font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setView={setView}
        candidate={candidate}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        {/* Top Header Bar */}
        <TopBar
          theme={theme}
          toggleTheme={toggleTheme}
          candidate={candidate}
          setView={setView}
        />

        {/* Dynamic Screen Views */}
        <main className="flex-1 pb-16">
          {/* Screen 1: Home Dashboard */}
          {currentView === 'home' && (
            <HomeScreen
              candidate={candidate}
              onStartTechnical={handleStartTechnical}
              onStartResumeJD={handleStartResumeJD}
              onStartHR={handleStartHR}
              onViewProgress={(tab = 'detailed') => {
                setResultsTab(tab);
                setView('progress');
              }}
              onViewPlans={() => setView('plans')}
            />
          )}

          {/* Screen 2: Practice / Live Interview */}
          {currentView === 'practice' && (
            <PracticeScreen
              sessionData={sessionData}
              candidate={candidate}
              onEndInterview={handleEndInterview}
              onNextQuestion={() => {}}
            />
          )}

          {/* Screen 3: Progress / Interview Results */}
          {currentView === 'progress' && (
            <ResultsScreen
              evaluationData={evaluationResult}
              candidate={candidate}
              initialTab={resultsTab}
              onRetakeInterview={handleRetakeInterview}
              onDownloadReport={handleDownloadReport}
            />
          )}

          {/* Screen 4: Plans / 7-Day Improvement Plan */}
          {currentView === 'plans' && (
            <PlansScreen
              candidate={candidate}
              onRegeneratePlan={handleRegeneratePlan}
              onStartPractice={handleStartTechnical}
            />
          )}

          {/* Resume & Job Description Analysis View */}
          {currentView === 'resume' && (
            <ResumeAnalysisView
              candidate={candidate}
              onStartInterview={(newSession) => {
                setSessionData(newSession);
                setView('practice');
              }}
            />
          )}

          {/* Resources & Guides View */}
          {currentView === 'resources' && <ResourcesView />}

          {/* Settings & Profile View */}
          {currentView === 'settings' && (
            <SettingsView
              candidate={candidate}
              onProfileUpdated={(updated) => setCandidate(updated)}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          )}
        </main>
      </div>
    </div>
  );
}
