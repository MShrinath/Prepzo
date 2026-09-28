import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Volume2, Type, Sparkles, AlertCircle, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { submitTextResponse, submitVoiceResponse } from '../services/api';

export default function InterviewScreen({ sessionData, onBack, onCompleteEvaluation }) {
  const [responseMode, setResponseMode] = useState('voice'); // 'voice' | 'text'
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evalStep, setEvalStep] = useState(0);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const questionObj = sessionData?.question || {};
  const questionText = questionObj.question || "Tell me about a challenging technical or workplace problem you resolved.";
  const competency = questionObj.competency || "Problem Solving";
  const difficulty = questionObj.difficulty || sessionData?.difficulty || "medium";
  const mode = sessionData?.mode || "role_practice";

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        // Stop audio tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.warn("Microphone access failed:", err);
      setError("Microphone access was denied or is not available. Please allow microphone access in your browser permissions or switch to Text Response mode above.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSubmit = async () => {
    setError(null);

    // Validate inputs before starting evaluation animation
    if (responseMode === 'voice' && (!audioBlob || recordingTime < 1)) {
      setError("Please record your spoken answer before submitting. Click 'Start Recording', speak clearly into your mic, then click 'Stop Recording'.");
      return;
    }

    if (responseMode === 'text' && (!textInput.trim() || textInput.trim().length < 2)) {
      setError("Please enter your answer in the text box before submitting.");
      return;
    }

    setEvaluating(true);
    setEvalStep(1);

    // Visual progression for multi-agent pipeline
    const stepTimer = setInterval(() => {
      setEvalStep(s => (s < 4 ? s + 1 : s));
    }, 600);

    try {
      let result;
      if (responseMode === 'voice') {
        result = await submitVoiceResponse(
          sessionData.session_id,
          audioBlob,
          questionText,
          questionObj.question_id
        );
      } else {
        result = await submitTextResponse(
          sessionData.session_id,
          textInput,
          questionText,
          questionObj.question_id
        );
      }

      clearInterval(stepTimer);
      setEvalStep(4);
      setTimeout(() => {
        onCompleteEvaluation(result);
      }, 500);

    } catch (err) {
      clearInterval(stepTimer);
      setError(err.message);
      setEvaluating(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="text-xs font-medium text-slate-400 hover:text-white flex items-center space-x-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Interview</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
            {sessionData.target_role || "SDE"}
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium uppercase tracking-wider ${
            difficulty === 'hard' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
            difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {difficulty}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
            {competency}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Question Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl mb-6 backdrop-blur">
        <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Question Prompt</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
          "{questionText}"
        </h2>
        {questionObj.reason && (
          <p className="mt-3 text-xs text-slate-400 italic">
            Targeting: {questionObj.reason}
          </p>
        )}
      </div>

      {/* Response Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex space-x-1">
          <button
            onClick={() => setResponseMode('voice')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition ${
              responseMode === 'voice'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Voice Response (Whisper STT)</span>
          </button>
          <button
            onClick={() => setResponseMode('text')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition ${
              responseMode === 'text'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Type Answer</span>
          </button>
        </div>
      </div>

      {/* Voice Mode Interface */}
      {responseMode === 'voice' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center shadow-lg mb-6">
          <div className="flex flex-col items-center justify-center">
            {isRecording ? (
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-red-500/20 animate-ping absolute inset-0" />
                <button
                  onClick={stopRecording}
                  className="w-24 h-24 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-600/30 transition relative z-10"
                >
                  <MicOff className="w-10 h-10" />
                </button>
              </div>
            ) : (
              <button
                onClick={startRecording}
                className="w-24 h-24 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30 mb-6 transition"
              >
                <Mic className="w-10 h-10" />
              </button>
            )}

            <div className="text-sm font-semibold text-slate-300 mb-1">
              {isRecording ? `Recording in progress: ${formatTime(recordingTime)}` : (audioBlob ? "Audio Recorded" : "Click to Start Speaking")}
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              Speak naturally as you would in a real interview. Delivery metrics (speaking rate, filler words, pauses) will be analyzed alongside your answer content.
            </p>

            {audioUrl && !isRecording && (
              <div className="mt-4 flex items-center space-x-3 bg-slate-800/60 px-4 py-2 rounded-xl border border-slate-700">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                <audio controls src={audioUrl} className="h-8" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Text Mode Interface */}
      {responseMode === 'text' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg mb-6">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Type Your Answer
          </label>
          <textarea
            rows={8}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Structure your answer clearly. For behavioral questions, consider using the STAR framework (Situation, Task, Action, Result)..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-indigo-500 leading-relaxed"
          />
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>Word count: {textInput.trim() ? textInput.trim().split(/\s+/).length : 0}</span>
            <span>Target: 70 - 250 words</span>
          </div>
        </div>
      )}

      {/* Evaluation Progress State */}
      {evaluating && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 mb-6 shadow-xl text-center">
          <div className="flex items-center justify-center space-x-2 text-indigo-400 font-bold text-sm mb-4">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>LangGraph Multi-Agent Orchestration in Progress...</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className={`p-3 rounded-xl border ${evalStep >= 1 ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
              <div className="font-semibold mb-1">1. Communication</div>
              <p className="text-[11px] text-slate-400">Clarity & Filler Words</p>
            </div>
            <div className={`p-3 rounded-xl border ${evalStep >= 2 ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
              <div className="font-semibold mb-1">2. Content</div>
              <p className="text-[11px] text-slate-400">Relevance & Depth</p>
            </div>
            <div className={`p-3 rounded-xl border ${evalStep >= 3 ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
              <div className="font-semibold mb-1">3. STAR Structure</div>
              <p className="text-[11px] text-slate-400">S-T-A-R Breakdown</p>
            </div>
            <div className={`p-3 rounded-xl border ${evalStep >= 4 ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
              <div className="font-semibold mb-1">4. Coach Agent</div>
              <p className="text-[11px] text-slate-400">Synthesis & Follow-up</p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Action */}
      <div className="flex justify-end">
        <button
          disabled={evaluating || (responseMode === 'voice' && isRecording)}
          onClick={handleSubmit}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>Submit for Multi-Agent Evaluation</span>
        </button>
      </div>
    </div>
  );
}
