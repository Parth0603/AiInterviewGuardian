import React, { useState, useEffect, useRef } from 'react';
import WebcamAnalyzer from './WebcamAnalyzer';
import AnalyticsChart from './AnalyticsChart';
import FinalReportModal from './FinalReportModal';
import { 
  Play, 
  Square, 
  Activity, 
  Radio, 
  AlertTriangle, 
  Clock, 
  Sliders, 
  Sparkles,
  Eye,
  Brain,
  Award,
  Camera,
  CameraOff,
  Moon,
  Sun,
  Contrast,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { playClick, playNextQuestionChirp, playSystemReadyChime } from '../utils/audio';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : '';

const QUESTIONS_LIBRARY = {
  "Frontend Engineering": {
    "STAR Behavioral": [
      "Tell me about a time when you had to optimize a slow web application page under a tight deadline. What did you measure and what actions did you take?",
      "Describe a situation where you had a major architectural disagreement with a senior engineer. How did you handle the debate, and what was the outcome?",
      "Talk about a frontend feature you delivered that failed or had a serious bug in production. How did you react, communicate, and fix it?"
    ],
    "Technical Coding": [
      "Explain how you would design and implement a custom React state management library similar to Redux or Zustand from scratch.",
      "How does the browser event loop interact with microtasks (Promises) and macrotasks (setTimeout)? Give a clear example of task execution order.",
      "How would you build a highly performant virtualized scroll list that handles 100,000 items smoothly at 60 FPS in pure Javascript?"
    ],
    "System Architecture": [
      "Design a scalable, global micro-frontend architecture for a large enterprise platform. How do you handle shared state and assets?",
      "Describe how you would design a robust, secure Client-Side telemetry tracking and logging SDK that handles offline queuing and batching.",
      "How would you optimize a modern Single Page App (SPA) for Core Web Vitals, specifically targeting LCP, FID, and CLS?"
    ],
    "Pressure Test": [
      "Your site experiences a massive traffic spike and LCP spikes to 8 seconds. You have 3 minutes to diagnose the frontend bottle neck. What is your plan?",
      "An interviewer tells you your proposed virtualization system is completely flawed because of dynamic row heights. Defend your design under pressure.",
      "Why is CSS-in-JS considered a performance anti-pattern by some senior architects? Critique its runtime impact under heavy load."
    ]
  },
  "Backend Engineering": {
    "STAR Behavioral": [
      "Describe a time when a database lock caused a massive production outage on your watch. How did you coordinate the resolution and prevent it from recurring?",
      "Tell me about a complex feature request where the product team wanted something that was technically unviable. How did you negotiate the trade-offs?",
      "Recall a time you had to take ownership of a legacy backend service with zero documentation. How did you gain confidence and refactor it?"
    ],
    "Technical Coding": [
      "Explain the inner workings of a distributed lock using Redis (Redlock). What are the main race conditions and failure states to look out for?",
      "How would you write an optimal token-bucket rate limiter middleware that can handle 50,000 requests per second across a cluster?",
      "Explain the difference between optimistic and pessimistic locking in relational databases, and write pseudo-SQL showing when to use each."
    ],
    "System Architecture": [
      "Design a highly available distributed notification system that must deliver 10 million push alerts per minute with absolute strict order delivery.",
      "How would you transition a synchronous monolith billing pipeline into an event-driven, transactionally safe Kafka-based microservice architecture?",
      "Design a multi-region database replication strategy that maintains high consistency (CAP theorem) with sub-second write latencies."
    ],
    "Pressure Test": [
      "Your Kafka cluster has a massive consumer lag and orders are failing to process. The business is losing $10,000 per minute. Walk me through your actions.",
      "Your senior architect insists on using MongoDB for a complex, highly relational transactional system. How do you convince them otherwise?",
      "Why is REST generally considered inferior to gRPC or WebSockets for internal service-to-service microservices? Argue your case aggressively."
    ]
  },
  "System Design": {
    "STAR Behavioral": [
      "Tell me about a time you had to design a system that had to scale 10x within a week due to a viral marketing campaign. What did you prioritize?",
      "Describe a scenario where you made a major design mistake that resulted in high cloud infrastructure bills. How did you discover and remediate it?",
      "Talk about a design review where your peers heavily criticized your system model. How did you handle the critique and refine the design?"
    ],
    "Technical Coding": [
      "Explain the architectural difference between a B-Tree and an LSM-Tree index. Which index is better suited for write-heavy workloads and why?",
      "Explain how a consistent hashing ring operates in a distributed caching ring (like Memcached), and how it minimizes cache misses during re-sharding.",
      "Detail the protocol sequence of a two-phase commit (2PC) database transaction, and explain why it is vulnerable to coordinator crashes."
    ],
    "System Architecture": [
      "Design a global, real-time collaborative document editor like Google Docs. How do you handle conflict resolution and document synchronization?",
      "Design a scalable, highly available video streaming backend like Netflix that handles content ingestion, transcoding, and global CDN delivery.",
      "Design a high-frequency financial trading system that processes 1 million transactions per second with sub-millisecond latencies."
    ],
    "Pressure Test": [
      "Your caching layer is experiencing cache stampede/avalanche and hitting your database directly, causing it to freeze. How do you resolve this live?",
      "An interviewer claims your consistent hashing ring design is inefficient because it doesn't handle hot-spots. How do you counter and adapt?",
      "Argue for and against microservices versus monorepos. Under what strict business scenarios is a monolith actually superior?"
    ]
  },
  "Product Management": {
    "STAR Behavioral": [
      "Describe a time when you had to sunset a popular product feature that customers loved but was no longer commercially viable. How did you manage it?",
      "Tell me about a product launch that failed to meet its key performance indicators (KPIs). What did you learn and how did you pivot?",
      "Talk about a time you had to lead a cross-functional engineering team with divergent opinions. How did you establish alignment?"
    ],
    "Technical Coding": [
      "Explain to a non-technical stakeholder how modern AI LLMs utilize context windows and why token usage increases operational cost.",
      "How do you evaluate and prioritize technical debt versus customer-facing product features in a fast-paced agile roadmap?",
      "Explain what latency is, how it affects user retention, and how you define Service Level Agreements (SLAs) for API endpoints."
    ],
    "System Architecture": [
      "How would you design a product telemetry instrumentation framework to measure user conversion funnels without violating user privacy regulations?",
      "Design the product roadmap and core metrics checklist for launching a product telemetry instrumentation framework to measure user conversion funnels without violating user privacy regulations?",
      "How would you structure a system dashboard monitoring product health, and what are the top 3 North Star metrics you would track?"
    ],
    "Pressure Test": [
      "The engineering lead tells you they cannot deliver the MVP on time unless you cut the security logging module. What is your product decision?",
      "An investor tells you your product priority matrix is completely wrong because it ignores competitor feature parity. Defend your roadmap.",
      "Why is a strict data-driven approach sometimes a trap for product discovery? Argue the case for intuition and direct customer research."
    ]
  }
};

export default function Dashboard() {
  const [isSessionRunning, setIsSessionRunning] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeWarning, setActiveWarning] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [quotaReached, setQuotaReached] = useState(false);
  const [currentApiSource, setCurrentApiSource] = useState('Google Gemini 2.5 Flash');

  // UI Theme Modes state
  const [uiTheme, setUiTheme] = useState('DARK'); // 'DARK' | 'MEDIUM' | 'LIGHT'

  // Structured Q&A Interview Mode State Machine
  const [interviewStage, setInterviewStage] = useState('SETUP'); // 'SETUP' | 'ACTIVE_Q1' | 'ACTIVE_Q2' | 'ACTIVE_Q3' | 'GRADING' | 'REPORT'
  const [subject, setSubject] = useState('Frontend Engineering');
  const [theme, setTheme] = useState('STAR Behavioral');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcripts, setTranscripts] = useState({ 0: '', 1: '', 2: '' });
  const [isListening, setIsListening] = useState(false);
  const [gradeReport, setGradeReport] = useState(null);

  const recognitionRef = useRef(null);
  const currentQuestionIndexRef = useRef(0);

  // Sync index ref for async capture sweeps
  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  // Quota Telemetry Tracking (Limits: 15 RPM / 1500 RPD)
  const [rpm, setRpm] = useState(0);
  const [rpd, setRpd] = useState(() => {
    const saved = localStorage.getItem('gemini_rpd');
    const savedDate = localStorage.getItem('gemini_rpd_date');
    const today = new Date().toDateString();
    
    if (saved && savedDate === today) {
      return parseInt(saved, 10);
    }
    localStorage.setItem('gemini_rpd_date', today);
    localStorage.setItem('gemini_rpd', '0');
    return 0;
  });
  
  const [requestTimes, setRequestTimes] = useState([]);

  // Decay loop to calculate RPM
  useEffect(() => {
    const interval = setInterval(() => {
      const oneMinuteAgo = Date.now() - 60000;
      setRequestTimes(prev => {
        const filtered = prev.filter(t => t > oneMinuteAgo);
        setRpm(filtered.length);
        return filtered;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Monitor RPM limits and issue logs
  useEffect(() => {
    if (rpm >= 13) {
      addTerminalLog('CRITICAL RATE WARNING: Approaching Gemini Free-Tier Limit (15 RPM)! Consider pausing.', 'warning');
    }
  }, [rpm]);
  
  const [history, setHistory] = useState([]);
  
  const [telemetry, setTelemetry] = useState({
    confidence: "Waiting to initialize system calibration...",
    confidence_score: 0,
    attention: "System calibration required.",
    attention_score: 0,
    eye_contact: "System calibration required.",
    eye_contact_score: 0,
    emotion: "Standby",
    warnings: [],
    summary: "Establish a camera connection, and activate live telemetry tracking to boot behavioral nodes."
  });

  const [terminalLogs, setTerminalLogs] = useState([
    { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), text: 'SYSTEM INI // GUARDENG-V2.5 REBOOT', type: 'info' },
    { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), text: 'NEURAL NET CALIBRATED // READY FOR OPTICAL STREAM', type: 'info' }
  ]);

  const [showReport, setShowReport] = useState(false);
  const timerRef = useRef(null);
  const terminalContainerRef = useRef(null);

  // Session timer hook
  useEffect(() => {
    if (isSessionRunning) {
      timerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isSessionRunning]);

  // Auto-scroll terminal log internally
  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  // Speech Recognition control module
  const startSpeechRecognition = (qIndex) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      addTerminalLog('Speech recognition not supported in this browser. Please use Chrome.', 'error');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }

      const SpeechLib = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechLib();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      let baseText = transcripts[qIndex] || '';

      rec.onstart = () => {
        setIsListening(true);
        const activeIndex = currentQuestionIndexRef.current;
        addTerminalLog(`MIC LINK ACTIVE // TRANSCRIBING RESPONSE FOR Q0${activeIndex + 1}...`, 'info');
      };

      rec.onresult = (event) => {
        let interimText = '';
        let finalizedText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalizedText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        if (finalizedText) {
          baseText = (baseText + ' ' + finalizedText).trim();
        }

        const activeIndex = currentQuestionIndexRef.current;
        setTranscripts(prev => ({
          ...prev,
          [activeIndex]: interimText ? `${baseText} (transcribing... ${interimText})` : baseText
        }));
      };

      rec.onerror = (event) => {
        if (event.error === 'no-speech') return;
        console.error('Speech recognition exception:', event.error);
        addTerminalLog(`SPEECH DETECTOR WARNING: ${event.error}`, 'warning');
      };

      rec.onend = () => {
        setIsListening(false);
        const activeIndex = currentQuestionIndexRef.current;
        
        setTranscripts(prev => {
          const currentText = prev[activeIndex] || '';
          const cleanedText = currentText.split(' (transcribing...')[0].trim();
          return {
            ...prev,
            [activeIndex]: cleanedText
          };
        });

        if (isSessionRunning && currentQuestionIndexRef.current === activeIndex) {
          console.log('🎙️ Speech recognition ended. Restarting capture loop...');
          setTimeout(() => {
            if (isSessionRunning && currentQuestionIndexRef.current === activeIndex) {
              startSpeechRecognition(activeIndex);
            }
          }, 400);
        }
      };

      recognitionRef.current = rec;
      rec.start();
      console.log('🎙️ Speech recognition started fresh for Q' + (qIndex + 1));
    } catch (err) {
      console.error('Failed to boot speech recognition engine:', err);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleNextQuestion = () => {
    stopSpeechRecognition();

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < 3) {
      playNextQuestionChirp();
      setCurrentQuestionIndex(nextIndex);
      setInterviewStage(`ACTIVE_Q${nextIndex + 1}`);
      addTerminalLog(`ADVANCING INTERVIEW // LOADING QUESTION 0${nextIndex + 1}...`, 'info');
      
      setTimeout(() => {
        startSpeechRecognition(nextIndex);
      }, 400);
    } else {
      setInterviewStage('GRADING');
      setIsSessionRunning(false);
      setIsCameraOn(false);
      stopSpeechRecognition();
      addTerminalLog('MOCK SESSION COMPLETED // COMPILING COGNITIVE DOSSIER...', 'info');
      
      setTimeout(async () => {
        try {
          const finalTranscripts = {};
          Object.keys(transcripts).forEach(key => {
            finalTranscripts[key] = transcripts[key].split(' (transcribing...')[0].trim();
          });

          const response = await fetch(`${API_BASE}/api/grade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject,
              theme,
              questions,
              transcripts: finalTranscripts,
              telemetryHistory: history
            })
          });

          if (!response.ok) {
            throw new Error(`Grading server error: ${response.statusText}`);
          }

          const gradeResult = await response.json();
          console.log('✅ Grading Report generated successfully:', gradeResult);
          
          setGradeReport(gradeResult);
          setInterviewStage('REPORT');
          playSystemReadyChime();
          addTerminalLog(`COGNITIVE REPORT COMPILED // TIER VERDICT: ${gradeResult.overall_tier}`, 'info');
          setShowReport(true);
        } catch (err) {
          console.error('Grading request failed:', err);
          addTerminalLog(`CRITICAL: GRADING PIPELINE TIMEOUT // ${err.message}`, 'error');
          setInterviewStage('SETUP');
        }
      }, 1000);
    }
  };

  const handleStartSession = () => {
    playClick();
    setHistory([]);
    setSessionTime(0);
    setIsSessionRunning(true);
    addTerminalLog('NEURAL BEHAVIORAL LOGGER ACTIVATED', 'info');
  };

  const handleStopSession = () => {
    playClick();
    setIsSessionRunning(false);
    stopSpeechRecognition();
    addTerminalLog('TELEMETRY PIPELINE DEACTIVATED // RECORDERS MUTED', 'warning');
  };

  const handleFrameCaptured = async (base64Image) => {
    if (!isSessionRunning) return;

    setRequestTimes(prev => [...prev, Date.now()]);
    setRpd(prev => {
      const next = prev + 1;
      localStorage.setItem('gemini_rpd', next.toString());
      return next;
    });

    setIsAnalyzing(true);
    addTerminalLog('SENDING COMPRESSED OPTICAL FRAME TO GEMINI ENGINE...', 'info');

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });

      if (response.status === 429) {
        const errData = await response.json();
        if (errData.error === 'QUOTA_EXHAUSTED') {
          setIsSessionRunning(false);
          setIsCameraOn(false);
          setQuotaReached(true);
          addTerminalLog('CRITICAL EXCEPTION: API RATE LIMIT FULLY EXHAUSTED (15/15). FEED PAUSED.', 'error');
          return;
        }
      }

      if (!response.ok) {
        throw new Error(`Vision server error: ${response.statusText}`);
      }

      const result = await response.json();
      setTelemetry(result);
      if (result.api_source) {
        setCurrentApiSource(result.api_source);
      }
      setIsAnalyzing(false);

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setHistory(prev => [
        ...prev,
        {
          time: timestamp,
          confidence: result.confidence_score,
          attention: result.attention_score,
          eyeContact: result.eye_contact_score,
          questionIndex: currentQuestionIndexRef.current
        }
      ]);

      addTerminalLog(`FRAME ANALYZED // CONFIDENCE: ${result.confidence_score}% // FOCUS: ${result.attention_score}% // EMOTION: ${result.emotion.toUpperCase()}`, 'info');
      
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(w => {
          addTerminalLog(`TELEMETRY DEVIATION: ${w}`, 'warning');
        });
      }

    } catch (error) {
      console.error('Frame upload failed:', error);
      setIsAnalyzing(false);
      addTerminalLog('COGNITION DISCONNECTION // GEMINI REQUEST TIMEOUT', 'error');
    }
  };

  const handleLocalTelemetryUpdate = (localData) => {
    if (!isSessionRunning) return;
    setTelemetry(prev => ({
      ...prev,
      confidence_score: localData.confidence_score,
      attention_score: localData.attention_score,
      eye_contact_score: localData.eye_contact_score
    }));
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const addTerminalLog = (text, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTerminalLogs(prev => [...prev, { time: timestamp, text, type }].slice(-25));
  };

  const handleWarningChange = (warningMessage) => {
    setActiveWarning(warningMessage);
    if (warningMessage) {
      addTerminalLog(`TRACKER EXCEPTION: ${warningMessage}`, 'error');
    }
  };

  const triggerVerdictReport = () => {
    playClick();
    if (history.length === 0) {
      alert("Insufficient data points. Please run the active telemetry sequence for at least 3 seconds (1 analysis interval) before compiling the verdict report.");
      return;
    }
    setIsSessionRunning(false);
    setShowReport(true);
  };

  // Tactile Theme Mappings
  const themeClass = {
    DARK: {
      bg: "bg-[#020617] text-slate-100 bg-gradient-to-b from-[#020617] via-[#091122] to-[#020617]",
      panel: "bg-[#0b1329]/80 backdrop-blur-xl border border-cyan-500/15 shadow-[0_0_50px_rgba(0,0,0,0.5)] shadow-black/80 hover:shadow-[0_0_30px_rgba(6,182,212,0.08)] transition-all duration-500",
      textPrimary: "text-slate-100",
      textSecondary: "text-slate-400",
      accentText: "text-cyan-400",
      accentBg: "bg-cyan-500/10",
      accentBorder: "border-cyan-500/20",
      innerPanel: "bg-black/45 border border-white/5 shadow-inner",
      accentBtn: "bg-gradient-to-b from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black font-black shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:scale-105 active:scale-95 active:translate-y-[1px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]",
      secondaryBtn: "border border-cyan-500/30 text-cyan-400 bg-cyan-950/20 hover:bg-cyan-500/10 hover:scale-105 active:scale-95 active:translate-y-[1px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]",
      tactileRedBtn: "border border-red-500/30 text-red-400 bg-red-950/20 hover:bg-red-500/10 hover:scale-105 active:scale-95 active:translate-y-[1px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
    },
    MEDIUM: {
      bg: "bg-[#121214] text-zinc-100 bg-gradient-to-b from-[#121214] via-[#1f1f23] to-[#121214]",
      panel: "bg-[#27272a]/95 border border-zinc-700/60 shadow-[0_10px_35px_rgba(0,0,0,0.4)] hover:border-zinc-600 transition-all duration-500",
      textPrimary: "text-zinc-100",
      textSecondary: "text-zinc-400",
      accentText: "text-blue-400",
      accentBg: "bg-blue-500/10",
      accentBorder: "border-blue-500/20",
      innerPanel: "bg-[#18181b]/55 border border-zinc-700/35 shadow-inner",
      accentBtn: "bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-bold shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:scale-105 active:scale-95 active:translate-y-[1px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]",
      secondaryBtn: "border border-blue-500/30 text-blue-400 bg-blue-950/20 hover:bg-blue-500/10 hover:scale-105 active:scale-95 active:translate-y-[1px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]",
      tactileRedBtn: "border border-red-500/30 text-red-400 bg-red-950/20 hover:bg-red-500/10 hover:scale-105 active:scale-95 active:translate-y-[1px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
    },
    LIGHT: {
      bg: "bg-[#f4f4f7] text-zinc-800 bg-gradient-to-b from-[#fafafa] via-[#f4f4f7] to-[#e4e4e7]",
      panel: "bg-white border border-zinc-200/80 shadow-[0_15px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500",
      textPrimary: "text-zinc-800",
      textSecondary: "text-zinc-500",
      accentText: "text-indigo-600",
      accentBg: "bg-indigo-50/90",
      accentBorder: "border-indigo-100",
      innerPanel: "bg-zinc-50/85 border border-zinc-200/60 shadow-inner",
      accentBtn: "bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold shadow-[0_4px_12px_rgba(79,70,229,0.15)] hover:scale-105 active:scale-95 active:translate-y-[1px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]",
      secondaryBtn: "border border-zinc-200 text-zinc-700 bg-zinc-50 hover:bg-zinc-100 hover:scale-105 active:scale-95 active:translate-y-[1px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]",
      tactileRedBtn: "border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 hover:scale-105 active:scale-95 active:translate-y-[1px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"
    }
  };

  const activeUiTheme = themeClass[uiTheme];
  const isLight = uiTheme === 'LIGHT';

  // Radial progress calculations (2 * PI * r)
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (telemetry.confidence_score / 100) * circumference;

  // Professionalism composite score (Gaze * 0.5 + Attentiveness * 0.5)
  const professionalismScore = Math.round(telemetry.eye_contact_score * 0.5 + telemetry.attention_score * 0.5) || 0;

  return (
    <div className={`w-full min-h-screen p-4 md:p-6 transition-all duration-500 ease-in-out relative ${activeUiTheme.bg}`}>
      
      {/* Dynamic Skeuomorphic Keyframe Styles */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .scanner-line {
          animation: scan 4s ease-in-out infinite;
        }
        .blink {
          animation: blink 2s infinite;
        }
        .pulse-border {
          animation: borderPulse 3s infinite;
        }
        @keyframes borderPulse {
          0%, 100% { border-color: rgba(6, 182, 212, 0.08); }
          50% { border-color: rgba(6, 182, 212, 0.25); }
        }
        .cyber-grid-pattern {
          background-image: radial-gradient(rgba(0, 255, 102, 0.03) 1px, transparent 0);
          background-size: 15px 15px;
        }
        .cyber-grid-pattern-light {
          background-image: radial-gradient(rgba(0, 0, 0, 0.02) 1.2px, transparent 0);
          background-size: 18px 18px;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Cyber Grid background mask */}
      <div className={`absolute inset-0 pointer-events-none z-0 ${isLight ? 'cyber-grid-pattern-light opacity-60' : 'cyber-grid-pattern opacity-100'}`}></div>

      <div className="max-w-7xl mx-auto w-full flex flex-col gap-6 relative z-10 animate-[fadeIn_0.5s_ease-out]">
        
        {/* 1. COMPACT HORIZONTAL TOP STATUS BAR */}
        <header 
          className={`${activeUiTheme.panel} p-3.5 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4`}
        >
          {/* Logo & App Info */}
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${
              isLight ? 'from-indigo-500 to-indigo-600 text-white shadow-md' : 'from-cyan-900/30 to-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
            }`}>
              <Radio className="w-5 h-5 blink" />
            </div>
            <div>
              <h1 className="font-orbitron font-extrabold text-sm tracking-wider flex items-center gap-1.5 leading-none">
                AI INTERVIEW GUARDIAN 
                <span className={`text-[8px] font-mono border px-1.5 py-0.5 rounded ${
                  isLight ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-cyan-400/30 bg-cyan-950/40 text-cyan-400'
                }`}>
                  TELEMETRY V2.5
                </span>
              </h1>
              <p className="text-[8px] font-mono opacity-50 tracking-wider uppercase mt-1">
                REAL-TIME COMPOSURE & EYE-TRACKING SPECTROMETER
              </p>
            </div>
          </div>

          {/* Core Telemetric Metrics Display */}
          <div className="flex flex-wrap items-center gap-3.5 w-full lg:w-auto font-mono text-[9px]">
            {/* Active API Engine Pill */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
              currentApiSource.toLowerCase().includes('gemini') 
                ? 'border-blue-500/20 bg-blue-950/20 text-blue-400'
                : currentApiSource.toLowerCase().includes('groq')
                  ? 'border-amber-500/20 bg-amber-950/20 text-amber-400 animate-pulse'
                  : currentApiSource.toLowerCase().includes('openrouter')
                    ? 'border-cyan-500/20 bg-cyan-950/20 text-cyan-400 animate-pulse'
                    : 'border-fuchsia-500/20 bg-fuchsia-950/20 text-fuchsia-400 animate-pulse'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                currentApiSource.toLowerCase().includes('gemini') 
                  ? 'bg-blue-400' 
                  : currentApiSource.toLowerCase().includes('groq') 
                    ? 'bg-amber-400' 
                    : currentApiSource.toLowerCase().includes('openrouter')
                      ? 'bg-cyan-400'
                      : 'bg-fuchsia-400'
              }`} />
              <span className="font-orbitron font-extrabold text-[10px] uppercase">
                ENGINE: {currentApiSource}
              </span>
            </div>

            {/* Quota limit metrics */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
              isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-black/35 border-white/5'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                rpm >= 13 ? 'bg-red-500 blink shadow-[0_0_6px_#EF4444]' : rpm >= 9 ? 'bg-amber-400 animate-pulse shadow-[0_0_6px_#F59E0B]' : 'bg-green-400 animate-pulse shadow-[0_0_6px_#10B981]'
              }`} />
              <span className="font-orbitron font-extrabold text-[10px] uppercase">
                GEMINI API: {rpm}/15 RPM <span className="opacity-40">|</span> {rpd}/1500 RPD
              </span>
            </div>

            {/* Session Stopwatch */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
              isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-green-950/20 border-green-500/25 text-green-400'
            }`}>
              <Clock className={`w-3.5 h-3.5 ${isLight ? 'text-indigo-600' : 'text-green-400'}`} />
              <span className="font-orbitron font-extrabold text-[10px] tracking-widest uppercase">
                TIME: {formatTime(sessionTime)}
              </span>
            </div>

            {/* Total Intervals */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
              isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-green-950/20 border-green-500/25 text-green-400'
            }`}>
              <Activity className={`w-3.5 h-3.5 ${isLight ? 'text-indigo-600' : 'text-green-400'}`} />
              <span className="font-orbitron font-extrabold text-[10px] uppercase">
                INTERVALS: {history.length}
              </span>
            </div>
          </div>
        </header>

        {/* Quota Lockout warning screen */}
        {quotaReached && (
          <div className="p-4 rounded-2xl glass-panel-warning flex items-start gap-3 text-red-500 border border-red-500/30 shadow-[0_0_25px_rgba(239,68,68,0.25)] animate-pulse relative overflow-hidden z-20">
            <div className="absolute inset-0 cyber-dots opacity-5 pointer-events-none"></div>
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-orbitron font-extrabold text-[11px] tracking-wider uppercase block text-red-400">
                COGNITION SHIELD TRIPPED // API RATE QUOTA DEPLETED
              </span>
              <p className="font-mono text-xs leading-relaxed text-zinc-300">
                Your Google Gemini API free-tier threshold of 15 requests per minute has been fully depleted. Optical stream processing has been suspended. Please configure a valid billing profile or wait for rate limits to reset automatically.
              </p>
            </div>
          </div>
        )}

        {/* 2. RESPONSIVE 2-COLUMN COMMAND GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
          
          {/* Left Column (7 units): hero webcam panel, SVG graph */}
          <div className="lg:col-span-7 flex flex-col gap-6 w-full">
            
            {/* Interview Question Card (Rendered above Webcam Feed when interview is active) */}
            {interviewStage.startsWith('ACTIVE_Q') && (
              <div 
                className={`${activeUiTheme.panel} p-4 md:p-5 flex flex-col gap-3.5 w-full relative overflow-hidden transition-all duration-500 ease-in-out`}
              >
                {/* HUD Header */}
                <div className="flex justify-between items-center border-b border-zinc-700/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      isLight ? 'bg-indigo-600 animate-ping' : 'bg-cyan-400 animate-ping'
                    }`} />
                    <span className={`font-orbitron font-extrabold text-[10px] tracking-wider uppercase ${
                      isLight ? 'text-indigo-600' : 'text-cyan-400'
                    }`}>
                      INTERVIEW ACTIVE // QUESTION 0{currentQuestionIndex + 1} OF 03
                    </span>
                  </div>
                  
                  <div className="font-mono text-[9px]">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded border font-semibold ${
                      isListening 
                        ? 'border-green-500/30 text-green-500 bg-green-500/5 animate-pulse' 
                        : 'border-red-500/30 text-red-500 bg-red-500/5'
                    }`}>
                      {isListening ? '• RECORDING ACTIVE' : '• MIC MUTED'}
                    </span>
                  </div>
                </div>

                {/* Question panel */}
                <div className={`p-3.5 rounded-lg border ${
                  isLight 
                    ? 'bg-indigo-50/55 border-indigo-100/50' 
                    : 'bg-cyan-950/10 border-cyan-500/10'
                }`}>
                  <p className={`font-mono text-[11px] sm:text-xs font-semibold leading-relaxed ${
                    isLight ? 'text-zinc-800' : 'text-white'
                  }`}>
                    {questions[currentQuestionIndex]}
                  </p>
                </div>

                {/* Real-time speech transcribing view */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500 tracking-wider font-bold uppercase">
                    <span>LIVE SPEECH TRANSCRIBER READOUT</span>
                    {isListening && (
                      <span className={`${isLight ? 'text-indigo-600' : 'text-cyan-400'} animate-pulse`}>
                        STREAMING SPEECH LIVE...
                      </span>
                    )}
                  </div>
                  <div 
                    className={`rounded-lg border p-3 font-mono text-[11px] leading-relaxed h-[68px] overflow-y-auto italic transition-all duration-300 ${
                      isLight 
                        ? 'bg-white border-zinc-200 text-zinc-600' 
                        : 'bg-black/60 border-white/5 text-zinc-300'
                    }`}
                  >
                    {transcripts[currentQuestionIndex] ? (
                      <span>
                        {transcripts[currentQuestionIndex].includes(' (transcribing...') ? (
                          <>
                            {transcripts[currentQuestionIndex].split(' (transcribing...')[0]}
                            <span className={`font-bold not-italic ${isLight ? 'text-indigo-600' : 'text-cyan-400'}`}>
                              {" " + transcripts[currentQuestionIndex].match(/\(transcribing\.\.\. ([^)]+)\)/)?.[1]}
                            </span>
                          </>
                        ) : (
                          transcripts[currentQuestionIndex]
                        )}
                      </span>
                    ) : (
                      <span className="text-zinc-500 not-italic">
                        Waiting for candidate speech input... Start speaking to write your answer to this question.
                      </span>
                    )}
                  </div>
                </div>

                {/* Local controls inside question panel */}
                <div className="flex justify-between items-center gap-3 pt-1">
                  <button
                    onClick={() => {
                      playClick();
                      stopSpeechRecognition();
                      setIsSessionRunning(false);
                      setInterviewStage('SETUP');
                      addTerminalLog('MOCK INTERVIEW SESSION RESET BY CANDIDATE', 'warning');
                    }}
                    className={`px-3 py-1.5 rounded font-orbitron font-extrabold text-[9px] tracking-wider border border-red-500/20 text-red-500 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer`}
                  >
                    RESET INTERVIEW
                  </button>

                  <button
                    onClick={handleNextQuestion}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded font-orbitron font-black text-[9px] tracking-wider active:scale-95 transition-all cursor-pointer ${
                      isLight 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md hover:shadow-indigo-500/10' 
                        : 'bg-cyan-400 text-black hover:bg-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    }`}
                  >
                    {currentQuestionIndex === 2 ? 'SUBMIT SESSION & COMPILE AUDIT' : 'SUBMIT ANSWER & CONTINUE'}
                  </button>
                </div>
              </div>
            )}

            {/* Hero Webcam Panel with Controls Toolbar underneath */}
            <WebcamAnalyzer 
              onFrameCaptured={handleFrameCaptured}
              onWarningChange={handleWarningChange}
              onLocalTelemetryUpdate={handleLocalTelemetryUpdate}
              isAnalyzing={isAnalyzing}
              isSessionActive={isSessionRunning}
              isCameraOn={isCameraOn}
              themeMode={uiTheme}
              theme={activeUiTheme}
              onStartSession={handleStartSession}
              onStopSession={handleStopSession}
              onToggleCamera={() => {
                playClick();
                setIsCameraOn(!isCameraOn);
                if (!isCameraOn) setQuotaReached(false);
              }}
              onGenerateReport={triggerVerdictReport}
            />

            {/* Active Warnings Console Overlay */}
            {activeWarning && (
              <div className="p-4 rounded-2xl glass-panel-warning flex items-start gap-3 text-red-400 border border-red-500/20 relative overflow-hidden animate-pulse">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                <div className="space-y-0.5">
                  <span className="font-orbitron font-extrabold text-[10px] tracking-wider uppercase block">
                    NEURAL SENSOR COMPROMISED // FEED ALERTER
                  </span>
                  <p className="font-mono text-[10px] leading-relaxed">
                    {activeWarning}
                  </p>
                </div>
              </div>
            )}

            {/* High-Tech SVG Line graph */}
            <div className={`${activeUiTheme.panel} p-4 md:p-5 rounded-2xl`}>
              <AnalyticsChart history={history} themeMode={uiTheme} theme={theme} />
            </div>

          </div>

          {/* Right Column (5 units): Composure Readout, AI Insights cards */}
          <div className="lg:col-span-5 flex flex-col gap-6 w-full">
            
            {/* Skeuomorphic Composure Readout Gauges */}
            <div className={`${activeUiTheme.panel} p-4 md:p-5 flex flex-col gap-4 relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-5 pointer-events-none"></div>

              <div className="flex justify-between items-center border-b border-zinc-700/10 pb-2.5">
                <h2 className="font-orbitron font-bold text-xs tracking-wider uppercase flex items-center gap-2">
                  <Sliders className={`w-4 h-4 ${activeUiTheme.accentText}`} />
                  COMPOSURE RADIAL BEHAVIOR LOG
                </h2>
                <span className="font-mono text-[8px] opacity-60">SENSORS_30Hz</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center py-2">
                
                {/* Skeuomorphic Radial Dial indicator */}
                <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
                  <div className={`absolute inset-1.5 rounded-full ${activeUiTheme.innerPanel} flex items-center justify-center`}></div>
                  <svg className="w-full h-full transform -rotate-90 overflow-visible z-10" viewBox="0 0 120 120">
                    {/* Background track circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="transparent"
                      stroke={isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)'}
                      strokeWidth="9"
                    />
                    {/* Glowing colored dial track */}
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="transparent"
                      stroke={isLight ? '#4f46e5' : (uiTheme === 'MEDIUM' ? '#3b82f6' : '#00FF66')}
                      strokeWidth="7"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                      style={{
                        filter: isLight ? 'none' : `drop-shadow(0px 0px 8px ${uiTheme === 'MEDIUM' ? '#3b82f6' : '#00FF66'})`
                      }}
                    />
                  </svg>
                  
                  {/* Glowing text dashboard metrics inside radial dial */}
                  <div className="absolute flex flex-col items-center justify-center text-center z-20">
                    <span className="text-[7px] font-mono opacity-50 tracking-widest font-black uppercase">CONFIDENCE</span>
                    <span className={`font-orbitron text-2xl font-black ${isLight ? 'text-indigo-600' : 'text-white'}`}>
                      {telemetry.confidence_score}%
                    </span>
                    <span className={`text-[8px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded uppercase mt-0.5 ${
                      isLight ? 'text-indigo-700 bg-indigo-50 border border-indigo-100' : 'text-green-400 bg-green-500/5'
                    }`}>
                      {telemetry.emotion.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* AI Competency Gauges */}
                <div className="flex-1 w-full space-y-4 font-mono">
                  
                  {/* Gauge 1: Attentiveness */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className="text-blue-400 flex items-center gap-1">
                        <Brain className="w-3.5 h-3.5" />
                        ATTENTIVENESS SCORE
                      </span>
                      <span className="font-extrabold text-[10px]">{telemetry.attention_score}%</span>
                    </div>
                    <div className={`w-full rounded-full h-2 overflow-hidden border p-[1px] ${activeUiTheme.innerPanel}`}>
                      <div 
                        className="bg-blue-400 h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ 
                          width: `${telemetry.attention_score}%`,
                          boxShadow: '0 0 8px rgba(96, 165, 250, 0.6)'
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Gauge 2: Gaze alignment */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className="text-amber-400 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        GAZE ALIGNMENT LOCK
                      </span>
                      <span className="font-extrabold text-[10px]">{telemetry.eye_contact_score}%</span>
                    </div>
                    <div className={`w-full rounded-full h-2 overflow-hidden border p-[1px] ${activeUiTheme.innerPanel}`}>
                      <div 
                        className="bg-amber-400 h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ 
                          width: `${telemetry.eye_contact_score}%`,
                          boxShadow: '0 0 8px rgba(245, 158, 11, 0.6)'
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Gauge 3: Professionalism Score */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className={`${activeUiTheme.accentText} flex items-center gap-1`}>
                        <Sliders className="w-3.5 h-3.5" />
                        PROFESSIONALISM SCORE
                      </span>
                      <span className="font-extrabold text-[10px]">{professionalismScore}%</span>
                    </div>
                    <div className={`w-full rounded-full h-2 overflow-hidden border p-[1px] ${activeUiTheme.innerPanel}`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          isLight ? 'bg-indigo-600' : (uiTheme === 'MEDIUM' ? 'bg-blue-500' : 'bg-cyan-400')
                        }`}
                        style={{ 
                          width: `${professionalismScore}%`,
                          boxShadow: isLight ? 'none' : `0 0 8px ${uiTheme === 'MEDIUM' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(0, 255, 102, 0.6)'}`
                        }}
                      ></div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Gorgeous AI Insight observations list */}
            <div className={`${activeUiTheme.panel} p-4 md:p-5 flex flex-col gap-4 relative overflow-hidden flex-1 min-h-[360px]`}>
              <div className="absolute inset-0 opacity-5 pointer-events-none"></div>

              <div className="flex justify-between items-center border-b border-zinc-700/10 pb-2.5">
                <h2 className="font-orbitron font-bold text-xs tracking-wider uppercase flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${activeUiTheme.accentText}`} />
                  AI DIAGNOSTICS & INSIGHT FEED
                </h2>
                <span className="font-mono text-[8px] opacity-60">ANALYSIS_REALTIME</span>
              </div>

              <div className="flex flex-col gap-4 h-full">
                
                {/* Glowing highlighted brief briefing card */}
                <div className={`p-3.5 rounded-xl border flex flex-col gap-1 transition-all duration-500 ${
                  isLight 
                    ? 'bg-zinc-50 border-zinc-200' 
                    : 'bg-green-500/5 border-green-500/10 text-white'
                }`}>
                  <span className={`font-orbitron font-black text-[9px] tracking-wider uppercase flex items-center gap-1.5 mb-1 ${
                    isLight ? 'text-indigo-600' : 'text-green-400'
                  }`}>
                    <Sparkles className={`w-3.5 h-3.5 animate-pulse ${isLight ? 'text-indigo-600' : 'text-green-400'}`} />
                    REAL-TIME OBSERVATION BRIEFING
                  </span>
                  <p className={`font-mono text-[10px] leading-relaxed leading-normal ${
                    isLight ? 'text-zinc-600' : 'text-zinc-300'
                  }`}>
                    {telemetry.summary}
                  </p>
                </div>

                {/* Categorized Scrolling AI Observation Cards */}
                <div 
                  ref={terminalContainerRef}
                  className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1"
                >
                  {terminalLogs.slice().reverse().map((log, idx) => {
                    let cardBg = "bg-cyan-500/5 border-cyan-500/10 text-cyan-400";
                    let badgeText = "AI OBSERVE";
                    let badgeColor = "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
                    
                    if (log.type === 'error') {
                      cardBg = "bg-red-500/5 border-red-500/15 text-red-400";
                      badgeText = "CRITICAL EXCEPTION";
                      badgeColor = "text-red-400 bg-red-500/10 border-red-500/20";
                    } else if (log.type === 'warning') {
                      cardBg = "bg-amber-500/5 border-amber-500/15 text-amber-400";
                      badgeText = "ALERT DEVIATION";
                      badgeColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                    } else if (log.text.includes('LOCK SECURED') || log.text.includes('SUCCESS') || log.text.includes('STABLE')) {
                      cardBg = "bg-green-500/5 border-green-500/15 text-green-400";
                      badgeText = "LOCK SECURED";
                      badgeColor = "text-green-400 bg-green-500/10 border-green-500/20";
                    }

                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border flex flex-col gap-1.5 transition-all duration-300 animate-[fadeIn_0.3s_ease-out] ${cardBg} ${
                          isLight ? 'bg-zinc-50 border-zinc-200 shadow-sm' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center text-[8px] font-mono font-bold uppercase tracking-wider">
                          <span className={`px-2 py-0.5 rounded border ${badgeColor}`}>
                            {badgeText}
                          </span>
                          <span className="opacity-50">{log.time}</span>
                        </div>
                        <p className={`text-[10px] font-mono leading-relaxed font-semibold ${
                          isLight ? 'text-zinc-700' : 'text-zinc-100'
                        }`}>
                          {log.text}
                        </p>
                      </div>
                    );
                  })}
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* 3. TACTILE SKEUOMORPHIC BOTTOM TOOLBAR */}
        <footer 
          className={`${activeUiTheme.panel} p-3 md:p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4`}
        >
          {/* Heartbeat Status */}
          <div className="flex items-center gap-2 font-mono text-[9px] opacity-60 uppercase">
            <span className={`w-2 h-2 rounded-full ${isSessionRunning ? 'bg-green-500 blink' : 'bg-zinc-500'}`}></span>
            SYSTEM STATUS: {isSessionRunning ? 'CAPTURING' : 'STANDBY'}
          </div>

          {/* Dynamic Theme Switcher */}
          <button
            onClick={() => {
              playClick();
              setUiTheme(prev => {
                if (prev === 'DARK') return 'MEDIUM';
                if (prev === 'MEDIUM') return 'LIGHT';
                return 'DARK';
              });
              addTerminalLog(`USER SWITCHED THEME: CYCLING INTERFACE STYLES`, 'info');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-orbitron font-black text-[9px] tracking-wider transition-all duration-300 cursor-pointer ${activeUiTheme.secondaryBtn}`}
            title="Switch Visual Style (Dark / Medium / Light)"
          >
            {uiTheme === 'DARK' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-cyan-400" />
                THEME: DARK
              </>
            ) : uiTheme === 'MEDIUM' ? (
              <>
                <Contrast className="w-3.5 h-3.5 text-blue-400" />
                THEME: GRAPHITE
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-indigo-600" />
                THEME: MINIMAL
              </>
            )}
          </button>
        </footer>

        {/* 4. MODAL: FINAL ASSESSMENT REPORT */}
        {showReport && (
          <FinalReportModal 
            history={history}
            onClose={() => {
              setShowReport(false);
              setInterviewStage('SETUP');
            }}
            subject={subject}
            theme={theme}
            questions={questions}
            transcripts={transcripts}
            gradeReport={gradeReport}
          />
        )}

        {/* 5. MODAL: INTERVIEW SETUP WINDOW */}
        {interviewStage === 'SETUP' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className={`relative w-full max-w-md ${activeUiTheme.panel} rounded-3xl p-6 overflow-hidden shadow-2xl flex flex-col gap-6 border`}>
              <div className="absolute inset-0 opacity-5 pointer-events-none"></div>

              <div className="text-center space-y-2 pb-2 border-b border-zinc-700/10">
                <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-gradient-to-br ${
                  isLight ? 'from-indigo-500 to-indigo-600 text-white shadow-md' : 'from-green-950/40 to-green-500/10 text-green-400 border border-green-500/30'
                }`}>
                  <Brain className="w-7 h-7 animate-pulse" />
                </div>
                <h2 className="font-orbitron font-extrabold tracking-widest text-sm uppercase mt-2">
                  STRUCTURED COGNITIVE INTERVIEW
                </h2>
                <p className="font-mono text-[9px] tracking-wider opacity-60 uppercase">
                  CONFIGURE BEHAVIORAL GUARDIAN SPECIFICATIONS
                </p>
              </div>

              <div className="space-y-4 font-mono text-[10px]">
                {/* Subject picker */}
                <div className="space-y-1.5">
                  <label className="text-[9px] tracking-wider uppercase block font-bold font-orbitron opacity-50">
                    SELECT INTERVIEW TOPIC:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Frontend Engineering", "Backend Engineering", "System Design", "Product Management"].map((sub) => {
                      const isActive = subject === sub;
                      return (
                        <button
                          key={sub}
                          onClick={() => { playClick(); setSubject(sub); }}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                            isActive 
                              ? (isLight 
                                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50' 
                                  : 'border-green-500 text-green-400 bg-green-500/10 shadow-[0_0_8px_rgba(0,255,102,0.15)]') 
                              : (isLight 
                                  ? 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300' 
                                  : 'border-white/5 bg-black/40 text-gray-400 hover:border-white/10 hover:text-white')
                          }`}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Theme picker */}
                <div className="space-y-1.5">
                  <label className="text-[9px] tracking-wider uppercase block font-bold font-orbitron opacity-50">
                    SELECT BEHAVIORAL PATTERN:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["STAR Behavioral", "Technical Coding", "System Architecture", "Pressure Test"].map((thm) => {
                      const isActive = theme === thm;
                      return (
                        <button
                          key={thm}
                          onClick={() => { playClick(); setTheme(thm); }}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                            isActive 
                              ? (isLight 
                                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50' 
                                  : 'border-green-500 text-green-400 bg-green-500/10 shadow-[0_0_8px_rgba(0,255,102,0.15)]') 
                              : (isLight 
                                  ? 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300' 
                                  : 'border-white/5 bg-black/40 text-gray-400 hover:border-white/10 hover:text-white')
                          }`}
                        >
                          {thm}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Start Session tactile button */}
              <button
                onClick={() => {
                  playClick();
                  playNextQuestionChirp();
                  const selectedQs = QUESTIONS_LIBRARY[subject][theme];
                  setQuestions(selectedQs);
                  setTranscripts({ 0: '', 1: '', 2: '' });
                  setCurrentQuestionIndex(0);
                  setInterviewStage('ACTIVE_Q1');
                  handleStartSession();
                  
                  setTimeout(() => {
                    startSpeechRecognition(0);
                  }, 100);
                }}
                className={`w-full py-3 rounded-xl font-orbitron font-black text-[10px] tracking-widest transition-all duration-300 cursor-pointer shadow-lg uppercase ${
                  isLight 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-200/50' 
                    : 'bg-green-500 text-black hover:bg-green-400 shadow-[0_0_20px_rgba(0,255,102,0.4)]'
                }`}
              >
                INITIALIZE SENSOR ARRAY & START
              </button>
            </div>
          </div>
        )}

        {/* 6. MODAL: NEURAL GRADING PROGRESS LOADING SCREEN */}
        {interviewStage === 'GRADING' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <div className="text-center space-y-4">
              <Brain className="w-12 h-12 text-cyan-400 mx-auto animate-bounce" />
              <h2 className="font-orbitron font-extrabold text-sm text-cyan-400 tracking-widest glow-cyan uppercase">
                ANALYZING AUDIO & TELEMETRY VECTORS
              </h2>
              <p className="font-mono text-[9px] text-gray-500 max-w-xs mx-auto leading-relaxed uppercase">
                CROSS-REFERENCING WEB SPEECH TRANSCRIPTS WITH EMOTIONAL POSTURE DATA MATRICES OVER MULTI-CLOUD COGNITIVE AI PIPELINES...
              </p>
              <div className="w-40 h-1 bg-white/5 rounded-full mx-auto overflow-hidden">
                <div className="bg-cyan-400 h-full w-1/2 animate-[pulse_1.5s_infinite] rounded-full"></div>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="text-center font-mono text-[8px] opacity-40 py-2">
          AI INTERVIEW GUARDIAN BEHAVIORAL METRICS DECK // POWERED BY GOOGLE GEMINI 3.5 FLASH &communitiesCommunity APIS
        </footer>

      </div>
    </div>
  );
}
