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
  CameraOff
} from 'lucide-react';
import { playClick } from '../utils/audio';

export default function Dashboard() {
  const [isSessionRunning, setIsSessionRunning] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeWarning, setActiveWarning] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [quotaReached, setQuotaReached] = useState(false);
  const [currentApiSource, setCurrentApiSource] = useState('Google Gemini 2.5 Flash');

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
  const terminalEndRef = useRef(null);

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

  // Auto-scroll terminal logs to bottom ref
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
      const response = await fetch('http://localhost:5000/api/analyze', {
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
          eyeContact: result.eye_contact_score
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
                  : 'border-fuchsia-500/20 bg-fuchsia-950/20 text-fuchsia-400 shadow-[0_0_8px_rgba(240,73,244,0.1)] animate-pulse'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                currentApiSource.toLowerCase().includes('gemini') ? 'bg-blue-400' : currentApiSource.toLowerCase().includes('groq') ? 'bg-amber-400' : 'bg-fuchsia-400'
              }`} style={{
                boxShadow: currentApiSource.toLowerCase().includes('gemini') ? '0 0 6px #60A5FA' : currentApiSource.toLowerCase().includes('groq') ? '0 0 6px #F59E0B' : '0 0 6px #F049F4'
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

          {/* Action Trigger Buttons */}
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
              <div className="bg-black/60 rounded-xl border border-white/5 p-3 font-mono text-[9px] leading-relaxed h-[115px] overflow-y-auto flex flex-col gap-1.5 text-gray-500">
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
                {/* Scrolling baseline anchor */}
                <div ref={terminalEndRef} />
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* 4. MODAL: FINAL ASSESSMENT */}
      {showReport && (
        <FinalReportModal 
          history={history}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* FOOTER */}
      <footer className="text-center font-mono text-[9px] text-gray-600 py-2">
        AI INTERVIEW GUARDIAN // HACKATHON DEMO MODULE // GOOGLE GEMINI FLASH v2.5 INTEGRATED
      </footer>

    </div>
  );
}
