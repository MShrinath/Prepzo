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
import {
  fetchCandidateProfile,
  fetchCandidateProgress,
  startRolePractice,
  startHRInterview
} from './services/api';

export default function App() {
  // Enforce dark theme across application permanently
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

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

  const [candidateProgress, setCandidateProgress] = useState({
    total_sessions: 0,
    total_responses: 0,
    average_overall_score: 0,
    average_communication_score: 0,
    average_content_score: 0,
    timeline: [],
  });

  // Initial sessionData starts strictly as null (no fake interview in progress)
  const [sessionData, setSessionData] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);

  // Load candidate profile and progress from API on mount
  useEffect(() => {
    const candId = 'candidate_001';
    fetchCandidateProfile(candId)
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

    fetchCandidateProgress(candId)
      .then((progress) => {
        if (progress) {
          setCandidateProgress(progress);
          if (progress.latest_evaluation) {
            setEvaluationResult(progress.latest_evaluation);
          }
        }
      })
      .catch((err) => console.log('Using baseline candidate progress:', err));
  }, []);

  const refreshProgress = () => {
    fetchCandidateProgress(candidate?.candidate_id || 'candidate_001')
      .then((prog) => {
        if (prog) {
          setCandidateProgress(prog);
          if (prog.latest_evaluation) {
            setEvaluationResult((prev) => prev || prog.latest_evaluation);
          }
        }
      })
      .catch((err) => console.warn('Progress refresh:', err));
  };

  const handleStartTechnical = async () => {
    try {
      const data = await startRolePractice(
        candidate.candidate_id,
        candidate.target_role || 'Software Engineer',
        'Technical & System Architecture'
      );
      if (data && data.session_id) {
        setSessionData(data);
      }
    } catch (e) {
      console.warn('Backend connection note:', e);
    }
    setView('practice');
  };

  const handleStartResumeJD = () => {
    setView('resume');
  };

  const handleStartHR = async () => {
    try {
      const data = await startHRInterview(candidate.candidate_id, [
        'conflict_resolution',
        'leadership',
        'teamwork',
      ]);
      if (data && data.session_id) {
        setSessionData(data);
      }
    } catch (e) {
      console.warn('Backend connection note:', e);
    }
    setView('practice');
  };

  const handleEndInterview = (evalData) => {
    if (evalData) {
      setEvaluationResult(evalData);
    }
    refreshProgress();
    setResultsTab('detailed');
    setView('progress');
  };

  const handleRetakeInterview = () => {
    setSessionData(null);
    setView('practice');
  };

  const handleDownloadReport = () => {
    window.print();
  };

  const handleSelectPastSession = (sessionItem) => {
    if (sessionItem?.evaluation) {
      setEvaluationResult(sessionItem.evaluation);
    }
    setSessionData({
      session_id: sessionItem.session_id,
      target_role: sessionItem.target_role,
      role: sessionItem.target_role,
      mode: sessionItem.mode,
      difficulty: sessionItem.difficulty,
      question: { question: sessionItem.question_text },
    });
    setResultsTab('detailed');
    setView('progress');
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">
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
          candidate={candidate}
          setView={setView}
          currentView={currentView}
        />

        {/* Dynamic Screen Views */}
        <main className="flex-1 pb-16">
          {/* Screen 1: Home Dashboard */}
          {currentView === 'home' && (
            <HomeScreen
              candidate={candidate}
              candidateProgress={candidateProgress}
              onStartTechnical={handleStartTechnical}
              onStartResumeJD={handleStartResumeJD}
              onStartHR={handleStartHR}
              onViewProgress={(tab = 'detailed') => {
                setResultsTab(tab);
                setView('progress');
              }}
              onViewPlans={() => setView('plans')}
              onSelectSession={handleSelectPastSession}
            />
          )}

          {/* Screen 2: Practice / Live Interview */}
          {currentView === 'practice' && (
            <PracticeScreen
              sessionData={sessionData}
              candidate={candidate}
              onEndInterview={handleEndInterview}
            />
          )}

          {/* Screen 3: Progress / Interview Results */}
          {currentView === 'progress' && (
            <ResultsScreen
              evaluationData={evaluationResult}
              candidate={candidate}
              sessionData={sessionData}
              candidateProgress={candidateProgress}
              initialTab={resultsTab}
              onRetakeInterview={handleRetakeInterview}
              onDownloadReport={handleDownloadReport}
              onViewPlans={() => setView('plans')}
            />
          )}

          {/* Screen 4: Plans / 7-Day Improvement Plan */}
          {currentView === 'plans' && (
            <PlansScreen
              candidate={candidate}
              candidateProgress={candidateProgress}
              evaluationData={evaluationResult}
              onStartPractice={() => {
                setSessionData(null);
                setView('practice');
              }}
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
            />
          )}
        </main>
      </div>
    </div>
  );
}
