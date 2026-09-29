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
  Volume2,
  Info,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  RotateCcw,
  Zap,
  Radio
} from 'lucide-react';

export default function PracticeScreen({
  sessionData,
  onEndInterview,
  onNextQuestion,
  candidate,
}) {
  const [activeTab, setActiveTab] = useState('conversation'); // 'conversation' | 'analysis'
  const [isRecording, setIsRecording] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(24);
  const [totalTimerSeconds, setTotalTimerSeconds] = useState(272); // 04:32
  const [showTips, setShowTips] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTypeMode, setIsTypeMode] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [difficulty, setDifficulty] = useState(sessionData?.difficulty || 'Medium');
  const [currentQNum, setCurrentQNum] = useState(sessionData?.question_number || 3);
  const [totalQNum] = useState(sessionData?.total_questions || 10);

  const inputRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text:
        sessionData?.question?.question ||
        'Explain the difference between SQL and NoSQL databases. When would you choose one over the other?',
      time: '10:14 AM',
    },
    {
      id: 2,
      sender: 'user',
      text:
        'SQL databases are relational and use a fixed schema, while NoSQL databases are non-relational and more flexible. I would choose SQL when data consistency and complex queries are important, and NoSQL when dealing with large scale, unstructured data or when we need high scalability.',
      time: '10:16 AM',
      audioDuration: '01:12',
    },
    {
      id: 3,
      sender: 'ai',
      text:
        'Good answer! Can you give a real-world example where you used or would prefer NoSQL over SQL?',
      time: '10:16 AM',
    },
  ]);

  // Overall session stopwatch
  useEffect(() => {
    let timer;
    if (!isPaused) {
      timer = setInterval(() => {
        setTotalTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPaused]);

  // Recording counter
  useEffect(() => {
    let recTimer;
    if (isRecording && !isPaused) {
      recTimer = setInterval(() => {
        setRecordingSeconds((s) => (s < 120 ? s + 1 : s));
      }, 1000);
    }
    return () => clearInterval(recTimer);
  }, [isRecording, isPaused]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `00:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatRecTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} / 02:00`;
  };

  // Handle Play/Pause of audio messages via browser speech synthesis
  const handleTogglePlayAudio = (msgId, text) => {
    if (playingAudioId === msgId) {
      window.speechSynthesis?.cancel();
      setPlayingAudioId(null);
    } else {
      window.speechSynthesis?.cancel();
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 1.0;
        utter.onend = () => setPlayingAudioId(null);
        utter.onerror = () => setPlayingAudioId(null);
        window.speechSynthesis.speak(utter);
        setPlayingAudioId(msgId);
      } else {
        setPlayingAudioId(msgId);
        setTimeout(() => setPlayingAudioId(null), 3000);
      }
    }
  };

  // Submit text or voice reply
  const handleSendMessage = (customText = null) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      audioDuration: !customText ? null : '00:38',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    setIsAiThinking(true);

    // Simulate AI follow up
    setTimeout(() => {
      setIsAiThinking(false);
      const aiResponses = [
        'Excellent practical example. How did you handle horizontal scaling and eventual consistency in that scenario?',
        'Good points. What trade-offs did you consider regarding ACID compliance versus high throughput?',
        'Very clear explanation! Let us dive a bit deeper into indexing strategies in MongoDB vs PostgreSQL B-Trees.',
      ];
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: randomResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      if (currentQNum < totalQNum) {
        setCurrentQNum((q) => q + 1);
      }
    }, 1400);
  };

  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleStopRecording = () => {
    if (!isRecording) {
      // If already stopped, restart recording
      setIsRecording(true);
      setIsPaused(false);
      setRecordingSeconds(0);
      return;
    }
    setIsRecording(false);
    // Submit candidate voice snippet to chat
    handleSendMessage(
      'In our e-commerce platform, we used MongoDB for catalog management because products had heterogeneous attributes. For orders and payment transactions, we used PostgreSQL to maintain strict ACID consistency.'
    );
  };

  const handleOpenTypeAnswer = () => {
    setIsTypeMode(true);
    setActiveTab('conversation');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const cycleDifficulty = () => {
    const diffs = ['Easy', 'Medium', 'Hard'];
    const nextIdx = (diffs.indexOf(difficulty) + 1) % diffs.length;
    setDifficulty(diffs[nextIdx]);
  };

  const roleTitle = sessionData?.role || 'Software Engineer – Technical Interview';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 p-4 sm:px-6 rounded-2xl shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {roleTitle}
          </h1>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              Technical
            </span>
            <button
              onClick={cycleDifficulty}
              title="Click to cycle difficulty"
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:ring-2 hover:ring-amber-500/30 transition-all cursor-pointer"
            >
              {difficulty}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-auto">
          {/* Question Counter */}
          <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
            <span className="text-blue-600 dark:text-blue-400 font-bold">{currentQNum}</span>
            <span className="text-slate-400 mx-1">/</span>
            <span>{totalQNum}</span>
          </div>

          {/* Clock Timer */}
          <div className="flex items-center space-x-1.5 text-xs sm:text-sm font-mono font-medium text-slate-700 dark:text-slate-200">
            <Clock className={`w-4 h-4 ${isPaused ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className={isPaused ? 'text-amber-500' : ''}>{formatTimer(totalTimerSeconds)}</span>
          </div>

          {/* End Interview Red Button */}
          <button
            onClick={onEndInterview}
            className="px-4 py-1.5 sm:py-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Main Grid: Left Interview Question & Waveform, Right Chat/Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column (7 cols): Question + Concentric Visualizer + Controls */}
        <div className="lg:col-span-7 bg-[#080D1A] dark:bg-[#080D1A] border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between text-white relative shadow-xl overflow-hidden min-h-[580px]">
          {/* Top question & tips button */}
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
              Explain the difference between SQL and NoSQL databases. When would you choose one over the other?
            </h2>

            {/* Follow-up info badge */}
            <div className="mt-4 inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-950/60 border border-blue-800/40 text-blue-300 text-xs font-medium">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Follow-up may be asked based on your answer.</span>
            </div>

            {/* Tips Popover */}
            {showTips && (
              <div className="mt-3 p-3.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-xs text-slate-300 space-y-1.5 backdrop-blur-md animate-fadeIn">
                <p className="font-semibold text-white">Suggested Response Framework:</p>
                <p>1. <span className="text-blue-300 font-semibold">Schema:</span> Fixed relational schemas (PostgreSQL) vs dynamic schemaless JSON/documents (MongoDB).</p>
                <p>2. <span className="text-blue-300 font-semibold">ACID vs BASE:</span> Strict consistency & complex joins vs eventual consistency & horizontal partition tolerance.</p>
                <p>3. <span className="text-blue-300 font-semibold">Example:</span> Relational for banking/inventory transactions; NoSQL for IoT timeseries/social feeds.</p>
              </div>
            )}
          </div>

          {/* Center: Concentric Glowing Audio Wave Visualizer */}
          <div className="my-8 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64">
              {/* Outer pulsing ring 3 */}
              <div
                className={`absolute inset-0 rounded-full border border-blue-500/20 transition-all duration-1000 ${
                  isRecording && !isPaused ? 'animate-ping opacity-20' : 'opacity-10'
                }`}
              />
              {/* Outer ring 2 */}
              <div className="absolute inset-4 rounded-full border border-blue-500/25 bg-blue-500/[0.02]" />
              {/* Mid ring 1 with glow */}
              <div className="absolute inset-10 rounded-full border border-blue-400/40 shadow-[0_0_30px_rgba(59,130,246,0.2)] bg-gradient-to-tr from-blue-900/30 to-indigo-950/40" />
              {/* Inner core circle */}
              <div className="w-28 h-28 rounded-full bg-[#0D1527] border border-blue-400/60 flex items-center justify-center shadow-inner relative z-10">
                {/* Audio Wave Bars */}
                <div className="flex items-center space-x-1.5 h-12">
                  <div
                    className={`w-1.5 rounded-full bg-rose-500 ${
                      isRecording && !isPaused ? 'animate-audio-bar' : 'h-3'
                    }`}
                    style={{ animationDelay: '0.1s' }}
                  />
                  <div
                    className={`w-1.5 rounded-full bg-rose-400 ${
                      isRecording && !isPaused ? 'animate-audio-bar' : 'h-6'
                    }`}
                    style={{ animationDelay: '0.3s' }}
                  />
                  <div
                    className={`w-1.5 rounded-full bg-rose-500 ${
                      isRecording && !isPaused ? 'animate-audio-bar' : 'h-8'
                    }`}
                    style={{ animationDelay: '0.5s' }}
                  />
                  <div
                    className={`w-1.5 rounded-full bg-rose-400 ${
                      isRecording && !isPaused ? 'animate-audio-bar' : 'h-5'
                    }`}
                    style={{ animationDelay: '0.2s' }}
                  />
                  <div
                    className={`w-1.5 rounded-full bg-rose-500 ${
                      isRecording && !isPaused ? 'animate-audio-bar' : 'h-2'
                    }`}
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
                  : 'Recording Stopped. Ready to submit.'}
              </span>
            </div>
          </div>

          {/* Bottom Controls */}
          <div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleTogglePause}
                className="px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] active:scale-95 border border-white/[0.1] text-xs sm:text-sm font-medium text-white flex items-center space-x-2 transition-all cursor-pointer"
              >
                {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>

              <button
                onClick={handleStopRecording}
                className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white flex items-center space-x-2 shadow-lg transition-all cursor-pointer active:scale-95 ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Record Answer</span>
                  </>
                )}
              </button>

              <button
                onClick={handleOpenTypeAnswer}
                className="px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] active:scale-95 border border-white/[0.1] text-xs sm:text-sm font-medium text-white flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Type className="w-4 h-4" />
                <span>Type Answer</span>
              </button>
            </div>

            {/* Hints below buttons */}
            <div className="mt-5 text-center text-[11px] text-slate-400 space-x-2">
              <span>• Speak clearly</span>
              <span>• Take your time</span>
              <span>• You can pause and resume.</span>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Split-Screen Chat & Real-time Analysis */}
        <div className="lg:col-span-5 bg-[#0F172A] border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-xl min-h-[580px]">
          {/* Top Panel Tabs */}
          <div>
            <div className="flex items-center border-b border-slate-800 pb-3">
              <button
                onClick={() => setActiveTab('conversation')}
                className={`pb-1 text-xs sm:text-sm font-semibold transition-all relative mr-6 cursor-pointer ${
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

            {/* Tab 1: Conversation Message Thread */}
            {activeTab === 'conversation' && (
              <div className="mt-4 space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex items-start space-x-3"
                  >
                    {/* Avatar */}
                    {msg.sender === 'ai' ? (
                      <div className="w-8 h-8 rounded-full bg-purple-600/90 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                        AI
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-teal-600/90 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                        SR
                      </div>
                    )}

                    {/* Bubble */}
                    <div className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-2xl p-3.5 text-xs text-slate-200 leading-relaxed space-y-2">
                      <p>{msg.text}</p>

                      {/* Interactive Audio duration button for user */}
                      {msg.audioDuration && (
                        <button
                          onClick={() => handleTogglePlayAudio(msg.id, msg.text)}
                          title="Click to play answer audio"
                          className={`inline-flex items-center space-x-2 px-2.5 py-1 rounded-full text-[11px] font-mono transition-all cursor-pointer ${
                            playingAudioId === msg.id
                              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
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

                {/* AI Thinking Indicator */}
                {isAiThinking && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600/90 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                      AI
                    </div>
                    <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl px-4 py-3 text-xs text-slate-400 flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
                      <span className="ml-1 text-[11px] text-slate-300">Evaluating response &amp; formulating follow-up...</span>
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
                    <span className="font-bold text-emerald-400">142 WPM (Optimal Cadence)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full w-[72%] transition-all duration-500" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Recommended range is 130–160 WPM for senior engineering delivery.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">STAR Structure Alignment</span>
                    <span className="font-bold text-blue-400">82% (Strong)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-1.5 rounded-full w-[82%] transition-all duration-500" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Situation: 85%</span>
                    <span>Task: 80%</span>
                    <span>Action: 88%</span>
                    <span>Result: 75%</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Filler Words Detected</span>
                    <span className="font-bold text-amber-400">2 (Low)</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.08] text-slate-300">"like" × 1</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.08] text-slate-300">"basically" × 1</span>
                  </div>
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
                placeholder="Type your message..."
                className="w-full pl-4 pr-12 py-2.5 text-xs sm:text-sm rounded-xl bg-white/[0.06] border border-white/[0.1] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim()}
                title="Send answer"
                className={`absolute right-2 p-1.5 rounded-lg transition-colors cursor-pointer ${
                  inputMessage.trim()
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
