import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ModeSelect from './components/ModeSelect';
import InterviewScreen from './components/InterviewScreen';
import FeedbackView from './components/FeedbackView';
import ProgressDashboard from './components/ProgressDashboard';
import ProfileView from './components/ProfileView';
import { fetchCandidateProfile, fetchNextQuestion } from './services/api';

export default function App() {
  const [currentView, setView] = useState('modes'); // 'modes' | 'interview' | 'feedback' | 'dashboard' | 'profile'
  const [candidate, setCandidate] = useState({
    candidate_id: 'candidate_001',
    name: 'Alex Taylor',
    target_role: 'SDE',
    experience_years: 2,
    skills: [],
    projects: [],
  });
  const [sessionData, setSessionData] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);

  useEffect(() => {
    fetchCandidateProfile('candidate_001')
      .then(profile => {
        if (profile) setCandidate(profile);
      })
      .catch(err => console.log('Using baseline candidate data:', err));
  }, []);

  const handleStartInterview = (newSession) => {
    setSessionData(newSession);
    setView('interview');
  };

  const handleEvaluationComplete = (result) => {
    setEvaluationResult(result);
    setView('feedback');
  };

  const handleNextQuestion = async () => {
    if (sessionData && sessionData.session_id) {
      try {
        const nextQ = await fetchNextQuestion(sessionData.session_id);
        setSessionData(prev => ({
          ...prev,
          question: nextQ.question,
        }));
        setView('interview');
        return;
      } catch (err) {
        console.warn('Failed to fetch next question in session, returning to modes:', err);
      }
    }
    setView('modes');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-[#0A84FF] selection:text-white">
      <Navbar
        currentView={currentView}
        setView={setView}
        candidate={candidate}
      />

      <main className="flex-1 pb-16">
        {currentView === 'modes' && (
          <ModeSelect
            onStartInterview={handleStartInterview}
            candidate={candidate}
          />
        )}

        {currentView === 'interview' && sessionData && (
          <InterviewScreen
            sessionData={sessionData}
            onBack={() => setView('modes')}
            onCompleteEvaluation={handleEvaluationComplete}
          />
        )}

        {currentView === 'feedback' && evaluationResult && (
          <FeedbackView
            evaluationData={evaluationResult}
            onNextQuestion={handleNextQuestion}
            onExit={() => setView('modes')}
          />
        )}

        {currentView === 'dashboard' && (
          <ProgressDashboard
            candidate={candidate}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            candidate={candidate}
            onProfileUpdated={(updated) => setCandidate(updated)}
          />
        )}
      </main>

      <footer className="border-t border-white/[0.06] py-6 px-4 text-center text-xs text-[#636366]">
        Revv &bull; Intelligent Multi-Agent Interview Simulation &amp; Vocal Calibration
      </footer>
    </div>
  );
}
