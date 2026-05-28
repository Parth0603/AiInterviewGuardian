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
  Terminal as TerminalIcon, 
  Sparkles,
  Eye,
  Brain,
  Award,
  Camera,
  CameraOff,
  X
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
      "Tell me about a major product launch that failed to meet its key performance indicators (KPIs). What did you learn and how did you pivot?",
      "Talk about a time you had to lead a cross-functional engineering team with highly divergent opinions. How did you establish alignment?"
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

  // Quota Telemetry Tracking (Free Tier limits: 15 RPM / 1500 RPD)
  const [rpm, setRpm] = useState(0);
  const [rpd, setRpd] = useState(() => {
    const saved = localStorage.getItem('gemini_rpd');
    const savedDate = localStorage.getItem('gemini_rpd_date');
    const today = new Date().toDateString();
    
    if (saved && savedDate === today) {
      return parseInt(saved, 10);
    }
    // New day reset
    localStorage.setItem('gemini_rpd_date', today);
    localStorage.setItem('gemini_rpd', '0');
    return 0;
  });
  
  const [requestTimes, setRequestTimes] = useState([]);

  // Loop to decay and calculate RPM every second
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

  // Monitor RPM rate threshold and issue terminal diagnostic logs
  useEffect(() => {
    if (rpm >= 13) {
      addTerminalLog('CRITICAL API WARNING: Approaching Free-Tier Rate Limit (15 RPM)! Consider pausing pipeline.', 'warning');
    }
  }, [rpm]);
  
  // Historical telemetry log
  const [history, setHistory] = useState([]);
  
  // Latest Gemini response
  const [telemetry, setTelemetry] = useState({
    confidence: "Waiting to initialize system calibration...",
    confidence_score: 0,
    attention: "System calibration required.",
    attention_score: 0,
    eye_contact: "System calibration required.",
    eye_contact_score: 0,
    emotion: "Standby",
    warnings: [],
    summary: "Establish a camera connection, and press 'INITIALIZE TELEMETRY' to activate live neural behavior tracking."
  });

  // Terminal telemetry log messages (Chronological order)
  const [terminalLogs, setTerminalLogs] = useState([
    { time: new Date().toLocaleTimeString(), text: 'SYSTEM INI // GUARDENG-V2.5 REBOOT', type: 'info' },
    { time: new Date().toLocaleTimeString(), text: 'NEURAL NET CALIBRATED // READY FOR CAPTURE', type: 'info' }
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

  // Auto-scroll terminal logs internally to prevent page jump/hijack scroll position
  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  // Format stopwatch: MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartSession = () => {
    playClick();
    setQuotaReached(false); // Clear previous quota blocks on manual session reset
    setIsSessionRunning(true);
    setSessionTime(0);
    setHistory([]);
    setTerminalLogs([
      { time: new Date().toLocaleTimeString(), text: 'TELEMETRY SEQUENCE ACTIVATED', type: 'info' },
      { time: new Date().toLocaleTimeString(), text: 'INTERVAL CAPTURE ARMED // SWEEP RATE: 3000MS', type: 'info' }
    ]);
  };

  const handleStopSession = () => {
    playClick();
    setIsSessionRunning(false);
    addTerminalLog('TELEMETRY SEQUENCE HALTED', 'info');
  };

  // Refs to allow our continuous web speech recognition loop to read the latest states dynamically
  const currentQuestionIndexRef = useRef(0);
  const interviewStageRef = useRef('SETUP');

  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  useEffect(() => {
    interviewStageRef.current = interviewStage;
  }, [interviewStage]);

  // Clean up any speech recognition instances on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Web Speech API Transcription Controller - Always creates a FRESH instance for reliable mic tracking
  const startSpeechRecognition = (qIndex) => {
    // ALWAYS stop any existing recognition first before creating a new one
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null; // Prevent auto-restart loop from firing on intentional stop
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);

    // Small delay to let browser fully release the mic before re-acquiring
    setTimeout(() => {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          addTerminalLog('SPEECH RECOGNITION NOT SUPPORTED BY BROWSER', 'warning');
          return;
        }

        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          setIsListening(true);
          addTerminalLog(`MIC LINK ACTIVE // RECORDING Q0${(qIndex || currentQuestionIndexRef.current) + 1}...`, 'info');
        };

        rec.onerror = (e) => {
          console.error('Speech recognition error:', e.error, e);
          setIsListening(false);
          if (e.error === 'not-allowed' || e.error === 'permission-denied') {
            addTerminalLog('MIC ACCESS DENIED // CHECK BROWSER PERMISSIONS', 'error');
          } else if (e.error === 'no-speech') {
            // No speech detected - this is normal, just restart
            addTerminalLog('MIC STANDBY // NO SPEECH DETECTED, CONTINUING TO LISTEN...', 'info');
          } else if (e.error === 'audio-capture') {
            addTerminalLog('MIC HARDWARE ERROR // NO MICROPHONE DETECTED', 'error');
          } else {
            addTerminalLog(`MIC SYSTEM WARNING: ${e.error}`, 'warning');
          }
        };

        rec.onend = () => {
          setIsListening(false);
          // Self-healing: auto-restart ONLY if interview is still active
          if (interviewStageRef.current && interviewStageRef.current.startsWith('ACTIVE_Q') && recognitionRef.current === rec) {
            console.log('🛰️ Speech recognition ended. Auto-restarting...');
            setTimeout(() => {
              if (interviewStageRef.current && interviewStageRef.current.startsWith('ACTIVE_Q') && recognitionRef.current === rec) {
                try {
                  rec.start();
                } catch (err) {
                  console.warn('Auto-restart failed:', err.message);
                }
              }
            }, 300);
          }
        };

        rec.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          const activeIndex = currentQuestionIndexRef.current;
          setTranscripts(prev => {
            // Strip out any pending interim tag from previous pass
            const baseText = prev[activeIndex] ? prev[activeIndex].split(' (transcribing...')[0].trimEnd() : '';
            const cleanedText = baseText + (finalTranscript ? (baseText ? ' ' : '') + finalTranscript.trimEnd() : '');
            const showText = cleanedText + (interimTranscript ? ` (transcribing... ${interimTranscript})` : '');
            return {
              ...prev,
              [activeIndex]: showText.trim()
            };
          });
        };

        recognitionRef.current = rec;
        rec.start();
        console.log('🎙️ Speech recognition started fresh for Q' + ((qIndex !== undefined ? qIndex : currentQuestionIndexRef.current) + 1));
      } catch (err) {
        console.error('Speech recognition startup failed:', err);
        addTerminalLog(`MIC STARTUP ERROR: ${err.message}`, 'error');
      }
    }, 250);
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        // Disable auto-restart by nulling handlers BEFORE stopping
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);

    // Clean up transcribing placeholders for all indexes
    setTranscripts(prev => {
      const cleaned = {};
      Object.keys(prev).forEach(key => {
        cleaned[key] = (prev[key] || '').split(' (transcribing...')[0].trim();
      });
      return cleaned;
    });
  };

  const handleNextQuestion = async () => {
    playClick();

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < 3) {
      playNextQuestionChirp();
      setCurrentQuestionIndex(nextIndex);
      setInterviewStage(nextIndex === 1 ? 'ACTIVE_Q2' : 'ACTIVE_Q3');
      addTerminalLog(`ADVANCING TO QUESTION 0${nextIndex + 1}...`, 'info');
      // Restart fresh speech recognition for the new question
      setTimeout(() => {
        startSpeechRecognition(nextIndex);
      }, 400);
    } else {
      // Complete interview - transition to GRADING state
      setInterviewStage('GRADING');
      addTerminalLog('MOCK INTERVIEW QUESTIONS COMPLETE', 'info');
      addTerminalLog('HALTING TELEMETRY SEQUENCE // INITIATING EVALUATION', 'info');
      
      // Stop speech recognition completely
      stopSpeechRecognition();
      
      // Stop session camera analysis
      setIsSessionRunning(false);

      try {
        addTerminalLog('DISPATCHING TELEMETRY HISTORY & ANSWER TRANSCRIPTS TO GRADING MATRIX...', 'info');
        
        // Clean transcripts up
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
    }
  };

  const handleFrameCaptured = async (base64Image) => {
    if (!isSessionRunning) return;

    // Log request timestamp for RPM
    setRequestTimes(prev => [...prev, Date.now()]);
    
    // Increment RPD counter
    setRpd(prev => {
      const next = prev + 1;
      localStorage.setItem('gemini_rpd', next.toString());
      return next;
    });

    setIsAnalyzing(true);
    addTerminalLog('SENDING SNAPSHOT TO GEMINI COGNITION ENGINE...', 'info');

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
          setIsAnalyzing(false);
          addTerminalLog('CRITICAL: GEMINI API KEY QUOTA LIMIT EXHAUSTED', 'error');
          addTerminalLog('AUTOMATIC SCANNER INHIBIT ACTIVATED // CAM HALTED', 'error');
          return;
        }
      }

      if (!response.ok) {
        throw new Error('Server analysis response error');
      }

      const result = await response.json();
      
      setTelemetry(result);
      if (result.api_source) {
        setCurrentApiSource(result.api_source);
      }
      setIsAnalyzing(false);

      // Append to historical trend list
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

      // Add to terminal logging
      addTerminalLog(`FRAME ANALYZED // CONFIDENCE: ${result.confidence_score}% // EMOTION: ${result.emotion.toUpperCase()}`, 'info');
      
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(w => {
          addTerminalLog(`WARNING: ${w}`, 'warning');
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

  const addTerminalLog = (text, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [...prev, { time: timestamp, text, type }].slice(-30)); // Cap log height
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

  // Radial progress calculations (2 * PI * r)
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (telemetry.confidence_score / 100) * circumference;

  return (
    <div className="min-h-screen text-gray-200 p-4 md:p-6 flex flex-col gap-5 relative max-w-7xl mx-auto w-full z-10">
      
      {/* 1. FUTURISTIC HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center p-3.5 rounded-xl glass-panel border border-green-500/20 relative overflow-hidden pulse-border">
        {/* Background Dot Row */}
        <div className="absolute inset-x-0 bottom-0 h-1 cyber-dots opacity-20 pointer-events-none"></div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg border border-green-400/40 flex items-center justify-center bg-green-500/10 shadow-[0_0_15px_rgba(0,255,102,0.2)]">
            <Radio className="w-6 h-6 text-green-400 blink" />
          </div>
          <div>
            <h1 className="font-orbitron font-extrabold text-base tracking-widest text-green-400 glow-green flex items-center gap-2">
              AI INTERVIEW GUARDIAN 
              <span className="text-[8px] font-mono border border-green-400 bg-green-950/40 px-1.5 py-0.5 text-green-400 rounded">
                TELEMETRY V2.5
              </span>
            </h1>
            <p className="text-[9px] font-mono text-gray-500 tracking-wider uppercase">
              REAL-TIME COMPOSURE & EYE-TRACKING SPECTROMETER
            </p>
          </div>
        </div>

        {/* Stopwatch & Status */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-2 mt-3 lg:mt-0 font-mono text-[9px] w-full lg:w-auto">
          {/* Row 1: API Metrics */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Active API Engine Source Pill */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-[9px] ${
              currentApiSource.toLowerCase().includes('gemini') 
                ? 'border-blue-500/20 bg-blue-950/20 text-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.1)]'
                : currentApiSource.toLowerCase().includes('groq')
                  ? 'border-amber-500/20 bg-amber-950/20 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.1)] animate-pulse'
                  : currentApiSource.toLowerCase().includes('openrouter')
                    ? 'border-cyan-500/20 bg-cyan-950/20 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.1)] animate-pulse'
                    : 'border-fuchsia-500/20 bg-fuchsia-950/20 text-fuchsia-400 shadow-[0_0_8px_rgba(240,73,244,0.1)] animate-pulse'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                currentApiSource.toLowerCase().includes('gemini') 
                  ? 'bg-blue-400' 
                  : currentApiSource.toLowerCase().includes('groq') 
                    ? 'bg-amber-400' 
                    : currentApiSource.toLowerCase().includes('openrouter')
                      ? 'bg-cyan-400'
                      : 'bg-fuchsia-400'
              }`} style={{
                boxShadow: currentApiSource.toLowerCase().includes('gemini') 
                  ? '0 0 6px #60A5FA' 
                  : currentApiSource.toLowerCase().includes('groq') 
                    ? '0 0 6px #F59E0B' 
                    : currentApiSource.toLowerCase().includes('openrouter')
                      ? '0 0 6px #22D3EE'
                      : '0 0 6px #F049F4'
              }}></span>
              <span className="text-gray-500 uppercase">ENGINE:</span>
              <span className="font-orbitron text-[10px] font-black tracking-wider uppercase">
                {currentApiSource}
              </span>
            </div>

            {/* Real-time API Quota pill */}
            <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg border border-white/5">
              <span className={`w-1.5 h-1.5 rounded-full ${
                rpm >= 13 ? 'bg-red-500 blink' : rpm >= 9 ? 'bg-amber-400 animate-pulse' : 'bg-blue-400 animate-pulse'
              }`} style={{
                boxShadow: rpm >= 13 ? '0 0 8px #EF4444' : rpm >= 9 ? '0 0 8px #F59E0B' : '0 0 8px #60A5FA'
              }}></span>
              <span className="text-gray-400">GEMINI API:</span>
              <span className={`font-orbitron font-extrabold text-xs tracking-wider ${
                rpm >= 13 ? 'text-red-500 glow-red blink' : rpm >= 9 ? 'text-amber-400 glow-yellow' : 'text-blue-400'
              }`}>
                {rpm}/15 RPM
              </span>
              <span className="text-gray-600">|</span>
              <span className="text-gray-400 font-bold">{rpd}/1500 RPD</span>
            </div>
          </div>

          {/* Row 2: Session Telemetry */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg border border-white/5">
              <Clock className="w-4 h-4 text-green-400" />
              <span className="text-gray-400">TIME:</span>
              <span className="font-orbitron text-xs text-green-400 font-bold tracking-widest">
                {formatTime(sessionTime)}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg border border-white/5">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-gray-400">INTERVALS:</span>
              <span className="font-orbitron text-xs text-green-400 font-bold">{history.length}</span>
            </div>
          </div>
          
        </div>
      </header>

      {/* API Key Quota Exhausted Inhibit Panel */}
      {quotaReached && (
        <div className="p-4 rounded-xl glass-panel-warning flex items-start gap-3 text-red-500 border border-red-500/30 shadow-[0_0_25px_rgba(239,68,68,0.25)] animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 cyber-dots opacity-5 pointer-events-none"></div>
          <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-500" />
          <div className="space-y-1">
            <span className="font-orbitron font-extrabold text-[10px] tracking-wider uppercase block text-red-400">
              SYSTEM LOCKOUT // API KEY QUOTA LIMIT EXHAUSTED
            </span>
            <p className="font-mono text-xs leading-relaxed text-gray-300">
              The Google Gemini API free-tier request threshold has been fully depleted. The live optical webcam feed has been suspended, and the telemetry pipeline has been deactivated. Please configure a valid billing profile or wait for daily AI Studio limits to reset.
            </p>
          </div>
        </div>
      )}

      {/* 2. MAIN LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column (7 units): Camera feed, controls, chart */}
        <div className="lg:col-span-7 flex flex-col gap-5 w-full">
          
          {/* Webcam Analyzer Section */}
          <WebcamAnalyzer 
            onFrameCaptured={handleFrameCaptured}
            onWarningChange={handleWarningChange}
            onLocalTelemetryUpdate={handleLocalTelemetryUpdate}
            isAnalyzing={isAnalyzing}
            isSessionActive={isSessionRunning}
            isCameraOn={isCameraOn}
          />

          {/* Persistent Utility Control Bar */}
          <div className="flex flex-wrap gap-4 items-center justify-between p-3.5 rounded-xl glass-panel border border-white/5 bg-black/30">
            <div className="flex gap-3">
              {!isSessionRunning ? (
                <button
                  onClick={handleStartSession}
                  className="flex items-center gap-2 px-4 py-2 rounded bg-green-500 hover:bg-green-400 text-black font-orbitron font-extrabold text-[10px] tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,255,102,0.3)] cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  INITIALIZE TELEMETRY
                </button>
              ) : (
                <button
                  onClick={handleStopSession}
                  className="flex items-center gap-2 px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-orbitron font-extrabold text-[10px] tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.2)] cursor-pointer animate-pulse"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  HALT PIPELINE
                </button>
              )}

              {/* Secure Optical Cam Killswitch */}
              <button
                onClick={() => { 
                  playClick(); 
                  setIsCameraOn(!isCameraOn); 
                  if (!isCameraOn) setQuotaReached(false); // Clear quota warning when manually starting camera
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded font-orbitron font-extrabold text-[10px] tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${
                  isCameraOn 
                    ? 'border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white' 
                    : 'bg-green-950/40 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-black'
                }`}
              >
                {isCameraOn ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                {isCameraOn ? 'SHUTDOWN CAM' : 'ACTIVATE CAM'}
              </button>

              <button
                onClick={triggerVerdictReport}
                className="flex items-center gap-2 px-4 py-2 rounded hover:bg-green-500 hover:text-black border border-green-500/30 text-green-400 font-orbitron font-extrabold text-[10px] tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                GENERATE AUDIT REPORT
              </button>
            </div>
            
            <div className="flex items-center gap-2 font-mono text-[9px] text-gray-400">
              <span className={`w-1.5 h-1.5 rounded-full ${isSessionRunning ? 'bg-green-400 blink' : 'bg-gray-500'}`}></span>
              FEED: {isSessionRunning ? 'CAPTURING ACTIVE' : 'STANDBY'}
            </div>
          </div>

          {/* Q&A Guided Prompter HUD (Visible only when interview is active) */}
          {interviewStage.startsWith('ACTIVE_Q') && (
            <div className="flex flex-col gap-4 p-4 rounded-xl glass-panel border border-cyan-500/20 bg-black/40 shadow-[0_0_20px_rgba(34,211,238,0.1)] relative overflow-hidden">
              <div className="absolute inset-0 cyber-dots opacity-5 pointer-events-none"></div>

              {/* HUD Header */}
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                  <span className="font-orbitron font-black text-[10px] text-cyan-400 tracking-wider uppercase">
                    INTERVIEW ACTIVE // QUESTION 0{currentQuestionIndex + 1} OF 03
                  </span>
                </div>
                
                <div className="flex items-center gap-2 font-mono text-[9px]">
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded border ${
                    isListening ? 'border-green-500/30 text-green-400 bg-green-950/20 animate-pulse' : 'border-red-500/30 text-red-400 bg-red-950/20'
                  }`}>
                    {isListening ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-[ping_1.5s_infinite]"></span>
                        RECORDING ACTIVE
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        RECORDING PAUSED
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Question Monospace Box */}
              <div className="p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-lg">
                <p className="font-mono text-[11px] sm:text-xs text-white font-semibold leading-relaxed">
                  {questions[currentQuestionIndex]}
                </p>
              </div>

              {/* Real-time speech view */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[8px] font-mono text-gray-500 tracking-widest font-black uppercase">
                  <span>LIVE SPEECH TRANSCRIBER FEED</span>
                  {isListening && <span className="text-cyan-400 animate-pulse">TRANSCRIBING LIVE...</span>}
                </div>
                <div className="bg-black/80 rounded-lg border border-white/5 p-3 font-mono text-xs text-gray-300 leading-normal h-[75px] overflow-y-auto italic">
                  {transcripts[currentQuestionIndex] ? (
                    <span>
                      {transcripts[currentQuestionIndex].includes(' (transcribing...') ? (
                        <>
                          {transcripts[currentQuestionIndex].split(' (transcribing...')[0]}
                          <span className="text-cyan-400 font-bold not-italic">
                            {" " + transcripts[currentQuestionIndex].match(/\(transcribing\.\.\. ([^)]+)\)/)?.[1]}
                          </span>
                        </>
                      ) : (
                        transcripts[currentQuestionIndex]
                      )}
                    </span>
                  ) : (
                    <span className="text-gray-600 not-italic">
                      Waiting for voice input... Start speaking to record your answer for this question.
                    </span>
                  )}
                </div>
              </div>

              {/* HUD Controls */}
              <div className="flex justify-between items-center gap-3">
                <button
                  onClick={() => {
                    playClick();
                    stopSpeechRecognition();
                    setIsSessionRunning(false);
                    setInterviewStage('SETUP');
                    addTerminalLog('MOCK INTERVIEW SESSION RESET BY CANDIDATE', 'warning');
                  }}
                  className="px-4 py-2 rounded border border-red-500/20 text-red-400 font-orbitron font-extrabold text-[10px] tracking-wider hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                >
                  RESET INTERVIEW
                </button>

                <button
                  onClick={handleNextQuestion}
                  className="flex items-center gap-2 px-5 py-2.5 rounded bg-cyan-400 hover:bg-cyan-300 text-black font-orbitron font-black text-[10px] tracking-wider shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  {currentQuestionIndex === 2 ? 'SUBMIT MOCK INTERVIEW & SCORE' : 'SUBMIT ANSWER & NEXT QUESTION'}
                </button>
              </div>
            </div>
          )}

          {/* Active Warnings Console */}
          {activeWarning && (
            <div className="p-3.5 rounded-xl glass-panel-warning flex items-start gap-3 text-red-400 border border-red-500/20 relative overflow-hidden animate-pulse">
              <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-orbitron font-extrabold text-[9px] tracking-wider uppercase block">
                  SYSTEM EXCEPTION RAISED
                </span>
                <p className="font-mono text-[10px] leading-relaxed">
                  {activeWarning}
                </p>
              </div>
            </div>
          )}

          {/* Real-time Custom SVG Line Chart */}
          <AnalyticsChart history={history} />

        </div>

        {/* Right Column (5 units): Composure readout & insight feed */}
        <div className="lg:col-span-5 flex flex-col gap-5 w-full">
          
          {/* COMPOSURE READOUT CARD */}
          <div className="glass-panel rounded-2xl p-4 flex flex-col gap-4 relative overflow-hidden pulse-border">
            <div className="absolute inset-0 cyber-dots opacity-5 pointer-events-none"></div>

            <h2 className="font-orbitron font-bold text-xs tracking-wider text-green-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              COMPOSURE READOUT
            </h2>

            <div className="flex items-center gap-5 justify-center">
              
              {/* Radial Dial Indicator */}
              <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="rgba(0, 255, 102, 0.05)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="#00FF66"
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    style={{
                      filter: 'drop-shadow(0px 0px 6px #00FF66)'
                    }}
                  />
                </svg>
                
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-[7px] font-mono text-gray-500 tracking-wider">CONFIDENCE</span>
                  <span className="font-orbitron text-2xl font-black text-white glow-green">
                    {telemetry.confidence_score}%
                  </span>
                  <span className="text-[7px] font-mono text-green-400/80">{telemetry.emotion.toUpperCase()}</span>
                </div>
              </div>

              {/* Progress details */}
              <div className="flex-1 space-y-3.5">
                
                {/* Metric item: Focus */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-blue-400 flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      Attentiveness
                    </span>
                    <span className="font-bold text-white">{telemetry.attention_score}%</span>
                  </div>
                  <div className="w-full bg-gray-950 rounded-full h-1.5 overflow-hidden border border-white/5">
                    <div 
                      className="bg-blue-400 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_#60A5FA]" 
                      style={{ width: `${telemetry.attention_score}%` }}
                    ></div>
                  </div>
                </div>

                {/* Metric item: Eye contact */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-amber-400 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Gaze Alignment
                    </span>
                    <span className="font-bold text-white">{telemetry.eye_contact_score}%</span>
                  </div>
                  <div className="w-full bg-gray-950 rounded-full h-1.5 overflow-hidden border border-white/5">
                    <div 
                      className="bg-amber-400 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_#F59E0B]" 
                      style={{ width: `${telemetry.eye_contact_score}%` }}
                    ></div>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* AI INSIGHTS & SCROLLING TERMINAL */}
          <div className="glass-panel rounded-2xl p-4 flex flex-col gap-4 relative overflow-hidden pulse-border flex-1 min-h-[300px]">
            <div className="absolute inset-0 cyber-dots opacity-5 pointer-events-none"></div>

            <h2 className="font-orbitron font-bold text-xs tracking-wider text-green-400 flex items-center gap-1.5">
              <TerminalIcon className="w-3.5 h-3.5" />
              DIAGNOSTICS & INSIGHT FEED
            </h2>

            <div className="flex flex-col gap-3.5 h-full">
              
              {/* Highlight summary card at the top */}
              <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl font-mono text-[10px] leading-relaxed text-white">
                <span className="text-green-400 font-bold flex items-center gap-1.5 mb-1 text-[9px] tracking-wider uppercase font-orbitron">
                  <Sparkles className="w-3.5 h-3.5 text-green-400 animate-pulse" />
                  REAL-TIME INSIGHT BRIEFING
                </span>
                <p className="text-gray-300 leading-normal">
                  {telemetry.summary}
                </p>
              </div>

              {/* Dynamic scroll feed */}
              <div 
                ref={terminalContainerRef}
                className="bg-black/60 rounded-xl border border-white/5 p-3 font-mono text-[9px] leading-relaxed h-[115px] overflow-y-auto flex flex-col gap-1.5 text-gray-500"
              >
                {terminalLogs.map((log, idx) => {
                  let color = 'text-green-500/50';
                  if (log.type === 'error') color = 'text-red-500/70 font-bold';
                  if (log.type === 'warning') color = 'text-amber-500/70 font-semibold';
                  return (
                    <div key={idx} className="flex gap-2">
                      <span className="text-gray-600 flex-shrink-0">[{log.time}]</span>
                      <span className={`${color}`}>{log.text}</span>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* 4. MODAL: FINAL ASSESSMENT */}
      {showReport && (
        <FinalReportModal 
          history={history}
          onClose={() => {
            setShowReport(false);
            setInterviewStage('SETUP'); // Reset back to setup for another run!
          }}
          subject={subject}
          theme={theme}
          questions={questions}
          transcripts={transcripts}
          gradeReport={gradeReport}
        />
      )}

      {/* 5. MODAL: SETUP INTERVIEW */}
      {interviewStage === 'SETUP' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 overflow-hidden shadow-2xl flex flex-col gap-6 border border-green-500/20 pulse-border">
            <div className="absolute inset-0 cyber-dots opacity-5 pointer-events-none"></div>

            <div className="text-center space-y-2">
              <Brain className="w-10 h-10 text-green-400 mx-auto animate-pulse" />
              <h2 className="font-orbitron font-extrabold tracking-widest text-sm text-green-400 glow-green uppercase">
                STRUCTURED MOCK INTERVIEW
              </h2>
              <p className="font-mono text-[9px] text-gray-500 tracking-wider uppercase">
                CONFIGURE COGNITIVE GUARDIAN INTERACTIVE FLOW
              </p>
            </div>

            <div className="space-y-4 font-mono text-[10px] text-gray-300">
              {/* Subject Selection */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-500 tracking-wider uppercase block font-bold font-orbitron">
                  SELECT TARGET SUBJECT:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Frontend Engineering", "Backend Engineering", "System Design", "Product Management"].map((sub) => (
                    <button
                      key={sub}
                      onClick={() => { playClick(); setSubject(sub); }}
                      className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer font-bold ${
                        subject === sub 
                          ? 'border-green-500 text-green-400 bg-green-500/10 shadow-[0_0_8px_rgba(0,255,102,0.15)]' 
                          : 'border-white/5 bg-black/40 text-gray-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Selection */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-500 tracking-wider uppercase block font-bold font-orbitron">
                  SELECT INTERVIEW THEME:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["STAR Behavioral", "Technical Coding", "System Architecture", "Pressure Test"].map((thm) => (
                    <button
                      key={thm}
                      onClick={() => { playClick(); setTheme(thm); }}
                      className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer font-bold ${
                        theme === thm 
                          ? 'border-green-500 text-green-400 bg-green-500/10 shadow-[0_0_8px_rgba(0,255,102,0.15)]' 
                          : 'border-white/5 bg-black/40 text-gray-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      {thm}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={() => {
                playClick();
                playNextQuestionChirp();
                const selectedQs = QUESTIONS_LIBRARY[subject][theme];
                setQuestions(selectedQs);
                setTranscripts({ 0: '', 1: '', 2: '' });
                setCurrentQuestionIndex(0);
                setInterviewStage('ACTIVE_Q1');
                
                // Trigger telemetry sequence start
                handleStartSession();
                
                // Activate speech recognition
                setTimeout(() => {
                  startSpeechRecognition(0);
                }, 100);
              }}
              className="w-full py-3 rounded-lg bg-green-500 text-black font-orbitron font-black text-xs tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,255,102,0.4)] cursor-pointer animate-[pulse_2s_infinite]"
            >
              INITIALIZE NEURAL INTERVIEW
            </button>
          </div>
        </div>
      )}

      {/* 6. MODAL: GRADING LOADER */}
      {interviewStage === 'GRADING' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="text-center space-y-4">
            <Brain className="w-12 h-12 text-cyan-400 mx-auto animate-bounce" />
            <h2 className="font-orbitron font-extrabold text-sm text-cyan-400 tracking-widest glow-cyan uppercase">
              COMPILING COGNITIVE SCORES
            </h2>
            <p className="font-mono text-[9px] text-gray-500 max-w-xs mx-auto leading-relaxed">
              CROSS-REFERENCING WEB SPEECH TRANSCRIPTS WITH COMPOSTURE TELEMETRY VECTORS OVER SECURE DUAL-CLOUD NEURAL ENGINES...
            </p>
            <div className="w-40 h-1 bg-white/5 rounded-full mx-auto overflow-hidden">
              <div className="bg-cyan-400 h-full w-1/2 animate-[pulse_1.5s_infinite] rounded-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="text-center font-mono text-[9px] text-gray-600 py-2">
        AI INTERVIEW GUARDIAN // HACKATHON DEMO MODULE // GOOGLE GEMINI FLASH v2.5 INTEGRATED
      </footer>

    </div>
  );
}
