import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Lightbulb,
  Sparkles,
  Pause,
  Play,
  Square,
  Type,
  Mic,
  Send,
  Info,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  RotateCcw,
  Zap,
  Code2,
  Users,
  FileText,
  Briefcase,
  ArrowRight,
  Shield
} from 'lucide-react';
import {
  startRolePractice,
  startHRInterview,
  startCompanyArchetype,
  submitVoiceResponse,
  submitTextResponse,
  fetchNextQuestion
} from '../services/api';

export default function PracticeScreen({
  sessionData: initialSessionData,
  candidate,
  onEndInterview,
}) {
  // Session active state: if parent passed a session, start active; otherwise show setup launcher
  const [isSessionActive, setIsSessionActive] = useState(
    Boolean(initialSessionData?.session_id)
  );
  const [activeSession, setActiveSession] = useState(initialSessionData || null);
  const [isStartingSession, setIsStartingSession] = useState(false);

  // Setup launcher configuration state
  const [selectedMode, setSelectedMode] = useState('technical'); // 'technical' | 'hr' | 'company'
  const [targetRole, setTargetRole] = useState(candidate?.target_role || 'Software Engineer');
  const [companyChoice, setCompanyChoice] = useState('amazon'); // 'amazon' | 'google' | 'mckinsey'
  const [companyPrinciple, setCompanyPrinciple] = useState('Customer Obsession');
  const [difficultyChoice, setDifficultyChoice] = useState('medium');

  // Active interview state
  const [activeTab, setActiveTab] = useState('conversation'); // 'conversation' | 'analysis'
  const [isRecording, setIsRecording] = useState(false); // STRICTLY false initially
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0); // STRICTLY 0
  const [totalTimerSeconds, setTotalTimerSeconds] = useState(0); // STRICTLY 0:00
  const [showTips, setShowTips] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTypeMode, setIsTypeMode] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [currentQNum, setCurrentQNum] = useState(1);
  const [totalQNum, setTotalQNum] = useState(5);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Audio recording refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState(null);
  const inputRef = useRef(null);

  // Message list initialized from active question
  const [messages, setMessages] = useState([]);

  // Sync if initialSessionData changes from outside (e.g. from HomeScreen quick start)
  useEffect(() => {
    if (initialSessionData?.session_id) {
      setActiveSession(initialSessionData);
      setIsSessionActive(true);
      setTotalTimerSeconds(0);
      setRecordingSeconds(0);
      setIsRecording(false);
      const qText = initialSessionData?.question?.question || 'Technical Interview Question';
      setMessages([
        {
          id: 1,
          sender: 'ai',
          text: qText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setCurrentQNum(initialSessionData?.question_number || 1);
      setTotalQNum(initialSessionData?.total_questions || 5);
    }
  }, [initialSessionData]);

  // Overall session stopwatch (starts at 0 when interview is active)
  useEffect(() => {
    let timer;
    if (isSessionActive && !isPaused) {
      timer = setInterval(() => {
        setTotalTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSessionActive, isPaused]);

  // Recording counter
  useEffect(() => {
    let recTimer;
    if (isRecording && !isPaused) {
      recTimer = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(recTimer);
  }, [isRecording, isPaused]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatRecTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} / 02:00`;
  };

  // Launch a real practice session
  const handleLaunchSession = async () => {
    setIsStartingSession(true);
    setErrorMsg(null);
    try {
      let session;
      const candId = candidate?.candidate_id || 'candidate_001';

      if (selectedMode === 'technical') {
        session = await startRolePractice(candId, targetRole, 'Technical & System Architecture');
      } else if (selectedMode === 'hr') {
        session = await startHRInterview(candId, ['conflict_resolution', 'leadership', 'teamwork']);
      } else if (selectedMode === 'company') {
        session = await startCompanyArchetype(candId, companyChoice, companyPrinciple, difficultyChoice);
      }

      if (session && session.session_id) {
        setActiveSession(session);
        setIsSessionActive(true);
        setTotalTimerSeconds(0);
        setRecordingSeconds(0);
        setIsRecording(false);
        const qText = session.question?.question || 'Interview question generated by AI.';
        setMessages([
          {
            id: 1,
            sender: 'ai',
            text: qText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setCurrentQNum(session.question_number || 1);
        setTotalQNum(session.total_questions || 5);
      }
    } catch (err) {
      console.error('Failed to start session:', err);
      setErrorMsg('Could not initialize interview session with backend. Please verify backend is running on port 8000.');
    } finally {
      setIsStartingSession(false);
    }
  };

  // Start real microphone recording using MediaRecorder & SpeechRecognition
  const handleStartRecording = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setRecordedAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingSeconds(0);

      // Web Speech API for real-time live transcription
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.onresult = (e) => {
            let current = '';
            for (let i = 0; i < e.results.length; i++) {
              current += e.results[i][0].transcript;
            }
            if (current.trim()) {
              setInputMessage(current);
            }
          };
          recognition.start();
          recognitionRef.current = recognition;
        } catch (recErr) {
          console.warn('Speech recognition warning:', recErr);
        }
      }
    } catch (err) {
      console.warn('Microphone access denied:', err);
      setErrorMsg('Microphone access was denied. Please allow microphone permissions or switch to Type Answer mode.');
      setIsRecording(false);
    }
  };

  // Stop real microphone recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
  };

  // Submit response (voice or text) to real backend
  const handleSendMessage = async () => {
    const textToSend = inputMessage.trim();
    if (!textToSend && !recordedAudioBlob) {
      setErrorMsg('Please record your voice or type your answer before submitting.');
      return;
    }

    // Stop recording if active
    if (isRecording) {
      handleStopRecording();
    }

    const currentQText =
      activeSession?.question?.question ||
      messages[messages.length - 1]?.text ||
      'Interview Question';
    const qId = activeSession?.question?.question_id;
    const sessId = activeSession?.session_id;

    // Add user message to UI thread
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend || 'Spoken Voice Response submitted.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      audioDuration: recordedAudioBlob ? formatTimer(recordingSeconds) : null,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsAiThinking(true);
    setErrorMsg(null);

    try {
      let evalData;
      if (recordedAudioBlob) {
        evalData = await submitVoiceResponse(sessId, recordedAudioBlob, currentQText, qId);
      } else {
        evalData = await submitTextResponse(sessId, textToSend, currentQText, qId);
      }

      setEvaluationResult(evalData);
      setRecordedAudioBlob(null);

      // AI response bubble with score and feedback
      const fb = evalData?.coaching_feedback;
      const score = fb?.overall_score || 75;
      const feedbackSnippet = fb?.follow_up_question
        ? `[Score: ${score}/100] ${fb.strengths?.[0] || 'Good response.'} Follow-up: ${fb.follow_up_question}`
        : `[Score: ${score}/100] ${fb?.improved_answer_structure || 'Answer evaluated.'}`;

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: feedbackSnippet,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('Submission failed:', err);
      setErrorMsg('Evaluation submission failed: ' + (err.message || 'Server error'));
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'Response received and logged. Proceed to next question or complete interview.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Fetch next question from backend
  const handleNextQuestion = async () => {
    if (!activeSession?.session_id) return;
    setIsAiThinking(true);
    try {
      const data = await fetchNextQuestion(activeSession.session_id);
      if (data?.question) {
        setActiveSession((prev) => ({
          ...prev,
          question: data.question,
          difficulty: data.difficulty || prev.difficulty,
        }));
        setCurrentQNum((n) => n + 1);
        setRecordedAudioBlob(null);
        setInputMessage('');
        setRecordingSeconds(0);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'ai',
            text: data.question.question,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.warn('Next question fetch error:', err);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Play audio playback
  const handleTogglePlayAudio = (msgId, text) => {
    if (playingAudioId === msgId) {
      window.speechSynthesis?.cancel();
      setPlayingAudioId(null);
    } else {
      window.speechSynthesis?.cancel();
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.onend = () => setPlayingAudioId(null);
        utter.onerror = () => setPlayingAudioId(null);
        window.speechSynthesis.speak(utter);
        setPlayingAudioId(msgId);
      }
    }
  };

  // Pacing and filler word analysis for Live Analysis tab
  const words = inputMessage.trim().split(/\s+/).filter(Boolean);
  const wpm = recordingSeconds > 5 ? Math.round((words.length / recordingSeconds) * 60) : 135;
  const fillersFound = (inputMessage.match(/\b(like|basically|um|uh|actually|you know)\b/gi) || []).length;

  // -------------------------------------------------------------
  // VIEW 1: PRE-INTERVIEW SETUP LAUNCHER ("Ask me start practice pls")
  // -------------------------------------------------------------
  if (!isSessionActive) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Start a Practice Interview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Choose an interview mode to launch your real-time AI simulation session.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-900 text-red-300 text-xs sm:text-sm flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 3 Mode Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Technical */}
          <div
            onClick={() => setSelectedMode('technical')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedMode === 'technical'
                ? 'bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/30 shadow-lg'
                : 'bg-[#121927] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              {selectedMode === 'technical' && (
                <CheckCircle2 className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Technical &amp; Architecture</h3>
              <p className="text-xs text-slate-400 mt-1">
                Data structures, system scaling, API contracts, and database trade-offs.
              </p>
            </div>
          </div>

          {/* 2. HR / Behavioral */}
          <div
            onClick={() => setSelectedMode('hr')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedMode === 'hr'
                ? 'bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                : 'bg-[#121927] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              {selectedMode === 'hr' && (
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">HR &amp; Behavioral (STAR)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Leadership, conflict resolution, accountability, and growth mindset.
              </p>
            </div>
          </div>

          {/* 3. Company Archetype */}
          <div
            onClick={() => setSelectedMode('company')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedMode === 'company'
                ? 'bg-purple-950/30 border-purple-500 ring-2 ring-purple-500/30 shadow-lg'
                : 'bg-[#121927] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              {selectedMode === 'company' && (
                <CheckCircle2 className="w-5 h-5 text-purple-400" />
              )}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Company Archetype</h3>
              <p className="text-xs text-slate-400 mt-1">
                Amazon Leadership Principles, Google Scale &amp; Ambiguity, McKinsey Cases.
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Card */}
        <div className="p-6 rounded-2xl bg-[#121927] border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Session Parameters</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Role
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Software Engineer">Software Engineer (Backend / SDE)</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="DevOps & Cloud Engineer">DevOps &amp; Cloud Engineer</option>
                <option value="AI / Machine Learning Engineer">AI / Machine Learning Engineer</option>
                <option value="Site Reliability Engineer">Site Reliability Engineer (SRE)</option>
                <option value="Technical Product Manager">Technical Product Manager</option>
              </select>
            </div>

            {selectedMode === 'company' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Company Bar
                </label>
                <select
                  value={companyChoice}
                  onChange={(e) => setCompanyChoice(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="amazon">Amazon (Leadership Principles &amp; Bar Raiser)</option>
                  <option value="google">Google (Scale, Ambiguity, Googliness)</option>
                  <option value="mckinsey">McKinsey (MECE Case Decomposition)</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Initial Difficulty
                </label>
                <select
                  value={difficultyChoice}
                  onChange={(e) => setDifficultyChoice(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="medium">Medium (Standard Industry Bar)</option>
                  <option value="easy">Easy (Foundational Concepts)</option>
                  <option value="hard">Hard (Staff / Senior Engineering Bar)</option>
                </select>
              </div>
            )}
          </div>

          <div className="pt-3 flex justify-end">
            <button
              onClick={handleLaunchSession}
              disabled={isStartingSession}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <span>{isStartingSession ? 'Synthesizing Question...' : 'Begin Practice Interview'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: ACTIVE INTERVIEW COCKPIT (Real-time Audio & Agents)
  // -------------------------------------------------------------
  const currentQuestionText =
    activeSession?.question?.question ||
    messages[0]?.text ||
    'Explain your experience with distributed systems and performance optimization.';
  const currentCompetency = activeSession?.question?.competency || 'Technical Depth';
  const roleTitle = activeSession?.role || `${targetRole} – Interview`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#121927] border border-slate-800 p-4 sm:px-6 rounded-2xl shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-base sm:text-lg font-bold text-white">
            {roleTitle}
          </h1>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900/40 text-blue-300">
              {currentCompetency}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-900/40 text-amber-300">
              {activeSession?.difficulty || difficultyChoice}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-auto">
          {/* Question Counter */}
          <div className="text-xs sm:text-sm font-semibold text-slate-300">
            <span className="text-blue-400 font-bold">{currentQNum}</span>
            <span className="text-slate-500 mx-1">/</span>
            <span>{totalQNum}</span>
          </div>

          {/* Clock Timer (Starts at 00:00) */}
          <div className="flex items-center space-x-1.5 text-xs sm:text-sm font-mono font-medium text-slate-200">
            <Clock className={`w-4 h-4 ${isPaused ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className={isPaused ? 'text-amber-500' : ''}>{formatTimer(totalTimerSeconds)}</span>
          </div>

          {/* End Interview Button */}
          <button
            onClick={() => onEndInterview?.(evaluationResult)}
            className="px-4 py-1.5 sm:py-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            End Interview
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900 text-red-300 text-xs sm:text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Left Interview Question & Waveform, Right Chat/Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column (7 cols): Question + Concentric Visualizer + Controls */}
        <div className="lg:col-span-7 bg-[#080D1A] border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between text-white relative shadow-xl overflow-hidden min-h-[580px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <button
                onClick={() => setShowTips((v) => !v)}
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-colors cursor-pointer ${
                  showTips
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/[0.1] text-slate-300'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Tips</span>
              </button>
            </div>

            {/* Question Text */}
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
              {currentQuestionText}
            </h2>

            {/* Follow-up info badge */}
            <div className="mt-4 inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-950/60 border border-blue-800/40 text-blue-300 text-xs font-medium">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Multi-agent LangGraph analysis evaluates depth, clarity, and STAR structure.</span>
            </div>

            {/* Tips Popover */}
            {showTips && (
              <div className="mt-3 p-3.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-xs text-slate-300 space-y-1.5 backdrop-blur-md">
                <p className="font-semibold text-white">Suggested Response Framework:</p>
                <p>1. <span className="text-blue-300 font-semibold">Situation &amp; Architecture:</span> State the system context and core objectives.</p>
                <p>2. <span className="text-blue-300 font-semibold">Action &amp; Trade-offs:</span> Outline technical rationale and alternatives rejected.</p>
                <p>3. <span className="text-blue-300 font-semibold">Measurable Result:</span> Cite latency, throughput, reliability, or business impact.</p>
              </div>
            )}
          </div>

          {/* Center: Concentric Glowing Audio Wave Visualizer */}
          <div className="my-8 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64">
              <div
                className={`absolute inset-0 rounded-full border border-blue-500/20 transition-all duration-1000 ${
                  isRecording && !isPaused ? 'animate-ping opacity-20' : 'opacity-10'
                }`}
              />
              <div className="absolute inset-4 rounded-full border border-blue-500/25 bg-blue-500/[0.02]" />
              <div className="absolute inset-10 rounded-full border border-blue-400/40 shadow-[0_0_30px_rgba(59,130,246,0.2)] bg-gradient-to-tr from-blue-900/30 to-indigo-950/40" />

              <div className="w-28 h-28 rounded-full bg-[#0D1527] border border-blue-400/60 flex items-center justify-center shadow-inner relative z-10">
                {/* Audio Wave Bars */}
                <div className="flex items-center space-x-1.5 h-12">
                  <div
                    className={`w-1.5 rounded-full ${isRecording ? 'bg-rose-500 animate-audio-bar' : 'bg-slate-600 h-2'}`}
                    style={{ animationDelay: '0.1s' }}
                  />
                  <div
                    className={`w-1.5 rounded-full ${isRecording ? 'bg-rose-400 animate-audio-bar' : 'bg-slate-600 h-4'}`}
                    style={{ animationDelay: '0.3s' }}
                  />
                  <div
                    className={`w-1.5 rounded-full ${isRecording ? 'bg-rose-500 animate-audio-bar' : 'bg-slate-600 h-6'}`}
                    style={{ animationDelay: '0.5s' }}
                  />
                  <div
                    className={`w-1.5 rounded-full ${isRecording ? 'bg-rose-400 animate-audio-bar' : 'bg-slate-600 h-3'}`}
                    style={{ animationDelay: '0.2s' }}
                  />
                  <div
                    className={`w-1.5 rounded-full ${isRecording ? 'bg-rose-500 animate-audio-bar' : 'bg-slate-600 h-2'}`}
                    style={{ animationDelay: '0.4s' }}
                  />
                </div>
              </div>
            </div>

            {/* Recording Timer Badge */}
            <div className="mt-3 flex items-center space-x-2 text-xs font-medium text-slate-300">
              <span
                className={`w-2 h-2 rounded-full ${
                  isRecording && !isPaused ? 'bg-rose-500 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span>
                {isRecording
                  ? isPaused
                    ? `Paused (${formatRecTimer(recordingSeconds)})`
                    : `Recording... ${formatRecTimer(recordingSeconds)}`
                  : recordedAudioBlob
                  ? 'Voice answer captured. Ready to submit or re-record.'
                  : 'Microphone idle. Click Record Answer when ready.'}
              </span>
            </div>
          </div>

          {/* Bottom Controls */}
          <div>
            <div className="flex items-center justify-center gap-3">
              {isRecording && (
                <button
                  onClick={() => setIsPaused((p) => !p)}
                  className="px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] active:scale-95 border border-white/[0.1] text-xs sm:text-sm font-medium text-white flex items-center space-x-2 transition-all cursor-pointer"
                >
                  {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
              )}

              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white flex items-center space-x-2 shadow-lg transition-all cursor-pointer active:scale-95 ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>{recordedAudioBlob ? 'Record Again' : 'Record Answer'}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsTypeMode((t) => !t);
                  setActiveTab('conversation');
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className="px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] active:scale-95 border border-white/[0.1] text-xs sm:text-sm font-medium text-white flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Type className="w-4 h-4" />
                <span>{isTypeMode ? 'Voice Mode' : 'Type Answer'}</span>
              </button>
            </div>

            <div className="mt-5 text-center text-[11px] text-slate-400 space-x-2">
              <span>• Speak naturally</span>
              <span>• Minimal filler pauses</span>
              <span>• Genuine audio captured via browser mic</span>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Split-Screen Chat & Real-time Analysis */}
        <div className="lg:col-span-5 bg-[#0F172A] border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-xl min-h-[580px]">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => setActiveTab('conversation')}
                  className={`pb-1 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
                    activeTab === 'conversation'
                      ? 'text-blue-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Conversation
                  {activeTab === 'conversation' && (
                    <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`pb-1 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
                    activeTab === 'analysis'
                      ? 'text-blue-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Live Analysis
                  {activeTab === 'analysis' && (
                    <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              </div>

              {/* Next Question Shortcut */}
              <button
                onClick={handleNextQuestion}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center space-x-1 cursor-pointer"
              >
                <span>Next Question</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tab 1: Conversation Message Thread */}
            {activeTab === 'conversation' && (
              <div className="mt-4 space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex items-start space-x-3">
                    {msg.sender === 'ai' ? (
                      <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                        AI
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                        You
                      </div>
                    )}

                    <div className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-2xl p-3.5 text-xs text-slate-200 leading-relaxed space-y-2">
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {msg.audioDuration && (
                        <button
                          onClick={() => handleTogglePlayAudio(msg.id, msg.text)}
                          title="Click to play speech synthesis of answer"
                          className={`inline-flex items-center space-x-2 px-2.5 py-1 rounded-full text-[11px] font-mono transition-all cursor-pointer ${
                            playingAudioId === msg.id
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-white/[0.08] text-blue-300 hover:bg-white/[0.14]'
                          }`}
                        >
                          {playingAudioId === msg.id ? (
                            <Pause className="w-3 h-3 fill-current" />
                          ) : (
                            <Play className="w-3 h-3 fill-current text-blue-400" />
                          )}
                          <span>
                            {playingAudioId === msg.id ? 'Playing...' : msg.audioDuration}
                          </span>
                        </button>
                      )}

                      <div className="text-[10px] text-slate-500 text-right font-sans">
                        {msg.time}
                      </div>
                    </div>
                  </div>
                ))}

                {isAiThinking && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                      AI
                    </div>
                    <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl px-4 py-3 text-xs text-slate-400 flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
                      <span className="ml-1 text-[11px] text-slate-300">
                        Multi-agent evaluation running (depth, clarity &amp; STAR)...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Live Analysis Metrics */}
            {activeTab === 'analysis' && (
              <div className="mt-5 space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Pacing (Words Per Minute)</span>
                    <span className={`font-bold ${wpm >= 130 && wpm <= 165 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {wpm} WPM {wpm >= 130 && wpm <= 165 ? '(Optimal)' : '(Adjust cadence)'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round((wpm / 180) * 100))}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Recommended senior engineering delivery range is 130–160 WPM.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Filler Words Detected</span>
                    <span className={`font-bold ${fillersFound === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {fillersFound} ({fillersFound <= 1 ? 'Low' : 'Review'})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Live scan for hesitation words ("like", "basically", "um", "uh").
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Message Input Field */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={
                  recordedAudioBlob
                    ? 'Voice response recorded. Type more or click send to submit...'
                    : isRecording
                    ? 'Speaking... Live speech transcript will appear here...'
                    : 'Type answer or click Record Answer above...'
                }
                className="w-full pl-4 pr-12 py-2.5 text-xs sm:text-sm rounded-xl bg-white/[0.06] border border-white/[0.1] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() && !recordedAudioBlob}
                title="Send answer to AI agents"
                className={`absolute right-2 p-1.5 rounded-lg transition-colors cursor-pointer ${
                  inputMessage.trim() || recordedAudioBlob
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-white/[0.08] text-slate-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
