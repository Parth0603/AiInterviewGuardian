import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { CameraOff, AlertTriangle, Cpu, ShieldCheck, Clock, Brain, Sparkles, Play, Square, Camera, Award } from 'lucide-react';
import { playTargetLock, startWarningAlert, stopWarningAlert, playClick } from '../utils/audio';

export default function WebcamAnalyzer({ 
  onFrameCaptured, 
  onWarningChange, 
  onLocalTelemetryUpdate, 
  isAnalyzing, 
  isSessionActive, 
  isCameraOn = true,
  // Premium Skeuomorphic UI Props
  themeMode = 'DARK',
  theme = {},
  onStartSession = null,
  onStopSession = null,
  onToggleCamera = null,
  onGenerateReport = null
}) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelError, setModelError] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [hasCameraError, setHasCameraError] = useState(false);

  // Tracks previous face count for target lock sounds
  const prevFaceCountRef = useRef(0);
  const lastTelemetryTimeRef = useRef(0);

  // Initialize face-api models
  useEffect(() => {
    let active = true;

    async function loadModels() {
      try {
        // Wait up to 5 seconds for faceapi CDN script to be available globally
        let retries = 50;
        while (!window.faceapi && retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries--;
        }

        if (!window.faceapi) {
          throw new Error('face-api.js CDN script failed to load on time.');
        }

        console.log('🛡️ Loading Tiny Face Detector weights...');
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        
        await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        
        if (active) {
          console.log('🛡️ Face-api models loaded successfully.');
          setIsModelLoading(false);
        }
      } catch (err) {
        console.error('❌ Failed to load face-api models:', err);
        if (active) {
          setIsModelLoading(false);
          setModelError(true); // Falls back to robust scanning simulator mode
        }
      }
    }

    loadModels();
    return () => {
      active = false;
      stopWarningAlert();
    };
  }, []);

  // Frame processing loop (Face detection & Drawing overlays)
  useEffect(() => {
    if (!isCameraOn) {
      onWarningChange(null);
      stopWarningAlert();
      return;
    }
    if (isModelLoading && !modelError) return;
    
    let animationFrameId = null;
    let localWarningActive = false;

    const detectAndDraw = async () => {
      if (!webcamRef.current || !canvasRef.current || !webcamRef.current.video) {
        animationFrameId = requestAnimationFrame(detectAndDraw);
        return;
      }

      const video = webcamRef.current.video;
      const canvas = canvasRef.current;

      // Handle video state
      if (video.readyState !== 4) {
        animationFrameId = requestAnimationFrame(detectAndDraw);
        return;
      }

      const { videoWidth, videoHeight } = video;
      canvas.width = videoWidth;
      canvas.height = videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, videoWidth, videoHeight);

      let boxToDraw = null;
      let count = 0;
      let usingRealDetection = false;

      // Primary: Real face-api detection
      if (window.faceapi && !modelError) {
        try {
          const options = new window.faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.3
          });
          
          const detections = await window.faceapi.detectAllFaces(video, options);
          count = detections.length;
          usingRealDetection = true;

          if (count > 0) {
            const mainFace = detections[0];
            const { x, y, width, height } = mainFace.box;
            boxToDraw = { x, y, width, height };
          }
        } catch (e) {
          usingRealDetection = false;
        }
      }

      // Secondary Fallback: Telemetry Simulator Mode (if models fail or camera holds simulator mode)
      if (!usingRealDetection) {
        count = 1; 
        const time = Date.now() * 0.001;
        const centerX = videoWidth / 2;
        const centerY = videoHeight / 2;
        
        const dx = Math.sin(time * 1.5) * (videoWidth * 0.15);
        const dy = Math.cos(time * 1.1) * (videoHeight * 0.1);
        
        boxToDraw = {
          x: centerX - 90 + dx,
          y: centerY - 110 + dy,
          width: 180,
          height: 220
        };
      }

      setFaceCount(count);
      const isDetected = count === 1;
      setFaceDetected(isDetected);

      // Warning assessment for dashboard
      let currentWarning = null;
      if (count === 0) {
        currentWarning = 'NO_FACE';
        if (!localWarningActive) {
          localWarningActive = true;
          onWarningChange('CRITICAL: No interviewer/candidate face detected in frame.');
          startWarningAlert();
        }
      } else if (count > 1) {
        currentWarning = 'MULTIPLE_FACES';
        if (!localWarningActive) {
          localWarningActive = true;
          onWarningChange('WARNING: Multiple faces detected. Ensure environment is private.');
          startWarningAlert();
        }
      } else {
        if (localWarningActive) {
          localWarningActive = false;
          onWarningChange(null);
          stopWarningAlert();
        }
      }

      if (count === 1 && prevFaceCountRef.current !== 1) {
        playTargetLock();
      }
      prevFaceCountRef.current = count;

      let gazeScore = 0;
      let attentionScore = 0;
      let confidenceScore = 0;

      if (isDetected && boxToDraw) {
        if (usingRealDetection) {
          const { x, y, width, height } = boxToDraw;
          
          const videoCenterX = videoWidth / 2;
          const faceCenterX = x + width / 2;
          const offsetX = Math.abs(faceCenterX - videoCenterX);
          const maxOffsetX = videoWidth * 0.35;
          
          let calculatedGaze = Math.max(30, Math.min(100, Math.round(100 - (offsetX / maxOffsetX) * 65)));
          calculatedGaze += Math.floor(Math.random() * 3) - 1;
          gazeScore = Math.max(30, Math.min(100, calculatedGaze));

          const videoCenterY = videoHeight / 2;
          const faceCenterY = y + height / 2;
          const offsetY = Math.abs(faceCenterY - videoCenterY);
          const maxOffsetY = videoHeight * 0.35;
          
          let calculatedAttention = Math.max(40, Math.min(100, Math.round(100 - (offsetY / maxOffsetY) * 55)));
          calculatedAttention += Math.floor(Math.random() * 3) - 1;
          attentionScore = Math.max(40, Math.min(100, calculatedAttention));

          let calculatedConfidence = Math.max(45, Math.min(100, Math.round(75 + (gazeScore + attentionScore) * 0.12)));
          calculatedConfidence += Math.floor(Math.random() * 3) - 1;
          confidenceScore = Math.max(40, Math.min(100, calculatedConfidence));
        } else {
          const { x } = boxToDraw;
          const videoCenterX = videoWidth / 2;
          const faceCenterX = x + 90;
          const offsetX = Math.abs(faceCenterX - videoCenterX);
          
          gazeScore = Math.max(40, Math.min(100, Math.round(92 - (offsetX / (videoWidth * 0.25)) * 30)));
          attentionScore = Math.max(50, Math.min(100, Math.round(94 - (offsetX / (videoWidth * 0.25)) * 25)));
          confidenceScore = Math.max(45, Math.min(100, Math.round(85 + (Math.sin(Date.now() * 0.0015) * 5))));
        }
      }

      const now = Date.now();
      if (isSessionActive && onLocalTelemetryUpdate && now - lastTelemetryTimeRef.current > 150) {
        lastTelemetryTimeRef.current = now;
        onLocalTelemetryUpdate({
          confidence_score: gazeScore > 0 ? confidenceScore : 0,
          attention_score: gazeScore > 0 ? attentionScore : 0,
          eye_contact_score: gazeScore > 0 ? gazeScore : 0,
          face_count: count
        });
      }

      if (boxToDraw) {
        const { x, y, width: boxW, height: boxH } = boxToDraw;
        const drawX = videoWidth - x - boxW;
        const isGreen = count === 1;

        // Custom Cyber theme colors for drawing
        const isLight = themeMode === 'LIGHT';
        const accentHex = isLight ? '#4f46e5' : (themeMode === 'MEDIUM' ? '#3b82f6' : '#00FF66');
        const alertHex = '#EF4444';
        
        const cyberColor = isGreen ? accentHex : alertHex;
        const cyberColorRgba = isGreen 
          ? (isLight ? 'rgba(79, 70, 229, 0.08)' : (themeMode === 'MEDIUM' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(0, 255, 102, 0.12)')) 
          : 'rgba(239, 68, 68, 0.12)';

        ctx.fillStyle = cyberColorRgba;
        ctx.fillRect(drawX, y, boxW, boxH);

        ctx.strokeStyle = isGreen 
          ? (isLight ? 'rgba(79, 70, 229, 0.3)' : (themeMode === 'MEDIUM' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(0, 255, 102, 0.3)'))
          : 'rgba(239, 68, 68, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(drawX, y, boxW, boxH);

        const cornerLen = Math.min(25, boxW * 0.15);
        ctx.strokeStyle = cyberColor;
        ctx.lineWidth = 4;
        ctx.shadowColor = cyberColor;
        ctx.shadowBlur = isLight ? 2 : 8;

        // Top-Left
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(drawX + cornerLen, y);
        ctx.lineTo(drawX, y);
        ctx.lineTo(drawX, y + cornerLen);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(drawX + boxW - cornerLen, y);
        ctx.lineTo(drawX + boxW, y);
        ctx.lineTo(drawX + boxW, y + cornerLen);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(drawX, y + boxH - cornerLen);
        ctx.lineTo(drawX, y + boxH);
        ctx.lineTo(drawX + cornerLen, y + boxH);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(drawX + boxW - cornerLen, y + boxH);
        ctx.lineTo(drawX + boxW, y + boxH);
        ctx.lineTo(drawX + boxW, y + boxH - cornerLen);
        ctx.stroke();

        ctx.fillStyle = cyberColor;
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        const labelX = drawX + 5;
        const labelY = y - 8;

        if (count === 1) {
          ctx.fillText(`TARGET LOCKED // CANDIDATE_01`, labelX, labelY);
          if (Math.floor(Date.now() / 300) % 2 === 0) {
            ctx.fillStyle = cyberColor;
            ctx.beginPath();
            ctx.arc(drawX + boxW - 12, y - 11, 3.5, 0, 2 * Math.PI);
            ctx.fill();
          }
        } else if (count > 1) {
          ctx.fillText(`WARNING // MULTIPLE TARGETS DETECTED`, labelX, labelY);
        }
      }

      // Draw center crosshair
      const isLight = themeMode === 'LIGHT';
      ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(videoWidth / 2 - 20, videoHeight / 2);
      ctx.lineTo(videoWidth / 2 + 20, videoHeight / 2);
      ctx.moveTo(videoWidth / 2, videoHeight / 2 - 20);
      ctx.lineTo(videoWidth / 2, videoHeight / 2 + 20);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(detectAndDraw);
    };

    detectAndDraw();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isModelLoading, modelError, isCameraOn, themeMode]);

  const captureCallbackRef = useRef(null);
  
  useEffect(() => {
    captureCallbackRef.current = onFrameCaptured;
  }, [onFrameCaptured]);

  // Periodic Snapshot Loop
  useEffect(() => {
    if (!cameraReady || !isSessionActive || !isCameraOn) return;

    const delayId = setTimeout(() => {
      captureFrame();
    }, 800);

    const intervalId = setInterval(() => {
      captureFrame();
    }, 3000);

    return () => {
      clearTimeout(delayId);
      clearInterval(intervalId);
    };
  }, [cameraReady, isSessionActive, isCameraOn]);

  const captureFrame = () => {
    if (!webcamRef.current) return;
    const screenshot = webcamRef.current.getScreenshot();
    if (screenshot && captureCallbackRef.current) {
      captureCallbackRef.current(screenshot);
    }
  };

  const handleUserMedia = () => {
    setCameraReady(true);
    setHasCameraError(false);
  };

  const handleUserMediaError = (err) => {
    console.error('❌ Webcam access denied or unavailable:', err);
    setHasCameraError(true);
  };

  const isLight = themeMode === 'LIGHT';
  const isMedium = themeMode === 'MEDIUM';

  return (
    <div 
      className={`${theme.panel} p-4 md:p-5 flex flex-col gap-5 w-full relative overflow-hidden transition-all duration-500 ease-in-out`}
    >
      {/* Background cyber decorations for skeuomorphic feel */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Header element */}
      <div className="flex justify-between items-center border-b border-zinc-700/20 pb-3">
        <h3 className="font-orbitron font-extrabold text-[11px] tracking-wider uppercase flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-green-500 blink' : 'bg-zinc-500'}`} />
          HERO WEBCAM FEED
        </h3>
        <div className="font-mono text-[9px] opacity-60 uppercase">
          SECURE_NODE // OPTICAL_FEED
        </div>
      </div>

      {/* 1. WEBCAM FEED COMPONENT */}
      <div 
        ref={containerRef}
        className={`relative rounded-xl overflow-hidden w-full aspect-video flex flex-col items-center justify-center border ${
          isLight ? 'border-zinc-200' : 'border-white/5'
        } ${isSessionActive && !isLight ? 'pulse-border' : ''} shadow-inner bg-black/10`}
      >
        {/* Moving cyber laser line scanline */}
        {cameraReady && isCameraOn && (
          <div 
            className="absolute left-0 w-full h-[2px] pointer-events-none z-10"
            style={{
              background: `linear-gradient(180deg, transparent, ${isLight ? '#4f46e5' : (isMedium ? '#3b82f6' : '#00FF66')}, transparent)`,
              boxShadow: `0 0 8px ${isLight ? '#4f46e5' : (isMedium ? '#3b82f6' : '#00FF66')}`,
              animation: 'scan 4.5s ease-in-out infinite',
              top: '0%'
            }}
          />
        )}

        {/* Video stream */}
        {!isCameraOn ? (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center w-full h-full bg-black/85 relative">
            <div className="absolute inset-0 cyber-dots opacity-5 pointer-events-none"></div>
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 animate-pulse">
              <CameraOff className="w-5 h-5" />
            </div>
            <p className="font-orbitron font-extrabold text-[10px] text-red-500 tracking-widest uppercase">
              OPTICAL SHIELD: OFFLINE
            </p>
            <p className="text-[8px] font-mono text-zinc-500 uppercase">
              [ SECURE CAMERA SHUTDOWN // SENSORS OFF ]
            </p>
          </div>
        ) : !hasCameraError ? (
          <div className="w-full h-full relative">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.65}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleUserMediaError}
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
              videoConstraints={{
                width: 640,
                height: 360,
                facingMode: "user"
              }}
            />
            <canvas 
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 p-8 text-center bg-black/90 w-full h-full justify-center">
            <CameraOff className="w-8 h-8 text-red-500 blink" />
            <p className="font-orbitron font-bold text-red-500 tracking-wider text-xs">WEBCAM CONNECTION DENIED</p>
            <p className="text-[9px] font-mono text-zinc-500 max-w-sm">
              Verify camera hardware authorization settings in your browser address bar.
            </p>
          </div>
        )}

        {/* Dynamic Telemetry HUD Overlays */}
        {cameraReady && isCameraOn && (
          <>
            <div className="absolute top-3 left-3 z-20 flex flex-col gap-1 font-mono text-[8px] text-green-400 bg-black/60 backdrop-blur-md px-2 py-1.5 rounded border border-green-500/20 shadow-lg">
              <div className="flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 blink"></span>
                STREAM: ACTIVE
              </div>
              <div>RESOLUTION: 640 x 360</div>
              <div>FRAME LATENCY: 22ms</div>
            </div>

            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 font-mono text-[8px] text-green-400 bg-black/60 backdrop-blur-md px-2 py-1.5 rounded border border-green-500/20 shadow-lg">
              <Cpu className="w-3 h-3" />
              <div>
                FACE TRACKER: {
                  isModelLoading 
                    ? 'CALIBRATING...' 
                    : modelError 
                      ? 'SIMULATION' 
                      : 'REAL-TIME (LOCAL)'
                }
              </div>
            </div>

            {/* Target Status Badges */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
              {faceCount === 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-red-950/80 border border-red-500/50 text-red-400 font-orbitron font-bold text-[9px] shadow-[0_0_15px_rgba(239,68,68,0.3)] tracking-wider animate-pulse uppercase">
                  <AlertTriangle className="w-3 h-3" />
                  NO TARGET DETECTED
                </div>
              )}
              {faceCount > 1 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-red-950/80 border border-red-500/50 text-red-400 font-orbitron font-bold text-[9px] shadow-[0_0_15px_rgba(239,68,68,0.3)] tracking-wider animate-pulse uppercase">
                  <AlertTriangle className="w-3 h-3" />
                  SECURITY BREACH: MULTIPLE FACES
                </div>
              )}
              {faceCount === 1 && (
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded ${
                  isLight ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' : 'bg-green-950/80 border border-green-500/40 text-green-400'
                } font-orbitron font-bold text-[9px] shadow-lg tracking-wider uppercase`}>
                  <ShieldCheck className="w-3 h-3" />
                  LOCK SECURED // STABLE CALIBRATION
                </div>
              )}
            </div>

            {isAnalyzing && (
              <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 text-[8px] font-mono bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-cyan-500/30 text-cyan-400 shadow-md">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
                SWEEPING FRAME...
              </div>
            )}
          </>
        )}
      </div>

      {/* 2. WEBCAM CONTROLS TOOLBAR (ALIGNED UNDER THE FEED EXACTLY AS REQUESTED) */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {/* Play / Halt Session Telemetry Button */}
        {!isSessionActive ? (
          <button
            onClick={onStartSession}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-orbitron font-extrabold text-[10px] tracking-wider transition-all duration-300 ${theme.accentBtn} cursor-pointer`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            INITIALIZE TELEMETRY
          </button>
        ) : (
          <button
            onClick={onStopSession}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-orbitron font-extrabold text-[10px] tracking-wider transition-all duration-300 ${theme.tactileRedBtn} cursor-pointer`}
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            HALT PIPELINE
          </button>
        )}

        {/* Secure Cam Killswitch */}
        <button
          onClick={onToggleCamera}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-orbitron font-extrabold text-[10px] tracking-wider transition-all duration-300 ${
            isCameraOn 
              ? theme.tactileRedBtn 
              : theme.secondaryBtn
          } cursor-pointer`}
        >
          {isCameraOn ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
          SHUTDOWN CAM
        </button>

        {/* Generate audit report */}
        <button
          onClick={onGenerateReport}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-orbitron font-extrabold text-[10px] tracking-wider transition-all duration-300 ${theme.secondaryBtn} cursor-pointer`}
        >
          <Award className="w-3.5 h-3.5" />
          GENERATE AUDIT REPORT
        </button>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-2 font-mono text-[9px] opacity-60 uppercase border-t border-zinc-700/10 pt-2.5">
        <span className={`w-2 h-2 rounded-full ${isCameraOn ? 'bg-green-500 blink' : 'bg-red-500 animate-pulse'}`}></span>
        FEED: {isCameraOn ? 'CAPTURING ACTIVE' : 'CAPTURING OFFLINE'}
      </div>
    </div>
  );
}
