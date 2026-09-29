import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic, MicOff, Send, Volume2, Type, ChevronLeft, Square,
  RotateCcw, CheckCircle2, Loader2, AlertCircle, Play, Pause,
  SkipForward, Trophy, BarChart3, ArrowRight, MessageCircle, Sparkles, Target,
  FolderGit2, Briefcase
} from 'lucide-react';
import {
  submitTextResponse, submitVoiceResponse,
  fetchNextConversationalQuestion, fetchSessionSummary
} from '../services/api';
import VocalHUD from './VocalHUD';
import SkillGapReport from './SkillGapReport';

const EVAL_STEPS = [
  { label: 'Delivery', desc: 'Clarity & Cadence' },
  { label: 'Content', desc: 'Technical Depth' },
  { label: 'STAR', desc: 'Action & Results' },
  { label: 'Synthesis', desc: 'Actionable Plan' },
];

export default function ConversationalInterview({ sessionData, onBack, onComplete }) {
  // === State ===
  const [phase, setPhase] = useState('question'); // 'question' | 'recording' | 'evaluating' | 'feedback' | 'summary'
  const [currentQuestion, setCurrentQuestion] = useState(sessionData?.question || {});
  const [questionNumber, setQuestionNumber] = useState(sessionData?.question_number || 1);
  const [totalQuestions, setTotalQuestions] = useState(sessionData?.total_questions || 5);
  const [sessionId] = useState(sessionData?.session_id);

  const [responseMode, setResponseMode] = useState('voice');
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  const [evaluating, setEvaluating] = useState(false);
  const [evalStep, setEvalStep] = useState(0);
  const [error, setError] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState('');

  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsSupported] = useState('speechSynthesis' in window);

  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const questionText = currentQuestion?.question || '';
  const competency = currentQuestion?.competency || 'Problem Solving';
  const difficulty = currentQuestion?.difficulty || sessionData?.difficulty || 'medium';

  // === TTS ===
  const speakText = useCallback((text, onEnd) => {
    if (!ttsSupported || !text) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to pick a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }, [ttsSupported]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Speak the question when it changes
  useEffect(() => {
    if (phase === 'question' && questionText && ttsSupported) {
      // Small delay so UI renders first
      const timeout = setTimeout(() => {
        speakText(questionText, () => setPhase('recording'));
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [questionText, phase, ttsSupported, speakText]);

  // Load voices (needed for some browsers)
  useEffect(() => {
    if (ttsSupported) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, [ttsSupported]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  // === Recording ===
  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setLiveTranscript('');

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
            setLiveTranscript(current);
          };
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {}
      }
    } catch {
      setError('Microphone access denied. Switch to text mode or allow microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setError(null);
  };

  // === Submit & Evaluate ===
  const handleSubmit = async () => {
    setError(null);
    if (responseMode === 'voice' && (!audioBlob || recordingTime < 1)) {
      setError('Please record your answer before submitting.');
      return;
    }
    if (responseMode === 'text' && (!textInput.trim() || textInput.trim().length < 2)) {
      setError('Please enter your answer before submitting.');
      return;
    }

    setEvaluating(true);
    setEvalStep(1);
    setPhase('evaluating');

    const stepTimer = setInterval(() => setEvalStep(s => (s < 4 ? s + 1 : s)), 600);

    try {
      let result;
      if (responseMode === 'voice') {
        result = await submitVoiceResponse(sessionId, audioBlob, questionText, currentQuestion?.question_id);
      } else {
        result = await submitTextResponse(sessionId, textInput, questionText, currentQuestion?.question_id);
      }
      clearInterval(stepTimer);
      setEvalStep(4);
      setCurrentFeedback(result);

      setTimeout(() => {
        setEvaluating(false);
        setPhase('feedback');
      }, 500);
    } catch (err) {
      clearInterval(stepTimer);
      setError(err.message);
      setEvaluating(false);
      setPhase('recording');
    }
  };

  // === Next Question / Summary ===
  const handleNextQuestion = async () => {
    setError(null);
    try {
      const next = await fetchNextConversationalQuestion(sessionId);
      if (next.completed) {
        // Load session summary
        const summary = await fetchSessionSummary(sessionId);
        setSummaryData(summary);
        setPhase('summary');
      } else {
        setCurrentQuestion(next.question);
        setQuestionNumber(next.question_number);
        setTotalQuestions(next.total_questions);
        setTextInput('');
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
        setCurrentFeedback(null);
        setPhase('question');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFinishEarly = async () => {
    const summary = await fetchSessionSummary(sessionId);
    setSummaryData(summary);
    setPhase('summary');
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const progressPercent = (questionNumber / totalQuestions) * 100;

  // === Score color ===
  const scoreColor = (score) => {
    if (score >= 80) return 'text-[#30D158]';
    if (score >= 60) return 'text-[#0A84FF]';
    if (score >= 40) return 'text-[#FF9F0A]';
    return 'text-[#FF453A]';
  };

  const gradeGlow = (grade) => {
    if (grade === 'Excellent') return 'from-[#30D158]/20 to-transparent border-[#30D158]/30';
    if (grade === 'Good') return 'from-[#0A84FF]/20 to-transparent border-[#0A84FF]/30';
    if (grade === 'Developing') return 'from-[#FF9F0A]/20 to-transparent border-[#FF9F0A]/30';
    return 'from-[#FF453A]/20 to-transparent border-[#FF453A]/30';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* ===== Top Bar ===== */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => { stopSpeaking(); onBack(); }}
          className="text-xs font-medium text-[#98989D] hover:text-white flex items-center space-x-1 transition px-2.5 py-1.5 rounded-full hover:bg-white/[0.06]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Exit</span>
        </button>
        <div className="flex items-center space-x-2">
          <span className="text-xs px-3 py-1 rounded-full bg-white/[0.06] text-white border border-white/[0.08] font-medium">
            {sessionData?.target_role || 'SDE'}
          </span>
          <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${
            difficulty === 'hard' ? 'bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/25' :
            difficulty === 'medium' ? 'bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/25' :
            'bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/25'
          }`}>
            {difficulty}
          </span>
        </div>
      </div>

      {/* ===== Progress Bar ===== */}
      {phase !== 'summary' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#98989D]">
              <MessageCircle className="w-3.5 h-3.5 inline mr-1" />
              Question {questionNumber} of {totalQuestions}
            </span>
            <span className="text-xs text-[#98989D]">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0A84FF] to-[#5AC8FA] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-2xl bg-[#FF453A]/10 border border-[#FF453A]/25 text-[#FF453A] text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Resume & Job Match Intelligence & Improvement Report */}
      {sessionData?.gap_analysis && (
        <SkillGapReport
          gapAnalysis={sessionData.gap_analysis}
          currentQuestion={currentQuestion}
          isOpenDefault={false}
        />
      )}

      {/* ===== PHASE: Question (TTS speaking) ===== */}
      {phase === 'question' && (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8 shadow-apple-card mb-6 backdrop-blur-2xl text-center">
          <div className="mb-4">
            <div className="w-16 h-16 rounded-full bg-[#0A84FF]/15 border border-[#0A84FF]/30 flex items-center justify-center mx-auto mb-4">
              {isSpeaking ? (
                <div className="flex items-center space-x-0.5">
                  {[10, 18, 14, 22, 12].map((h, i) => (
                    <div key={i} style={{ height: `${h}px`, animationDelay: `${i * 100}ms` }}
                      className="w-1 bg-[#0A84FF] rounded-full animate-audio-bar" />
                  ))}
                </div>
              ) : (
                <Volume2 className="w-7 h-7 text-[#0A84FF]" />
              )}
            </div>
            <span className="text-xs font-semibold text-[#0A84FF] uppercase tracking-wide">
              {isSpeaking ? 'AI Interviewer Speaking...' : 'Preparing Question...'}
            </span>
          </div>

          {currentQuestion?.context_type === 'project_deep_dive' && (
            <div className="mb-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-[#0A84FF]/15 border border-[#0A84FF]/35 text-[#0A84FF] text-xs font-semibold">
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Resume Project Deep-Dive: <strong>{currentQuestion.resume_reference || "Claimed Project"}</strong></span>
            </div>
          )}

          {currentQuestion?.context_type === 'experience_probe' && (
            <div className="mb-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-[#BF5AF2]/15 border border-[#BF5AF2]/35 text-[#BF5AF2] text-xs font-semibold">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Work Experience Probe: <strong>{currentQuestion.resume_reference || "Past Experience"}</strong></span>
            </div>
          )}

          {(currentQuestion?.context_type === 'gap_probe' || currentQuestion?.target_gap) && (
            <div className="mb-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/35 text-[#FF9F0A] text-xs font-semibold">
              <Target className="w-3.5 h-3.5" />
              <span>Bridging JD Gap: <strong>{currentQuestion.target_gap || currentQuestion.resume_reference}</strong></span>
            </div>
          )}

          <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight leading-relaxed mb-4">
            "{questionText}"
          </h2>

          <div className="flex items-center justify-center space-x-3">
            {isSpeaking ? (
              <button onClick={stopSpeaking}
                className="text-xs text-[#98989D] hover:text-white flex items-center space-x-1 transition">
                <Pause className="w-3.5 h-3.5" /> <span>Skip Voice</span>
              </button>
            ) : (
              <button onClick={() => setPhase('recording')}
                className="text-xs text-[#0A84FF] hover:text-white flex items-center space-x-1 transition">
                <ArrowRight className="w-3.5 h-3.5" /> <span>Ready to Answer</span>
              </button>
            )}
          </div>

          {currentQuestion?.reason && (
            <div className="mt-4 pt-3 border-t border-white/[0.06] text-xs text-[#98989D] text-left">
              <span className="text-white font-medium">Gap Rationale: </span>{currentQuestion.reason}
            </div>
          )}
        </div>
      )}

      {/* ===== PHASE: Recording / Answering ===== */}
      {phase === 'recording' && (
        <>
          {/* Question reminder */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5 mb-4 backdrop-blur-2xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-semibold text-[#0A84FF] uppercase tracking-wide">Question {questionNumber}</span>
                  {currentQuestion?.target_gap && (
                    <span className="px-2 py-0.5 rounded-md bg-[#FF9F0A]/20 text-[#FF9F0A] text-[10px] font-semibold border border-[#FF9F0A]/30">
                      🎯 Focus: {currentQuestion.target_gap}
                    </span>
                  )}
                </div>
                <p className="text-sm text-white leading-relaxed">"{questionText}"</p>
              </div>
              {ttsSupported && (
                <button onClick={() => speakText(questionText)}
                  className="ml-3 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-[#0A84FF] transition shrink-0">
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex justify-center mb-4">
            <div className="p-1 rounded-full bg-white/[0.06] border border-white/[0.06] flex space-x-1">
              <button onClick={() => setResponseMode('voice')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-all ${
                  responseMode === 'voice' ? 'bg-white/[0.14] text-white shadow-apple-pill font-semibold' : 'text-[#98989D] hover:text-white'
                }`}>
                <Mic className="w-3.5 h-3.5" /> <span>Voice</span>
              </button>
              <button onClick={() => setResponseMode('text')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-all ${
                  responseMode === 'text' ? 'bg-white/[0.14] text-white shadow-apple-pill font-semibold' : 'text-[#98989D] hover:text-white'
                }`}>
                <Type className="w-3.5 h-3.5" /> <span>Type</span>
              </button>
            </div>
          </div>

          {/* Voice recording */}
          {responseMode === 'voice' && (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8 text-center mb-4 backdrop-blur-2xl">
              {isRecording ? (
                <div className="mb-5">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 rounded-full bg-[#FF453A]/20 animate-recording-pulse absolute inset-0" />
                    <button onClick={stopRecording}
                      className="w-20 h-20 rounded-full bg-[#FF453A] hover:bg-[#D9382F] active:scale-95 text-white flex flex-col items-center justify-center shadow-lg transition relative z-10">
                      <Square className="w-6 h-6 fill-current mb-0.5" />
                      <span className="text-[9px] font-semibold uppercase">Stop</span>
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-center space-x-1.5 h-8">
                    {[12, 24, 16, 28, 20, 14, 26, 18, 30, 16, 22].map((h, i) => (
                      <div key={i} style={{ height: `${h}px`, animationDelay: `${i * 90}ms` }}
                        className="w-1 bg-[#FF453A] rounded-full animate-audio-bar" />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-center space-x-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-[#FF453A] animate-pulse" />
                    <span className="text-[#FF453A] font-mono">{formatTime(recordingTime)}</span>
                  </div>

                  {/* Real-Time Vocal HUD */}
                  <div className="mt-4 w-full max-w-md mx-auto text-left">
                    <VocalHUD isRecording={isRecording} transcript={liveTranscript} />
                  </div>
                </div>
              ) : audioBlob ? (
                <div className="mb-4">
                  <div className="w-14 h-14 rounded-full bg-[#30D158]/15 border border-[#30D158]/30 text-[#30D158] flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <p className="text-sm text-white mb-1">Audio Recorded ({formatTime(recordingTime)})</p>
                  <button onClick={resetRecording}
                    className="inline-flex items-center space-x-1.5 text-xs text-[#98989D] hover:text-white transition">
                    <RotateCcw className="w-3.5 h-3.5" /> <span>Re-record</span>
                  </button>
                  {audioUrl && (
                    <div className="mt-4 flex items-center space-x-3 bg-white/[0.04] px-4 py-3 rounded-2xl border border-white/[0.08] max-w-md mx-auto">
                      <Volume2 className="w-4 h-4 text-[#0A84FF] shrink-0" />
                      <audio controls src={audioUrl} className="w-full h-8" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-4">
                  <button onClick={startRecording}
                    className="w-20 h-20 rounded-full bg-white/[0.08] hover:bg-white/[0.12] active:scale-95 border border-white/[0.14] text-white flex items-center justify-center shadow-apple-pill transition mx-auto">
                    <Mic className="w-8 h-8 text-[#0A84FF]" />
                  </button>
                  <p className="mt-3 text-sm text-white">Tap to Record</p>
                  <p className="text-xs text-[#98989D] mt-1">Speak naturally as in an interview</p>
                </div>
              )}
            </div>
          )}

          {/* Text input */}
          {responseMode === 'text' && (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5 mb-4 backdrop-blur-2xl">
              <textarea rows={6} value={textInput} onChange={e => setTextInput(e.target.value)}
                placeholder="Structure your answer clearly with Situation, Task, Action, and Result..."
                className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-[#0A84FF] leading-relaxed transition" />
              <div className="mt-2 flex justify-between text-xs text-[#98989D]">
                <span>Words: <strong className="text-white">{textInput.trim() ? textInput.trim().split(/\s+/).length : 0}</strong></span>
                <span>Target: 70-250 words</span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <button onClick={handleFinishEarly}
              className="text-xs text-[#98989D] hover:text-white flex items-center space-x-1 transition px-3 py-2 rounded-full hover:bg-white/[0.06]">
              <SkipForward className="w-3.5 h-3.5" /> <span>End Interview</span>
            </button>
            <button disabled={evaluating || isRecording}
              onClick={handleSubmit}
              className="bg-[#0A84FF] hover:bg-[#0071E3] active:scale-[0.98] text-white font-medium px-6 py-2.5 rounded-full shadow-apple-pill flex items-center space-x-2 transition disabled:opacity-40 text-sm">
              <Send className="w-4 h-4" /> <span>Submit & Evaluate</span>
            </button>
          </div>
        </>
      )}

      {/* ===== PHASE: Evaluating ===== */}
      {phase === 'evaluating' && (
        <div className="bg-white/[0.04] border border-[#0A84FF]/30 rounded-3xl p-6 shadow-apple-card text-center backdrop-blur-2xl">
          <div className="flex items-center justify-center space-x-2 text-[#0A84FF] font-medium text-sm mb-5">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Multi-Agent Evaluation Pipeline...</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {EVAL_STEPS.map((step, i) => (
              <div key={i} className={`p-3 rounded-2xl border transition-all ${
                evalStep >= i + 1 ? 'bg-[#0A84FF]/15 border-[#0A84FF]/40 text-white' : 'bg-white/[0.02] border-white/[0.06] text-[#636366]'
              }`}>
                <div className="font-semibold mb-0.5">{i + 1}. {step.label}</div>
                <p className="text-[11px] text-[#98989D]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== PHASE: Feedback (brief, then next) ===== */}
      {phase === 'feedback' && currentFeedback && (
        <div className="space-y-4">
          {/* Quick score */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-[#0A84FF] uppercase tracking-wide">
                Response Evaluation
              </span>
              <span className="text-xs text-[#98989D]">Q{questionNumber}/{totalQuestions}</span>
            </div>

            {currentFeedback.coaching_feedback && (
              <div className="text-center mb-4">
                <div className={`text-4xl font-bold ${scoreColor(currentFeedback.coaching_feedback.overall_score)}`}>
                  {Math.round(currentFeedback.coaching_feedback.overall_score)}
                </div>
                <p className="text-xs text-[#98989D] mt-1">out of 100</p>
              </div>
            )}

            {/* Strengths */}
            {currentFeedback.coaching_feedback?.strengths?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-[#30D158] mb-1.5">✓ Strengths</p>
                {(typeof currentFeedback.coaching_feedback.strengths === 'string'
                  ? JSON.parse(currentFeedback.coaching_feedback.strengths)
                  : currentFeedback.coaching_feedback.strengths
                ).slice(0, 2).map((s, i) => (
                  <p key={i} className="text-xs text-[#98989D] ml-3 mb-0.5">• {s}</p>
                ))}
              </div>
            )}

            {/* Improvements */}
            {currentFeedback.coaching_feedback?.improvement_areas?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-[#FF9F0A] mb-1.5">△ Improve</p>
                {(typeof currentFeedback.coaching_feedback.improvement_areas === 'string'
                  ? JSON.parse(currentFeedback.coaching_feedback.improvement_areas)
                  : currentFeedback.coaching_feedback.improvement_areas
                ).slice(0, 2).map((s, i) => (
                  <p key={i} className="text-xs text-[#98989D] ml-3 mb-0.5">• {s}</p>
                ))}
              </div>
            )}

            {/* Improved answer TTS */}
            {currentFeedback.coaching_feedback?.improved_answer_structure && ttsSupported && (
              <button
                onClick={() => speakText(currentFeedback.coaching_feedback.improved_answer_structure)}
                className="w-full mt-3 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-xs text-[#0A84FF] font-medium flex items-center justify-center space-x-2 hover:bg-white/[0.1] transition"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>🔊 Hear Executive Rephrase</span>
              </button>
            )}
          </div>

          {/* Next question button */}
          <button onClick={handleNextQuestion}
            className="w-full bg-[#0A84FF] hover:bg-[#0071E3] active:scale-[0.98] text-white font-medium py-3 rounded-full shadow-apple-pill flex items-center justify-center space-x-2 transition text-sm">
            {questionNumber >= totalQuestions ? (
              <><Trophy className="w-4 h-4" /> <span>View Session Summary</span></>
            ) : (
              <><ArrowRight className="w-4 h-4" /> <span>Next Question ({questionNumber + 1}/{totalQuestions})</span></>
            )}
          </button>
        </div>
      )}

      {/* ===== PHASE: Session Summary ===== */}
      {phase === 'summary' && summaryData && (
        <div className="space-y-4">
          {/* Header */}
          <div className={`bg-gradient-to-b ${gradeGlow(summaryData.aggregate?.grade)} rounded-3xl p-6 border backdrop-blur-2xl text-center`}>
            <Trophy className="w-10 h-10 mx-auto mb-3 text-[#FFD60A]" />
            <h2 className="text-xl font-bold text-white mb-1">Interview Complete</h2>
            <p className="text-sm text-[#98989D] mb-4">{summaryData.total_questions} questions answered</p>

            {summaryData.aggregate && (
              <div className="flex items-center justify-center space-x-6">
                <div>
                  <div className={`text-4xl font-bold ${scoreColor(summaryData.aggregate.average_overall_score)}`}>
                    {summaryData.aggregate.average_overall_score}
                  </div>
                  <p className="text-xs text-[#98989D] mt-1">Average Score</p>
                </div>
                <div className="w-px h-12 bg-white/[0.1]" />
                <div>
                  <div className="text-2xl font-bold text-white">{summaryData.aggregate.grade}</div>
                  <p className="text-xs text-[#98989D] mt-1">Session Grade</p>
                </div>
              </div>
            )}
          </div>

          {/* Dimension averages */}
          {summaryData.aggregate && (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5 backdrop-blur-2xl">
              <h3 className="text-xs font-semibold text-[#0A84FF] uppercase tracking-wide mb-3">Performance Breakdown</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Communication', value: summaryData.aggregate.average_communication_score, icon: '🗣️' },
                  { label: 'Content', value: summaryData.aggregate.average_content_score, icon: '📚' },
                  { label: 'STAR', value: summaryData.aggregate.average_star_score, icon: '⭐' },
                ].map((dim, i) => dim.value != null && (
                  <div key={i} className="text-center p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                    <div className="text-lg mb-0.5">{dim.icon}</div>
                    <div className={`text-lg font-bold ${scoreColor(dim.value * 10)}`}>{dim.value}</div>
                    <p className="text-[10px] text-[#98989D] mt-0.5">{dim.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-question results */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5 backdrop-blur-2xl">
            <h3 className="text-xs font-semibold text-[#0A84FF] uppercase tracking-wide mb-3">Question-by-Question</h3>
            <div className="space-y-3">
              {summaryData.questions?.map((q, i) => (
                <div key={i} className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-semibold text-white">Q{q.question_number}</span>
                    <span className={`text-sm font-bold ${scoreColor(q.overall_score)}`}>
                      {Math.round(q.overall_score)}/100
                    </span>
                  </div>
                  <p className="text-xs text-[#98989D] line-clamp-2">{q.question_text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button onClick={onBack}
              className="flex-1 py-3 rounded-full bg-white/[0.06] border border-white/[0.08] text-white text-sm font-medium hover:bg-white/[0.1] transition">
              Back to Modes
            </button>
            <button onClick={() => onComplete?.(summaryData)}
              className="flex-1 py-3 rounded-full bg-[#0A84FF] hover:bg-[#0071E3] text-white text-sm font-medium shadow-apple-pill transition flex items-center justify-center space-x-2">
              <BarChart3 className="w-4 h-4" /> <span>View Dashboard</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
