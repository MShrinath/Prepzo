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
  Shield,
  Volume2,
  Check,
  Loader2
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

  // Spotlight active question (displayed prominently at top & left)
  const [currentQuestionText, setCurrentQuestionText] = useState(
    initialSessionData?.question?.question || 'Technical Interview Question'
  );
  const [currentCompetency, setCurrentCompetency] = useState(
    initialSessionData?.question?.competency || 'Technical Depth'
  );

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
  const [currentQNum, setCurrentQNum] = useState(1);
  const [totalQNum, setTotalQNum] = useState(5);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Audio recording refs & URLs
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const previewAudioRef = useRef(null);
  const messageAudioRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Message list initialized with structured types
  const [messages, setMessages] = useState([]);

  // Auto-scroll chatbox smoothly to latest messages
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    } else if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom(true);
    }, 60);
    return () => clearTimeout(timer);
  }, [messages, isAiThinking, activeTab]);

  // Clean up media streams and audio on unmount
  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      previewAudioRef.current?.pause();
      messageAudioRef.current?.pause();
    };
  }, []);

  // Sync if initialSessionData changes from outside
  useEffect(() => {
    if (initialSessionData?.session_id) {
      setActiveSession(initialSessionData);
      setIsSessionActive(true);
      setTotalTimerSeconds(0);
      setRecordingSeconds(0);
      setIsRecording(false);
      const qText = initialSessionData?.question?.question || 'Technical Interview Question';
      setCurrentQuestionText(qText);
      setCurrentCompetency(initialSessionData?.question?.competency || 'Technical Depth');
      setMessages([
        {
          id: 1,
          type: 'ai_question',
          sender: 'ai',
          qNum: initialSessionData?.question_number || 1,
          text: qText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setCurrentQNum(initialSessionData?.question_number || 1);
      setTotalQNum(initialSessionData?.total_questions || 5);
    }
  }, [initialSessionData]);

  // Overall session stopwatch
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

  const getScoreStatus = (score) => {
    if (score >= 85) return 'Exceeds Expectations';
    if (score >= 70) return 'Solid Performance';
    if (score >= 55) return 'Developing';
    return 'Needs Focus';
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 70) return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    if (score >= 55) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
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
        setRecordedAudioBlob(null);
        setRecordedAudioUrl(null);

        const qText = session.question?.question || 'Interview question generated by AI.';
        setCurrentQuestionText(qText);
        setCurrentCompetency(session.question?.competency || 'Technical Depth');
        setMessages([
          {
            id: 1,
            type: 'ai_question',
            sender: 'ai',
            qNum: 1,
            text: qText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setCurrentQNum(session.question_number || 1);
        setTotalQNum(session.total_questions || 5);
      }
    } catch (err) {
      console.error('Failed to start session:', err);
      setErrorMsg('Could not initialize interview session with backend.');
    } finally {
      setIsStartingSession(false);
    }
  };

  // Start pure microphone recording (no text dumping!)
  const handleStartRecording = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
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
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      // 250ms timeslice ensures chunks flush reliably
      mediaRecorder.start(250);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingSeconds(0);
      setRecordedAudioBlob(null);
      setRecordedAudioUrl(null);
    } catch (err) {
      console.warn('Microphone access denied:', err);
      setErrorMsg('Microphone access denied. Please allow microphone permissions or switch to Type Answer mode.');
      setIsRecording(false);
    }
  };

  // Stop recording - robust to both 'recording' and 'paused' states
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping mediaRecorder:', err);
      }
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  // Real pause / resume toggle for mediaRecorder
  const handleTogglePause = () => {
    if (!mediaRecorderRef.current) return;
    try {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      } else if (mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      }
    } catch (err) {
      console.warn('Error toggling pause:', err);
      setIsPaused((p) => !p);
    }
  };

  // Discard and cancel recording
  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error canceling mediaRecorder:', err);
      }
    }
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
    setIsPaused(false);
    setRecordingSeconds(0);
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
  };

  // Toggle preview playback of recorded audio before submitting
  const handleTogglePreviewAudio = () => {
    if (!recordedAudioUrl) return;
    if (previewPlaying) {
      previewAudioRef.current?.pause();
      setPreviewPlaying(false);
    } else {
      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio(recordedAudioUrl);
        previewAudioRef.current.onended = () => setPreviewPlaying(false);
      } else {
        previewAudioRef.current.src = recordedAudioUrl;
      }
      previewAudioRef.current.play();
      setPreviewPlaying(true);
    }
  };

  // Re-hear voice from chat message
  const handleTogglePlayMessageAudio = (msgId, audioUrl) => {
    if (playingAudioId === msgId) {
      messageAudioRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      messageAudioRef.current?.pause();
      if (!audioUrl) return;
      const audio = new Audio(audioUrl);
      messageAudioRef.current = audio;
      audio.onended = () => setPlayingAudioId(null);
      audio.onerror = () => setPlayingAudioId(null);
      audio.play();
      setPlayingAudioId(msgId);
    }
  };

  // Submit genuine voice recording to AI
  const handleSubmitVoiceRecording = async () => {
    if (!recordedAudioBlob) {
      setErrorMsg('Please record your voice first before submitting.');
      return;
    }

    const sessId = activeSession?.session_id;
    const qId = activeSession?.question?.question_id;
    const audioUrl = recordedAudioUrl;
    const durationLabel = formatTimer(recordingSeconds);

    // Add candidate voice bubble placeholder to chat
    const userMsgId = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        type: 'user_response',
        sender: 'user',
        responseMode: 'voice',
        audioUrl: audioUrl,
        audioDuration: durationLabel,
        text: 'Voice response submitted. Transcribing and analyzing speech...',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    setIsAiThinking(true);
    setErrorMsg(null);

    try {
      const evalData = await submitVoiceResponse(sessId, recordedAudioBlob, currentQuestionText, qId);
      setEvaluationResult(evalData);

      const transcript = evalData?.transcript || 'Audio analyzed.';
      const audioMetrics = evalData?.audio_metrics || {};
      const fb = evalData?.coaching_feedback;
      const comm = evalData?.communication_evaluation;
      const content = evalData?.content_evaluation;
      const star = evalData?.star_evaluation;

      const overall = fb?.overall_score || 75;
      const commAvg = comm
        ? Math.round((comm.clarity_score + comm.conciseness_score + comm.structure_score + comm.communication_quality_score) / 4)
        : 75;
      const techAvg = content
        ? Math.round((content.technical_depth_score + content.correctness_score + content.relevance_score) / 3)
        : 78;
      const starAvg = star?.applicable
        ? Math.round((star.situation_score + star.task_score + star.action_score + star.result_score) / 4)
        : 70;

      const fillerCount = audioMetrics?.filler_words_count ?? 0;
      const fillerList = audioMetrics?.filler_words_detected || [];
      const wpm = audioMetrics?.speaking_rate_wpm || 140;

      // 1. Update candidate voice bubble with real AI transcript & speech metrics
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMsgId
            ? {
                ...m,
                text: transcript,
                audioMetrics: {
                  wpm,
                  fillerCount,
                  fillerList,
                  duration: durationLabel,
                },
              }
            : m
        )
      );

      // 2. Add dedicated Score & Feedback Infobox to timeline
      const infoboxId = Date.now() + 1;
      setMessages((prev) => [
        ...prev,
        {
          id: infoboxId,
          type: 'evaluation_infobox',
          sender: 'ai',
          overallScore: overall,
          scoreStatus: getScoreStatus(overall),
          commScore: commAvg,
          techScore: techAvg,
          starScore: starAvg,
          audioMetrics: {
            wpm,
            fillerCount,
            fillerList,
          },
          strengths: fb?.strengths || ['Good structured explanation'],
          improvements: fb?.improvement_areas || ['Quantify measurable results'],
          improvedStructure: fb?.improved_answer_structure,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // 3. Process Next Question or Follow-up: Update Spotlight on top & add new question bubble
      let nextQuestion = fb?.follow_up_question;
      if (!nextQuestion) {
        try {
          const nextData = await fetchNextQuestion(sessId);
          nextQuestion = nextData?.question?.question;
        } catch (e) {
          console.warn('Next question fetch error:', e);
        }
      }

      if (nextQuestion) {
        const nextQNum = currentQNum + 1;
        setCurrentQNum((n) => Math.min(n + 1, totalQNum));
        setCurrentQuestionText(nextQuestion);

        // Add separate new question bubble to chat
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            type: 'ai_question',
            sender: 'ai',
            qNum: nextQNum,
            isFollowUp: true,
            text: nextQuestion,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }

      // Reset recording cockpit state for next question
      setRecordedAudioBlob(null);
      setRecordedAudioUrl(null);
      setRecordingSeconds(0);
      setIsRecording(false);
    } catch (err) {
      console.error('Voice submission failed:', err);
      setErrorMsg(err.message || 'Failed to submit voice recording.');
    } finally {
      setIsAiThinking(false);
    }
  };

  // Submit typed text response to AI
  const handleSubmitTextResponse = async () => {
    const textToSend = inputMessage.trim();
    if (!textToSend) {
      setErrorMsg('Please enter your answer text before submitting.');
      return;
    }

    const sessId = activeSession?.session_id;
    const qId = activeSession?.question?.question_id;

    // Add user typed message to chat
    const userMsgId = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        type: 'user_response',
        sender: 'user',
        responseMode: 'text',
        text: textToSend,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    setInputMessage('');
    setIsAiThinking(true);
    setErrorMsg(null);

    try {
      const evalData = await submitTextResponse(sessId, textToSend, currentQuestionText, qId);
      setEvaluationResult(evalData);

      const fb = evalData?.coaching_feedback;
      const comm = evalData?.communication_evaluation;
      const content = evalData?.content_evaluation;
      const star = evalData?.star_evaluation;

      const overall = fb?.overall_score || 75;
      const commAvg = comm
        ? Math.round((comm.clarity_score + comm.conciseness_score + comm.structure_score + comm.communication_quality_score) / 4)
        : 75;
      const techAvg = content
        ? Math.round((content.technical_depth_score + content.correctness_score + content.relevance_score) / 3)
        : 78;
      const starAvg = star?.applicable
        ? Math.round((star.situation_score + star.task_score + star.action_score + star.result_score) / 4)
        : 70;

      // 1. Add dedicated Score & Feedback Infobox to timeline
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'evaluation_infobox',
          sender: 'ai',
          overallScore: overall,
          scoreStatus: getScoreStatus(overall),
          commScore: commAvg,
          techScore: techAvg,
          starScore: starAvg,
          strengths: fb?.strengths || ['Clear and concise articulation'],
          improvements: fb?.improvement_areas || ['Elaborate on production trade-offs'],
          improvedStructure: fb?.improved_answer_structure,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // 2. Process Next Question or Follow-up: Update Spotlight on top & add new question bubble
      let nextQuestion = fb?.follow_up_question;
      if (!nextQuestion) {
        try {
          const nextData = await fetchNextQuestion(sessId);
          nextQuestion = nextData?.question?.question;
        } catch (e) {
          console.warn('Next question fetch error:', e);
        }
      }

      if (nextQuestion) {
        const nextQNum = currentQNum + 1;
        setCurrentQNum((n) => Math.min(n + 1, totalQNum));
        setCurrentQuestionText(nextQuestion);

        // Add separate new question bubble to chat
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            type: 'ai_question',
            sender: 'ai',
            qNum: nextQNum,
            isFollowUp: true,
            text: nextQuestion,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.error('Text submission failed:', err);
      setErrorMsg(err.message || 'Failed to submit response.');
    } finally {
      setIsAiThinking(false);
    }
  };

  // -------------------------------------------------------------
  // VIEW 1: PRE-INTERVIEW SETUP LAUNCHER
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
              {selectedMode === 'technical' && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Technical &amp; Architecture</h3>
              <p className="text-xs text-slate-400 mt-1">
                Data structures, system scaling, API contracts, and database trade-offs.
              </p>
            </div>
          </div>

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
              {selectedMode === 'hr' && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">HR &amp; Behavioral (STAR)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Leadership, conflict resolution, accountability, and growth mindset.
              </p>
            </div>
          </div>

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
              {selectedMode === 'company' && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
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
  // VIEW 2: ACTIVE INTERVIEW COCKPIT (Pure Voice & AI Infoboxes)
  // -------------------------------------------------------------
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

          {/* Clock Timer */}
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

      {/* Main Grid: Left Chatbox Timeline (Auto-scroll to latest), Right Question Spotlight & Voice Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column (7 cols): Chatbox with Auto-Scroll, Speech Metrics & Score Infoboxes */}
        <div className="lg:col-span-7 bg-[#0F172A] border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-xl min-h-[600px]">
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
                  Conversation &amp; Infobox ({messages.length})
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
                  Speech Metrics
                  {activeTab === 'analysis' && (
                    <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Session</span>
              </div>
            </div>

            {/* Tab 1: Conversation Timeline (Always auto-scrolls to latest message) */}
            {activeTab === 'conversation' && (
              <div
                ref={chatContainerRef}
                className="mt-4 space-y-4 max-h-[500px] overflow-y-auto pr-2 scroll-smooth"
              >
                {messages.map((msg) => {
                  // Case 1: AI Question Bubble
                  if (msg.type === 'ai_question') {
                    return (
                      <div key={msg.id} className="flex items-start space-x-3 animate-fadeIn">
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                          AI
                        </div>
                        <div className="flex-1 bg-white/[0.06] border border-purple-500/20 rounded-2xl p-3.5 text-xs text-slate-200 leading-relaxed space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-purple-300">
                              {msg.isFollowUp ? `Follow-Up Question (Turn ${msg.qNum})` : `Question ${msg.qNum}`}
                            </span>
                            <span className="text-[10px] text-slate-500">{msg.time}</span>
                          </div>
                          <p className="font-semibold text-white text-sm">{msg.text}</p>
                        </div>
                      </div>
                    );
                  }

                  // Case 2: Candidate Response Bubble (Voice or Typed)
                  if (msg.type === 'user_response') {
                    return (
                      <div key={msg.id} className="flex items-start space-x-3 animate-fadeIn">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                          You
                        </div>
                        <div className="flex-1 bg-blue-950/20 border border-blue-900/40 rounded-2xl p-3.5 text-xs text-slate-200 leading-relaxed space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-blue-300">
                              {msg.responseMode === 'voice' ? 'Your Spoken Response' : 'Your Typed Answer'}
                            </span>
                            <span className="text-[10px] text-slate-500">{msg.time}</span>
                          </div>

                          {/* If voice response: Re-hear Audio Player Widget */}
                          {msg.audioUrl && (
                            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                              <button
                                onClick={() => handleTogglePlayMessageAudio(msg.id, msg.audioUrl)}
                                className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
                              >
                                {playingAudioId === msg.id ? (
                                  <Pause className="w-4 h-4 fill-current text-blue-400" />
                                ) : (
                                  <Play className="w-4 h-4 fill-current text-blue-400" />
                                )}
                                <span>{playingAudioId === msg.id ? 'Playing Voice...' : `Re-hear Audio (${msg.audioDuration})`}</span>
                              </button>
                              <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                          )}

                          {/* Underneath: Verbatim Transcript */}
                          <div className="pt-1 text-slate-300 text-xs">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                              Transcript:
                            </span>
                            <p className="italic text-slate-200 whitespace-pre-wrap">"{msg.text}"</p>
                          </div>

                          {/* Audio Speech Diagnostics Pills */}
                          {msg.audioMetrics && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                              <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/80 text-slate-300">
                                Cadence: <strong className="text-white">{msg.audioMetrics.wpm} WPM</strong>
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/80 text-slate-300">
                                Filler Words:{' '}
                                <strong className={msg.audioMetrics.fillerCount > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                                  {msg.audioMetrics.fillerCount}
                                </strong>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Case 3: Dedicated Score & Diagnostic Infobox Card
                  if (msg.type === 'evaluation_infobox') {
                    return (
                      <div
                        key={msg.id}
                        className="p-4 rounded-2xl bg-[#121927] border border-blue-900/40 shadow-lg space-y-3 animate-fadeIn"
                      >
                        {/* Top: Score Badge & Rating */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Diagnostic Assessment
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getScoreBadgeColor(msg.overallScore)}`}>
                            Score: {msg.overallScore}/100 • {msg.scoreStatus}
                          </span>
                        </div>

                        {/* Metric Breakdown Pills */}
                        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Technical</span>
                            <strong className="text-white text-xs">{msg.techScore}%</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Communication</span>
                            <strong className="text-white text-xs">{msg.commScore}%</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">STAR Alignment</span>
                            <strong className="text-white text-xs">{msg.starScore}%</strong>
                          </div>
                        </div>

                        {/* Strengths & Recommendation */}
                        {msg.strengths?.length > 0 && (
                          <div className="text-xs text-slate-300 space-y-1">
                            <span className="text-emerald-400 font-semibold block text-[11px]">
                              Demonstrated Strength:
                            </span>
                            <p>{msg.strengths[0]}</p>
                          </div>
                        )}

                        {msg.improvedStructure && (
                          <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-900/30 text-xs text-purple-200">
                            <span className="font-semibold text-purple-300 block mb-0.5">
                              Recommended Architecture:
                            </span>
                            <p className="line-clamp-3">{msg.improvedStructure}</p>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return null;
                })}

                {/* Live AI Thinking Indicator */}
                {isAiThinking && (
                  <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-300 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400 flex-shrink-0" />
                    <span>AI Interviewer is evaluating your response, transcribing speech, and generating diagnostics...</span>
                  </div>
                )}

                {/* Auto-scroll anchor */}
                <div ref={messagesEndRef} className="h-1" />
              </div>
            )}

            {/* Tab 2: Speech Metrics Overview */}
            {activeTab === 'analysis' && (
              <div className="mt-5 space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Pacing (Words Per Minute)</span>
                    <span className="font-bold text-emerald-400">135–160 WPM Target</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full w-[75%]" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Natural cadence ensures clear comprehension in distributed system design and behavioral rounds.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Filler Word Detection</span>
                    <span className="font-bold text-blue-400">Active Scan</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Scans voice audio for unconscious filler words ("like", "basically", "um", "uh", "you know").
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Typing Input Field */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitTextResponse()}
                placeholder={
                  isTypeMode
                    ? 'Type your answer here and press Enter to submit...'
                    : 'Type answer or use Record Answer on the right...'
                }
                className="w-full pl-4 pr-12 py-2.5 text-xs sm:text-sm rounded-xl bg-white/[0.06] border border-white/[0.1] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleSubmitTextResponse}
                disabled={!inputMessage.trim() || isAiThinking}
                title="Submit typed answer"
                className={`absolute right-2 p-1.5 rounded-lg transition-colors cursor-pointer ${
                  inputMessage.trim() && !isAiThinking
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                    : 'bg-white/[0.08] text-slate-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Main Question Spotlight + Voice Recording Studio */}
        <div className="lg:col-span-5 bg-[#080D1A] border border-slate-800 rounded-3xl p-6 sm:p-7 flex flex-col justify-between text-white relative shadow-xl overflow-hidden min-h-[600px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Active Question • Turn {currentQNum} of {totalQNum}
                </span>
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

            {/* Main Spotlight Question (Always synced with latest question) */}
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug animate-fadeIn">
              {currentQuestionText}
            </h2>

            {/* Helpful indicator */}
            <div className="mt-3.5 inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-950/60 border border-blue-800/40 text-blue-300 text-xs font-medium">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Tap the circle or Record button below to speak your response.</span>
            </div>

            {/* Tips Popover */}
            {showTips && (
              <div className="mt-3 p-3.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-xs text-slate-300 space-y-1.5 backdrop-blur-md">
                <p className="font-semibold text-white">Suggested Response Framework:</p>
                <p>1. <span className="text-blue-300 font-semibold">Situation:</span> Set up the architecture or business context.</p>
                <p>2. <span className="text-blue-300 font-semibold">Action &amp; Trade-offs:</span> Explain specific choices, tools, and alternatives.</p>
                <p>3. <span className="text-blue-300 font-semibold">Measurable Result:</span> Cite latency, scale, reliability, or impact.</p>
              </div>
            )}
          </div>

          {/* Center: Concentric Glowing Audio Wave Visualizer & Interactive Recording Trigger */}
          <div className="my-6 flex flex-col items-center justify-center">
            <div
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (isRecording) handleStopRecording();
                  else handleStartRecording();
                }
              }}
              title={isRecording ? 'Click circle to stop recording' : 'Click circle to start recording'}
              className="relative flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56 cursor-pointer group select-none transition-transform active:scale-95"
            >
              {/* Outer animated ripple */}
              <div
                className={`absolute inset-0 rounded-full border transition-all duration-700 ${
                  isRecording && !isPaused
                    ? 'border-rose-500/40 animate-ping opacity-30'
                    : 'border-blue-500/20 opacity-20 group-hover:opacity-40'
                }`}
              />
              <div
                className={`absolute inset-3.5 rounded-full border transition-all duration-500 ${
                  isRecording
                    ? 'border-rose-500/30 bg-rose-500/[0.04]'
                    : 'border-blue-500/25 bg-blue-500/[0.02] group-hover:border-blue-400/40'
                }`}
              />
              <div
                className={`absolute inset-8 rounded-full border transition-all duration-500 ${
                  isRecording
                    ? 'border-rose-400/60 shadow-[0_0_35px_rgba(244,63,94,0.35)] bg-gradient-to-tr from-rose-950/40 to-slate-900/60'
                    : 'border-blue-400/40 shadow-[0_0_30px_rgba(59,130,246,0.2)] bg-gradient-to-tr from-blue-900/30 to-indigo-950/40 group-hover:border-blue-400/60'
                }`}
              />

              {/* Center Core */}
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border flex flex-col items-center justify-center shadow-inner relative z-10 transition-all duration-300 ${
                  isRecording
                    ? 'bg-[#180A0E] border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.5)] group-hover:scale-105'
                    : 'bg-[#0D1527] border-blue-400/60 group-hover:border-blue-400 group-hover:scale-105 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                }`}
              >
                {isRecording ? (
                  <div className="flex flex-col items-center space-y-1.5">
                    {/* Animated sound wave bars */}
                    <div className="flex items-center space-x-1.5 h-6">
                      <div className="w-1.5 rounded-full bg-rose-500 animate-audio-bar" style={{ animationDelay: '0.1s' }} />
                      <div className="w-1.5 rounded-full bg-rose-400 animate-audio-bar" style={{ animationDelay: '0.3s' }} />
                      <div className="w-1.5 rounded-full bg-rose-500 animate-audio-bar" style={{ animationDelay: '0.5s' }} />
                      <div className="w-1.5 rounded-full bg-rose-400 animate-audio-bar" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1.5 rounded-full bg-rose-500 animate-audio-bar" style={{ animationDelay: '0.4s' }} />
                    </div>
                    <div className="flex items-center space-x-1 text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                      <Square className="w-2.5 h-2.5 fill-rose-400" />
                      <span>Stop</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-1 text-blue-400 group-hover:text-blue-300">
                    <Mic className="w-6 h-6 sm:w-7 sm:h-7" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      {recordedAudioBlob ? 'Re-record' : 'Tap to Record'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Recording Timer Badge */}
            <div className="mt-3 flex items-center space-x-2 text-xs font-medium text-slate-300">
              <span
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  isRecording && !isPaused
                    ? 'bg-rose-500 animate-ping'
                    : isRecording && isPaused
                    ? 'bg-amber-400'
                    : recordedAudioBlob
                    ? 'bg-emerald-400'
                    : 'bg-slate-500'
                }`}
              />
              <span>
                {isRecording
                  ? isPaused
                    ? `Paused (${formatRecTimer(recordingSeconds)}) — Tap Resume to continue`
                    : `Recording voice... ${formatRecTimer(recordingSeconds)} (Click circle or Stop)`
                  : recordedAudioBlob
                  ? `Voice answer captured (${formatTimer(recordingSeconds)}). Ready to review or submit.`
                  : 'Microphone ready. Click circle or button below to speak.'}
              </span>
            </div>
          </div>

          {/* Bottom Recording Cockpit Controls */}
          <div>
            {/* When Audio is recorded and stopped: show Preview + Submit button */}
            {recordedAudioBlob && !isRecording ? (
              <div className="flex flex-wrap items-center justify-center gap-2.5 animate-fadeIn">
                <button
                  onClick={handleTogglePreviewAudio}
                  className="px-4 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white flex items-center space-x-2 transition-all cursor-pointer border border-white/[0.12]"
                >
                  {previewPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-blue-400" />}
                  <span>{previewPlaying ? 'Pause Audio' : 'Preview Recording'}</span>
                </button>

                <button
                  onClick={handleSubmitVoiceRecording}
                  disabled={isAiThinking}
                  className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAiThinking ? 'Analyzing Voice...' : 'Submit Voice Recording'}</span>
                </button>

                <button
                  onClick={handleStartRecording}
                  className="px-4 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-slate-300 flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Re-record</span>
                </button>
              </div>
            ) : isRecording ? (
              /* When Recording: Stable, high-visibility controls */
              <div className="flex flex-wrap items-center justify-center gap-2.5 animate-fadeIn">
                <button
                  onClick={handleStopRecording}
                  className="px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold text-white flex items-center space-x-2 bg-rose-600 hover:bg-rose-500 shadow-xl shadow-rose-600/40 ring-4 ring-rose-500/25 transition-all cursor-pointer active:scale-95"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop Recording ({formatTimer(recordingSeconds)})</span>
                </button>

                <button
                  onClick={handleTogglePause}
                  className="px-4 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>

                <button
                  onClick={handleCancelRecording}
                  className="px-3.5 py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center space-x-1 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            ) : (
              /* When Idle */
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleStartRecording}
                  className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
                >
                  <Mic className="w-4 h-4" />
                  <span>Record Answer</span>
                </button>

                <button
                  onClick={() => {
                    setIsTypeMode(true);
                    setActiveTab('conversation');
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                  className="px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] active:scale-95 border border-white/[0.1] text-xs sm:text-sm font-medium text-white flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <Type className="w-4 h-4" />
                  <span>Type Answer</span>
                </button>
              </div>
            )}

            <div className="mt-5 text-center text-[11px] text-slate-400 space-x-2">
              <span>• Speak naturally</span>
              <span>• Click circle or Stop button</span>
              <span>• AI analyzes WPM &amp; filler words</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
