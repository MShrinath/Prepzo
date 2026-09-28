import React, { useState, useRef, useEffect } from 'react';
import {
  Mic, MicOff, Send, Volume2, Type, Sparkles, AlertCircle,
  ChevronLeft, RefreshCw, CheckCircle2, Square, RotateCcw, Loader2
} from 'lucide-react';
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
      setError("Microphone access was denied. Please allow microphone permissions in your browser or switch to Type Answer mode.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleResetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);

    // Validate inputs before submitting
    if (responseMode === 'voice' && (!audioBlob || recordingTime < 1)) {
      setError("Please record your spoken answer before submitting. Tap the microphone, speak clearly, then tap stop.");
      return;
    }

    if (responseMode === 'text' && (!textInput.trim() || textInput.trim().length < 2)) {
      setError("Please enter your answer in the text field before submitting.");
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Bar / Navigation */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.08]">
        <button
          onClick={onBack}
          className="text-xs font-medium text-[#98989D] hover:text-white flex items-center space-x-1 transition px-2.5 py-1.5 rounded-full hover:bg-white/[0.06]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Exit</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-xs px-3 py-1 rounded-full bg-white/[0.06] text-white border border-white/[0.08] font-medium">
            {sessionData.target_role || "SDE"}
          </span>
          <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${
            difficulty === 'hard' ? 'bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/25' :
            difficulty === 'medium' ? 'bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/25' :
            'bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/25'
          }`}>
            {difficulty}
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-white/[0.06] text-[#0A84FF] border border-white/[0.08] hidden sm:inline-block font-medium">
            {competency}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-[#FF453A]/10 border border-[#FF453A]/25 text-[#FF453A] text-xs sm:text-sm flex items-start space-x-2.5 backdrop-blur-xl">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Prompter Card */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-apple-card mb-6 backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#0A84FF] uppercase tracking-wide">
            Question Prompt
          </span>
          <span className="text-xs text-[#98989D]">
            {competency}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-relaxed">
          "{questionText}"
        </h2>

        {questionObj.reason && (
          <div className="mt-4 pt-4 border-t border-white/[0.06] text-xs text-[#98989D] flex items-center space-x-1.5">
            <span className="text-white font-medium">Target:</span>
            <span>{questionObj.reason}</span>
          </div>
        )}
      </div>

      {/* Segmented Control for Mode */}
      <div className="flex justify-center mb-6">
        <div className="p-1 rounded-full bg-white/[0.06] border border-white/[0.06] flex space-x-1">
          <button
            onClick={() => setResponseMode('voice')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-all duration-200 ${
              responseMode === 'voice'
                ? 'bg-white/[0.14] text-white shadow-apple-pill font-semibold'
                : 'text-[#98989D] hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Response</span>
          </button>
          <button
            onClick={() => setResponseMode('text')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-all duration-200 ${
              responseMode === 'text'
                ? 'bg-white/[0.14] text-white shadow-apple-pill font-semibold'
                : 'text-[#98989D] hover:text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Type Answer</span>
          </button>
        </div>
      </div>

      {/* Voice Mode Cockpit */}
      {responseMode === 'voice' && (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8 text-center shadow-apple-card mb-6 backdrop-blur-2xl">
          <div className="flex flex-col items-center justify-center">
            {isRecording ? (
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-[#FF453A]/20 animate-recording-pulse absolute inset-0" />
                <button
                  onClick={stopRecording}
                  className="w-24 h-24 rounded-full bg-[#FF453A] hover:bg-[#D9382F] active:scale-95 text-white flex flex-col items-center justify-center shadow-lg transition relative z-10"
                >
                  <Square className="w-7 h-7 fill-current mb-0.5" />
                  <span className="text-[10px] font-semibold tracking-wide uppercase">Stop</span>
                </button>
              </div>
            ) : audioBlob ? (
              <div className="mb-6 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#30D158]/15 border border-[#30D158]/30 text-[#30D158] flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <button
                  onClick={handleResetRecording}
                  className="inline-flex items-center space-x-1.5 text-xs text-[#98989D] hover:text-white transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-record</span>
                </button>
              </div>
            ) : (
              <div className="mb-6">
                <button
                  onClick={startRecording}
                  className="w-20 h-20 rounded-full bg-white/[0.08] hover:bg-white/[0.12] active:scale-95 border border-white/[0.14] text-white flex flex-col items-center justify-center shadow-apple-pill transition group"
                >
                  <Mic className="w-8 h-8 text-[#0A84FF] group-hover:scale-105 transition-transform" />
                </button>
              </div>
            )}

            {/* Audio Wave Bars when recording */}
            {isRecording && (
              <div className="mb-4 flex items-center justify-center space-x-1.5 h-8">
                {[12, 24, 16, 28, 20, 14, 26, 18, 30, 16, 22].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}px`, animationDelay: `${i * 90}ms` }}
                    className="w-1 bg-[#FF453A] rounded-full animate-audio-bar"
                  />
                ))}
              </div>
            )}

            {/* Status / Timecode */}
            <div className="text-sm font-medium text-white mb-1 flex items-center space-x-2">
              {isRecording ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#FF453A] animate-pulse"></span>
                  <span className="text-[#FF453A] font-mono">{formatTime(recordingTime)}</span>
                </>
              ) : audioBlob ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#30D158]"></span>
                  <span>Audio Recorded ({formatTime(recordingTime)})</span>
                </>
              ) : (
                <span>Tap to Record Answer</span>
              )}
            </div>

            <p className="text-xs text-[#98989D] max-w-sm leading-relaxed">
              Speak naturally as you would in an interview. Whisper STT evaluates delivery cadence, clarity, and filler pause frequency.
            </p>

            {/* Audio player */}
            {audioUrl && !isRecording && (
              <div className="mt-5 flex items-center space-x-3 bg-white/[0.04] px-4 py-3 rounded-2xl border border-white/[0.08] w-full max-w-md">
                <Volume2 className="w-4 h-4 text-[#0A84FF] shrink-0" />
                <audio controls src={audioUrl} className="w-full h-8" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Text Mode Interface */}
      {responseMode === 'text' && (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 shadow-apple-card mb-6 backdrop-blur-2xl">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-[#98989D]">
              Written Answer
            </label>
            <span className="text-xs text-[#636366]">
              Target: 70 - 250 words
            </span>
          </div>

          <textarea
            rows={8}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Structure your answer clearly with the Situation, Task, Action, and Measurable Result (STAR)..."
            className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-[#0A84FF] leading-relaxed transition"
          />

          <div className="mt-2.5 flex justify-between items-center text-xs text-[#98989D]">
            <span>
              Words: <strong className="text-white font-medium">{textInput.trim() ? textInput.trim().split(/\s+/).length : 0}</strong>
            </span>
            <span>STAR structure evaluated</span>
          </div>
        </div>
      )}

      {/* Evaluating Pipeline */}
      {evaluating && (
        <div className="bg-white/[0.04] border border-[#0A84FF]/30 rounded-3xl p-6 mb-6 shadow-apple-card text-center backdrop-blur-2xl">
          <div className="flex items-center justify-center space-x-2 text-[#0A84FF] font-medium text-sm mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Evaluating Response with Specialized Agents...</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className={`p-3 rounded-2xl border transition-all ${
              evalStep >= 1 ? 'bg-[#0A84FF]/15 border-[#0A84FF]/40 text-white' : 'bg-white/[0.02] border-white/[0.06] text-[#636366]'
            }`}>
              <div className="font-semibold mb-0.5">1. Delivery</div>
              <p className="text-[11px] text-[#98989D]">Clarity & Cadence</p>
            </div>
            <div className={`p-3 rounded-2xl border transition-all ${
              evalStep >= 2 ? 'bg-[#0A84FF]/15 border-[#0A84FF]/40 text-white' : 'bg-white/[0.02] border-white/[0.06] text-[#636366]'
            }`}>
              <div className="font-semibold mb-0.5">2. Content</div>
              <p className="text-[11px] text-[#98989D]">Technical Depth</p>
            </div>
            <div className={`p-3 rounded-2xl border transition-all ${
              evalStep >= 3 ? 'bg-[#0A84FF]/15 border-[#0A84FF]/40 text-white' : 'bg-white/[0.02] border-white/[0.06] text-[#636366]'
            }`}>
              <div className="font-semibold mb-0.5">3. STAR Method</div>
              <p className="text-[11px] text-[#98989D]">Action & Results</p>
            </div>
            <div className={`p-3 rounded-2xl border transition-all ${
              evalStep >= 4 ? 'bg-[#0A84FF]/15 border-[#0A84FF]/40 text-white' : 'bg-white/[0.02] border-white/[0.06] text-[#636366]'
            }`}>
              <div className="font-semibold mb-0.5">4. Synthesis</div>
              <p className="text-[11px] text-[#98989D]">Actionable Plan</p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end">
        <button
          disabled={evaluating || (responseMode === 'voice' && isRecording)}
          onClick={handleSubmit}
          className="w-full sm:w-auto bg-[#0A84FF] hover:bg-[#0071E3] active:scale-[0.98] text-white font-medium px-8 py-3 rounded-full shadow-apple-pill flex items-center justify-center space-x-2 transition disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
          <span>Evaluate Response</span>
        </button>
      </div>
    </div>
  );
}
