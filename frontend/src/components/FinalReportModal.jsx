import React, { useState } from 'react';
import { X, Award, ShieldAlert, CheckCircle2, FileText, Share2, CornerDownRight, Sparkles, Brain, Activity } from 'lucide-react';
import { playClick } from '../utils/audio';

export default function FinalReportModal({ 
  history = [], 
  onClose,
  subject = "Telemetry Calibration",
  theme = "Standard Practice",
  questions = [],
  transcripts = {},
  gradeReport = null
}) {
  const [activeTab, setActiveTab] = useState('telemetry');

  // Aggregate stats
  const count = history.length;
  const avgConfidence = count > 0 
    ? Math.round(history.reduce((acc, curr) => acc + (curr.confidence || 0), 0) / count) 
    : 0;
  const avgAttention = count > 0 
    ? Math.round(history.reduce((acc, curr) => acc + (curr.attention || 0), 0) / count) 
    : 0;
  const avgEyeContact = count > 0 
    ? Math.round(history.reduce((acc, curr) => acc + (curr.eyeContact || 0), 0) / count) 
    : 0;

  // Compute final score
  const finalScore = Math.round((avgConfidence + avgAttention + avgEyeContact) / 3);

  // Generate sci-fi verdict based on scores
  let verdictTitle = "CALIBRATION INSUFFICIENT";
  let verdictColor = "text-red-500 border-red-500/30 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]";
  let verdictDesc = "The candidate shows high variance or low attentiveness. Additional training sessions recommended.";

  if (finalScore >= 85) {
    verdictTitle = "CERTIFIED - EXCELLENT PERFORMANCE";
    verdictColor = "text-green-400 border-green-500/30 bg-green-950/20 shadow-[0_0_15px_rgba(0,255,102,0.15)]";
    verdictDesc = "Excellent presentation control. Demonstrates elite composure, continuous eye-contact, and active focus.";
  } else if (finalScore >= 70) {
    verdictTitle = "RECOMMENDED - STABLE TELEMETRY";
    verdictColor = "text-blue-400 border-blue-500/30 bg-blue-950/20 shadow-[0_0_15px_rgba(96,165,250,0.15)]";
    verdictDesc = "Candidate displays stable interview metrics. Focus is steady; slight adjustments in eye-contact consistency will maximize impact.";
  } else if (finalScore >= 50) {
    verdictTitle = "CALIBRATING - UNSTEADY BEHAVIOR";
    verdictColor = "text-amber-400 border-amber-500/30 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]";
    verdictDesc = "Unsteady telemetry recorded. Frequently looking away or showing high fatigue indicators. Recommended minor adjustments.";
  }

  // Compile strengths & feedback using the dynamic mathematical engine
  const strengths = [];
  const improvements = [];

  // Core Analytics Variables
  const eyeDips = history.filter(h => h.eyeContact < 60).length;
  const attentionDips = history.filter(h => h.attention < 60).length;
  const confidenceDips = history.filter(h => h.confidence < 60).length;

  // Trend Analysis (first half vs second half)
  const half = Math.floor(count / 2);
  const firstHalf = history.slice(0, half);
  const secondHalf = history.slice(half);

  const firstHalfAvg = half > 0 
    ? Math.round(firstHalf.reduce((acc, c) => acc + ((c.confidence || 0) + (c.attention || 0) + (c.eyeContact || 0)) / 3, 0) / half)
    : 0;
  const secondHalfAvg = (count - half) > 0
    ? Math.round(secondHalf.reduce((acc, c) => acc + ((c.confidence || 0) + (c.attention || 0) + (c.eyeContact || 0)) / 3, 0) / (count - half))
    : 0;

  const isImproving = secondHalfAvg > firstHalfAvg + 1;
  const isDeclining = secondHalfAvg < firstHalfAvg - 1;

  // Personalized multi-dimensional telemetry tracking
  const telemetryByQuestion = {};
  history.forEach(item => {
    const qIdx = item.questionIndex !== undefined ? item.questionIndex : 0;
    if (!telemetryByQuestion[qIdx]) {
      telemetryByQuestion[qIdx] = [];
    }
    telemetryByQuestion[qIdx].push(item);
  });

  const questionAverages = {};
  Object.keys(telemetryByQuestion).forEach(qIdx => {
    const items = telemetryByQuestion[qIdx];
    const avgConf = Math.round(items.reduce((s, curr) => s + (curr.confidence || 0), 0) / items.length);
    const avgAtt = Math.round(items.reduce((s, curr) => s + (curr.attention || 0), 0) / items.length);
    const avgEye = Math.round(items.reduce((s, curr) => s + (curr.eyeContact || 0), 0) / items.length);
    questionAverages[qIdx] = { avgConf, avgAtt, avgEye, count: items.length };
  });

  const highConfidenceQs = [];
  const lowConfidenceQs = [];
  const highAttentionQs = [];
  const lowAttentionQs = [];
  const highEyeContactQs = [];
  const lowEyeContactQs = [];

  Object.keys(questionAverages).forEach(qIdx => {
    const qNum = parseInt(qIdx) + 1;
    const { avgConf, avgAtt, avgEye } = questionAverages[qIdx];
    if (avgConf >= 75) highConfidenceQs.push(qNum);
    if (avgConf < 65) lowConfidenceQs.push(qNum);

    if (avgAtt >= 80) highAttentionQs.push(qNum);
    if (avgAtt < 70) lowAttentionQs.push(qNum);

    if (avgEye >= 75) highEyeContactQs.push(qNum);
    if (avgEye < 65) lowEyeContactQs.push(qNum);
  });

  // Strengths Logic
  if (highConfidenceQs.length > 0) {
    strengths.push(`Composure Benchmark: You demonstrated excellent postural stability and poise during Question${highConfidenceQs.length > 1 ? 's' : ''} ${highConfidenceQs.join(', ')} (averaging ${avgConfidence}% composure index).`);
  } else if (avgConfidence >= 70) {
    strengths.push(`Poise Stability: You maintained a steady presence with minimal posture leaning throughout the session.`);
  }

  if (highAttentionQs.length > 0) {
    strengths.push(`Focused Gaze: Your focus remained locked on the interface during Question${highAttentionQs.length > 1 ? 's' : ''} ${highAttentionQs.join(', ')} with minimal distraction triggers.`);
  } else if (avgAttention >= 75) {
    strengths.push(`Steady Attention: You kept your gaze anchored to the central display region for the majority of the interview.`);
  }

  if (highEyeContactQs.length > 0) {
    strengths.push(`Camera Alignment: You established great lens connection during Question${highEyeContactQs.length > 1 ? 's' : ''} ${highEyeContactQs.join(', ')}, simulating natural eye contact.`);
  } else if (avgEyeContact >= 70) {
    strengths.push(`Active Eye Contact: You kept looking up toward the camera, ensuring strong interpersonal connection.`);
  }

  // Growth areas Logic
  if (lowConfidenceQs.length > 0) {
    improvements.push(`Posture Shift Alert: We noticed posture shifts or composure dips during Question${lowConfidenceQs.length > 1 ? 's' : ''} ${lowConfidenceQs.join(', ')}. Sit upright and relax your shoulders.`);
  } else if (avgConfidence < 75) {
    improvements.push(`Steady Composure: Your posture shifted in ${confidenceDips} checks. Try to relax your shoulders and keep a steady stance.`);
  }

  if (lowAttentionQs.length > 0) {
    improvements.push(`Distraction Drifts: Gaze shifts away from the screen were noted during Question${lowAttentionQs.length > 1 ? 's' : ''} ${lowAttentionQs.join(', ')}. Try to minimize quick glances around the room.`);
  } else if (avgAttention < 80) {
    improvements.push(`Central Focus: We saw ${attentionDips} minor focus shifts. Avoid moving your head suddenly or scanning the room.`);
  }

  if (lowEyeContactQs.length > 0) {
    improvements.push(`Lens Re-anchoring: Eye contact dipped during Question${lowEyeContactQs.length > 1 ? 's' : ''} ${lowEyeContactQs.join(', ')}. Look directly into the camera lens when presenting your answers.`);
  } else if (avgEyeContact < 75) {
    improvements.push(`Lens Anchor: You looked away ${eyeDips} times. Focus on talking to the camera lens as if it were the interviewer.`);
  }

  if (strengths.length === 0) {
    strengths.push("Initial composure tracking calibration complete. Telemetry session logs saved.");
  }
  if (improvements.length === 0) {
    strengths.push("Perfect Composure Spectrum: Continue practicing this high level of posture and gaze stability.");
  }

  // Dynamic Coach Insights Paragraph Generation (Simple Language)
  let dynamicCoachInsights = "";
  if (count === 0) {
    dynamicCoachInsights = "Please start the camera and run a practice session first to see your personal coaching feedback here!";
  } else {
    let trendPhrase = "kept a very steady focus throughout the practice.";
    if (isImproving) {
      trendPhrase = `started a bit nervous but got much better and more confident in the second half of the session!`;
    } else if (isDeclining) {
      trendPhrase = `started strong but seemed to lose a bit of focus and look away more towards the end. Try to keep your energy up!`;
    }

    let lowestMetricName = "Confidence";
    let lowestMetricScore = avgConfidence;
    if (avgAttention < lowestMetricScore) {
      lowestMetricName = "Focus";
      lowestMetricScore = avgAttention;
    }
    if (avgEyeContact < lowestMetricScore) {
      lowestMetricName = "Eye Contact";
      lowestMetricScore = avgEyeContact;
    }

    let questionDetail = "";
    if (lowAttentionQs.length > 0 && lowestMetricName === "Focus") {
      questionDetail = `, especially during Question ${lowAttentionQs.join(', ')}`;
    } else if (lowEyeContactQs.length > 0 && lowestMetricName === "Eye Contact") {
      questionDetail = `, especially during Question ${lowEyeContactQs.join(', ')}`;
    } else if (lowConfidenceQs.length > 0 && lowestMetricName === "Confidence") {
      questionDetail = `, especially during Question ${lowConfidenceQs.join(', ')}`;
    }

    dynamicCoachInsights = `During this practice session, you ${trendPhrase} Your main area to work on is ${lowestMetricName} (which averaged ${lowestMetricScore}%)${questionDetail}. To improve, try taking a deep breath before speaking and keep your eyes locked on the camera lens. You are on the right track!`;
  }

  const handleClose = () => {
    playClick();
    onClose();
  };

  const selectTab = (tab) => {
    playClick();
    setActiveTab(tab);
  };

  const exportToWord = () => {
    playClick();
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>AI Interview Guardian Cognitive & Telemetry Report</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 40px; }
          h1 { color: #10B981; font-family: 'Segoe UI', Arial, sans-serif; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; font-size: 24px; text-transform: uppercase; margin-bottom: 15px; }
          h2 { color: #2563EB; font-family: 'Segoe UI', Arial, sans-serif; margin-top: 24px; font-size: 18px; border-bottom: 1px solid #F3F4F6; padding-bottom: 4px; }
          h3 { color: #4B5563; font-size: 14px; margin-top: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
          .score-box { background: #F3F4F6; border: 1px solid #E5E7EB; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
          .score-grid { display: table; width: 100%; margin-top: 12px; border-collapse: collapse; }
          .score-col { display: table-cell; width: 33.33%; padding: 12px; text-align: center; border: 1px solid #E5E7EB; background: #FFFFFF; }
          .score-val { font-size: 22px; font-weight: bold; }
          .critique-card { border: 1px solid #E5E7EB; border-radius: 8px; padding: 14px; margin-bottom: 16px; background: #FAFAFA; }
          .q-title { font-weight: bold; color: #1F2937; margin-bottom: 6px; font-size: 13px; }
          .transcript { font-style: italic; color: #4B5563; background: #F9FAFB; padding: 8px 12px; border-left: 3px solid #D1D5DB; margin: 8px 0; }
          .advice { background: #EFF6FF; color: #1E40AF; padding: 10px; border-radius: 6px; border: 1px solid #DBEAFE; margin-top: 8px; font-size: 11px; }
          .footer { font-size: 10px; color: #9CA3AF; text-align: center; margin-top: 40px; border-top: 1px solid #E5E7EB; padding-top: 12px; }
        </style>
      </head>
      <body>
        <h1>AI INTERVIEW GUARDIAN — COGNITIVE & TELEMETRY REPORT</h1>
        <p style="font-size: 12px; color: #6B7280; margin-bottom: 25px;">
          <strong>Target Subject:</strong> ${subject} | <strong>Question Theme:</strong> ${theme} | <strong>Status:</strong> Active Evaluation Complete
        </p>
        
        <div class="score-box">
          <strong style="font-size: 14px; text-transform: uppercase;">Overall System Verdict:</strong> 
          <span style="font-size: 18px; font-weight: bold; color: #8B5CF6; margin-left: 8px;">${finalTier}</span><br/>
          <p style="margin: 6px 0 0 0; font-size: 12px; color: #4B5563; font-style: italic;">"${finalTierDesc}"</p>
        </div>

        <h2>1. INTEGRATED PERFORMANCE MATRIX</h2>
        <p style="font-size: 12px; color: #4B5563;">Your grade is calculated strictly on a weighted combination of verbal responses (60% weight) and behavioral telemetry (40% weight).</p>
        
        <div class="score-grid">
          <div class="score-col">
            <span style="font-size: 9px; color: #6B7280; text-transform: uppercase; font-weight: bold;">Combined Synergy Score</span><br/>
            <span class="score-val" style="color: #D946EF;">${synergyScore}%</span>
          </div>
          <div class="score-col">
            <span style="font-size: 9px; color: #6B7280; text-transform: uppercase; font-weight: bold;">Technical Verbal Score</span><br/>
            <span class="score-val" style="color: #2563EB;">${verbalScore}%</span>
          </div>
          <div class="score-col">
            <span style="font-size: 9px; color: #6B7280; text-transform: uppercase; font-weight: bold;">Behavioral Telemetry</span><br/>
            <span class="score-val" style="color: #10B981;">${telemetryScore}%</span>
          </div>
        </div>

        <h2>2. BEHAVIORAL DIAGNOSTICS & POSTURE LOGS</h2>
        <ul>
          <li><strong>Poise & Posture Stability Index:</strong> ${avgConfidence}%</li>
          <li><strong>Camera Eye Anchoring Index:</strong> ${avgEyeContact}%</li>
          <li><strong>Attention Persistence Index:</strong> ${avgAttention}%</li>
        </ul>
        
        <h3>Key Strengths Identified</h3>
        <ul>
          ${strengths.map(s => `<li style="font-size: 12px; color: #1F2937; margin-bottom: 4px;">${s}</li>`).join('')}
        </ul>

        <h3>Recommended Development Areas</h3>
        <ul>
          ${improvements.map(i => `<li style="font-size: 12px; color: #1F2937; margin-bottom: 4px;">${i}</li>`).join('')}
        </ul>

        <p style="font-size: 12px; color: #1F2937; background: #F3F4F6; padding: 12px; border-radius: 6px; border: 1px solid #E5E7EB; margin-top: 15px;">
          <strong>Guardian Coach Insights:</strong> "${dynamicCoachInsights}"
        </p>

        <h2>3. Q&A VERBAL AUDIT & AI CRITIQUES</h2>
        ${questions.map((q, idx) => {
          const critiqueItem = gradeReport?.question_critiques?.find(item => item.question_id === (idx + 1)) || {};
          return `
            <div class="critique-card">
              <div class="q-title">QUESTION 0${idx + 1}: ${q}</div>
              <div style="font-size: 11px; color: #2563EB; font-weight: bold; margin-bottom: 8px;">Concept Grade: ${critiqueItem.technical_score || 0}%</div>
              <div class="transcript">Candidate Transcript: "${transcripts[idx] || 'No speech captured.'}"</div>
              <p style="font-size: 12px; color: #1F2937; margin: 8px 0;"><strong>Technical Critique:</strong> ${critiqueItem.critique || 'Critique unavailable.'}</p>
              ${critiqueItem.actionable_tip ? `<div class="advice"><strong>Actionable STAR Advice:</strong> ${critiqueItem.actionable_tip}</div>` : ''}
            </div>
          `;
        }).join('')}

        <div class="footer">
          REPORT SECURED & EXPORTED ON ${new Date().toLocaleString()} | SESSION ID: ${Math.random().toString(36).substring(2, 8).toUpperCase()}<br/>
          AI INTERVIEW GUARDIAN // SECURED NODE TELEMETRY COGNITION FEED
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_Interview_Guardian_Report_${subject.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Verbal score from actual LLM grades (averaged)
  const verbalScore = gradeReport && gradeReport.question_critiques && gradeReport.question_critiques.length > 0
    ? Math.round(gradeReport.question_critiques.reduce((s, curr) => s + (curr.technical_score || 0), 0) / gradeReport.question_critiques.length)
    : 0;

  // Telemetry score from session averages
  const telemetryScore = finalScore;

  // Combined Synergy score: 60% Verbal Grade + 40% Telemetry Metrics
  const synergyScore = gradeReport ? Math.round((verbalScore * 0.6) + (telemetryScore * 0.4)) : telemetryScore;

  // Tier determination from the Combined synergyScore
  let finalTier = "C-Tier";
  let finalTierColor = "text-amber-400 border-amber-500/30 bg-amber-950/20";
  let finalTierDesc = "Calibration ongoing. Focus on strengthening technical fundamentals and composure stability.";
  
  if (synergyScore >= 90) {
    finalTier = "S-Tier";
    finalTierColor = "text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-950/20 shadow-[0_0_20px_rgba(240,78,255,0.25)]";
    finalTierDesc = "Elite Composure and Master-level Technical articulation. Candidate stands out as a top-tier industry expert.";
  } else if (synergyScore >= 80) {
    finalTier = "A-Tier";
    finalTierColor = "text-green-400 border-green-500/30 bg-green-950/20 shadow-[0_0_15px_rgba(74,222,128,0.2)]";
    finalTierDesc = "Highly capable composure coupled with strong technical articulation. Minor refinements will maximize overall impact.";
  } else if (synergyScore >= 65) {
    finalTier = "B-Tier";
    finalTierColor = "text-cyan-400 border-cyan-500/30 bg-cyan-950/20 shadow-[0_0_15px_rgba(34,211,238,0.15)]";
    finalTierDesc = "Stable composure patterns. Verbal articulation is structured but needs deeper technical/conceptual reinforcement.";
  } else if (synergyScore >= 50) {
    finalTier = "C-Tier";
    finalTierColor = "text-amber-400 border-amber-500/30 bg-amber-950/20";
    finalTierDesc = "Moderate composure stability and verbal accuracy. Candidate is on the right track but requires additional preparation.";
  } else {
    finalTier = "D-Tier";
    finalTierColor = "text-red-500 border-red-500/30 bg-red-950/20";
    finalTierDesc = "Insufficient telemetry and verbal articulation recorded. Thorough technical review and mock practices are recommended.";
  }

  const displayTier = finalTier;
  const displayTierColor = finalTierColor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-3xl glass-panel rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] pulse-border">
        {/* Background Details */}
        <div className="absolute inset-0 cyber-dots opacity-5 pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-green-500/10 bg-black/40 z-10">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-400" />
            <h2 className="font-orbitron font-bold tracking-widest text-xs sm:text-sm text-green-400 glow-green">
              AI INTERVIEW GUARDIAN // COGNITIVE & TELEMETRY REPORT
            </h2>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 rounded bg-green-950/20 hover:bg-green-500 hover:text-black border border-green-500/20 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Holographic Tab Bar */}
        <div className="flex border-b border-white/5 bg-black/20 z-10 px-4 font-orbitron text-[9px] sm:text-[10px] tracking-wider font-semibold">
          <button
            onClick={() => selectTab('telemetry')}
            className={`flex items-center gap-2 py-3.5 px-4 border-b-2 transition-all cursor-pointer ${
              activeTab === 'telemetry' 
                ? 'border-green-400 text-green-400 bg-green-500/5' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            TELEMETRY DIAGNOSTICS
          </button>
          <button
            onClick={() => selectTab('verbal')}
            className={`flex items-center gap-2 py-3.5 px-4 border-b-2 transition-all cursor-pointer ${
              activeTab === 'verbal' 
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            Q&A VERBAL AUDIT
          </button>
          <button
            onClick={() => selectTab('overall')}
            className={`flex items-center gap-2 py-3.5 px-4 border-b-2 transition-all cursor-pointer ${
              activeTab === 'overall' 
                ? 'border-fuchsia-400 text-fuchsia-400 bg-fuchsia-500/5' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            OVERALL AUDIT
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 overflow-y-auto space-y-6 z-10 flex-1">
          
          {/* TAB 1: TELEMETRY DIAGNOSTICS */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              {/* Cyber Title Banner */}
              <div className={`p-4 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${verdictColor}`}>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono tracking-wider opacity-60">SYSTEM VERDICT // AUTH-RECORD</span>
                  <h3 className="font-orbitron font-extrabold text-sm tracking-wide flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    {verdictTitle}
                  </h3>
                  <p className="text-xs font-mono opacity-80 leading-relaxed max-w-md">
                    {verdictDesc}
                  </p>
                </div>
                
                {/* Massive Score Readout */}
                <div className="flex flex-col items-center justify-center border-l border-white/5 pl-4 min-w-[100px]">
                  <span className="text-[9px] font-mono tracking-wider opacity-50">VERDICT SCORE</span>
                  <span className="font-orbitron text-4xl font-black">{finalScore}</span>
                  <span className="text-[8px] font-mono opacity-60">AVG INDEX</span>
                </div>
              </div>

              {/* Telemetry Metrics Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Metric Card: Confidence */}
                <div className="glass-panel p-4 rounded-xl border border-white/5 bg-black/20 flex flex-col gap-2">
                  <span className="text-[10px] font-mono text-green-400 tracking-wider">CONFIDENCE</span>
                  <div className="flex justify-between items-end">
                    <span className="font-orbitron text-2xl font-bold">{avgConfidence}%</span>
                    <span className="text-[8px] font-mono text-gray-500">[ INDEX_C ]</span>
                  </div>
                  <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-green-400 h-full rounded-full" style={{ width: `${avgConfidence}%` }}></div>
                  </div>
                </div>

                {/* Metric Card: Focus */}
                <div className="glass-panel p-4 rounded-xl border border-white/5 bg-black/20 flex flex-col gap-2">
                  <span className="text-[10px] font-mono text-blue-400 tracking-wider">FOCUS LEVEL</span>
                  <div className="flex justify-between items-end">
                    <span className="font-orbitron text-2xl font-bold">{avgAttention}%</span>
                    <span className="text-[8px] font-mono text-gray-500">[ INDEX_A ]</span>
                  </div>
                  <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-400 h-full rounded-full" style={{ width: `${avgAttention}%` }}></div>
                  </div>
                </div>

                {/* Metric Card: Eye Contact */}
                <div className="glass-panel p-4 rounded-xl border border-white/5 bg-black/20 flex flex-col gap-2">
                  <span className="text-[10px] font-mono text-amber-400 tracking-wider">EYE CONTACT</span>
                  <div className="flex justify-between items-end">
                    <span className="font-orbitron text-2xl font-bold">{avgEyeContact}%</span>
                    <span className="text-[8px] font-mono text-gray-500">[ INDEX_E ]</span>
                  </div>
                  <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: `${avgEyeContact}%` }}></div>
                  </div>
                </div>

              </div>

              {/* Assessment Logs */}
              <div className="space-y-4">
                {/* Strengths Card */}
                {strengths.length > 0 && (
                  <div className="p-4 rounded-xl border border-green-500/10 bg-green-950/5 space-y-2">
                    <h4 className="font-orbitron text-xs text-green-400 tracking-wider font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      KEY STRENGTHS IDENTIFIED
                    </h4>
                    <ul className="space-y-1.5 text-xs font-mono text-gray-300">
                      {strengths.map((str, idx) => (
                        <li key={idx} className="flex gap-2 items-start leading-relaxed">
                          <CornerDownRight className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Growth Areas Card */}
                {improvements.length > 0 && (
                  <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-950/5 space-y-2">
                    <h4 className="font-orbitron text-xs text-amber-400 tracking-wider font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      RECOMMENDED DEVELOPMENT AREAS
                    </h4>
                    <ul className="space-y-1.5 text-xs font-mono text-gray-300">
                      {improvements.map((imp, idx) => (
                        <li key={idx} className="flex gap-2 items-start leading-relaxed">
                          <CornerDownRight className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Strategic advice */}
              <div className="p-4 rounded-xl border border-white/5 bg-black/40 font-mono text-xs text-gray-400 leading-relaxed relative">
                <span className="text-[8px] uppercase absolute -top-2 left-3 bg-[#080d1c] px-1 text-green-400 tracking-widest font-bold">
                  Guardian Coach Insights
                </span>
                "{dynamicCoachInsights}"
              </div>
            </div>
          )}

          {/* TAB 2: Q&A VERBAL AUDIT */}
          {activeTab === 'verbal' && (
            <div className="space-y-5">
              
              {/* Interview Metadata Card */}
              <div className="p-4 rounded-xl bg-cyan-950/10 border border-cyan-500/10 font-mono text-xs leading-relaxed text-gray-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500 uppercase text-[9px]">INTERVIEW SUBJECT:</span>
                    <p className="text-cyan-400 font-bold uppercase tracking-wider mt-0.5">{subject}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 uppercase text-[9px]">QUESTION SCHEME / THEME:</span>
                    <p className="text-cyan-400 font-bold uppercase tracking-wider mt-0.5">{theme}</p>
                  </div>
                </div>
              </div>

              {/* Verify if structured Q&A data exists */}
              {!gradeReport || questions.length === 0 ? (
                <div className="p-8 text-center glass-panel border-dashed border border-white/10 rounded-xl space-y-3">
                  <Brain className="w-8 h-8 text-cyan-400/50 mx-auto animate-pulse" />
                  <p className="font-mono text-xs text-gray-400 max-w-sm mx-auto">
                    Q&A Verbal Audit is locked. To generate structured Technical and STAR grading critiques, select a subject and theme, complete all 3 Mock Interview questions, and submit your voice transcriptions for evaluation.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((q, idx) => {
                    const critiqueItem = gradeReport.question_critiques?.find(item => item.question_id === (idx + 1)) || {};
                    const score = critiqueItem.technical_score || 0;
                    
                    let scoreColor = "text-red-400";
                    let scoreBg = "bg-red-950/20 border-red-500/20";
                    if (score >= 85) {
                      scoreColor = "text-green-400";
                      scoreBg = "bg-green-950/20 border-green-500/20";
                    } else if (score >= 70) {
                      scoreColor = "text-cyan-400";
                      scoreBg = "bg-cyan-950/20 border-cyan-500/20";
                    } else if (score >= 50) {
                      scoreColor = "text-amber-400";
                      scoreBg = "bg-amber-950/20 border-amber-500/20";
                    }

                    return (
                      <div key={idx} className="glass-panel border border-white/5 rounded-xl overflow-hidden flex flex-col">
                        {/* Question bar */}
                        <div className="bg-black/40 px-4 py-3 border-b border-white/5 flex items-center justify-between gap-4">
                          <span className="font-orbitron text-[9px] font-black text-cyan-400 tracking-wider flex-shrink-0 uppercase">
                            QUESTION 0{idx + 1}
                          </span>
                          <p className="font-mono text-xs text-white flex-1 font-semibold truncate">
                            {q}
                          </p>
                          <div className={`px-2.5 py-0.5 rounded text-[10px] font-orbitron font-bold border flex items-center gap-1 ${scoreBg} ${scoreColor}`}>
                            <span>{score}%</span>
                            <span className="text-[8px] text-gray-500">GRADE</span>
                          </div>
                        </div>

                        {/* Transcript & Response Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
                          {/* Transcribed Candidate Speech */}
                          <div className="p-4 space-y-1.5">
                            <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest font-black">CANDIDATE TRANSCRIBED TRANSCRIPT</span>
                            <p className="font-mono text-xs text-gray-300 leading-normal bg-black/20 p-2.5 rounded-lg border border-white/5 h-[80px] overflow-y-auto italic">
                              "{transcripts[idx] || "No voice answer was recorded for this question."}"
                            </p>
                          </div>

                          {/* AI STAR Critique */}
                          <div className="p-4 space-y-3">
                            <div className="space-y-1">
                              <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest font-black">AI TECHNICAL & CONCEPTUAL CRITIQUE</span>
                              <p className="font-mono text-xs text-gray-300 leading-normal">
                                {critiqueItem.critique || "Critique unavailable."}
                              </p>
                            </div>

                            {critiqueItem.actionable_tip && (
                              <div className="p-2.5 rounded bg-cyan-950/20 border border-cyan-500/10 font-mono text-[10px] text-cyan-300 leading-relaxed">
                                <span className="font-bold font-orbitron tracking-wider text-[8px] uppercase text-cyan-400 block mb-0.5">ACTIONABLE STAR ADVICE</span>
                                {critiqueItem.actionable_tip}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: OVERALL AUDIT */}
          {activeTab === 'overall' && (
            <div className="space-y-6">
              {/* Dynamic Synergy Verdict Card */}
              <div className={`p-5 border rounded-xl flex flex-col md:flex-row items-center gap-6 ${finalTierColor}`}>
                
                {/* Big Glowing Tier Badge */}
                <div className="flex flex-col items-center justify-center p-6 border border-white/10 rounded-2xl bg-black/40 min-w-[150px] shadow-inner text-center">
                  <span className="text-[8px] font-mono tracking-widest opacity-60 uppercase">GUARDIAN VERDICT</span>
                  <span className="font-orbitron text-5xl font-black tracking-tighter my-2 animate-pulse">{finalTier}</span>
                  <div className="px-2 py-0.5 rounded text-[8px] font-mono bg-white/5 border border-white/10 text-white/80">
                    SYNERGY INDEX: {synergyScore}%
                  </div>
                </div>

                {/* Verdict Description */}
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <span className="text-[9px] font-mono tracking-wider opacity-60">SYSTEM RECOGNITION MATCH // ACTIVE GRADERS</span>
                  <h3 className="font-orbitron font-bold text-base text-white tracking-wide">
                    {finalTier === 'S-Tier' ? 'ELITE GUARDIAN CERTIFICATION' : 
                     finalTier === 'A-Tier' ? 'RECOMMENDED COGNITIVE PROFILE' : 
                     finalTier === 'B-Tier' ? 'CAPABLE TELEMETRY BASELINE' : 
                     finalTier === 'C-Tier' ? 'DEVELOPING INTERVIEW PROFILE' : 'CRITICAL ADJUSTMENTS REQUIRED'}
                  </h3>
                  <p className="text-xs font-mono opacity-90 leading-relaxed">
                    {finalTierDesc}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2 justify-center md:justify-start">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-white/5 border border-white/5 text-gray-400">
                      Verbal Index: {verbalScore}%
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-white/5 border border-white/5 text-gray-400">
                      Telemetry Index: {telemetryScore}%
                    </span>
                    {gradeReport && gradeReport.api_source && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-cyan-950/20 border border-cyan-500/20 text-cyan-400">
                        Source: {gradeReport.api_source}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Core Competency Split Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Communication competence */}
                <div className="glass-panel p-5 rounded-xl border border-white/5 bg-black/20 space-y-4">
                  <h4 className="font-orbitron text-xs text-cyan-400 tracking-wider font-bold uppercase flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Brain className="w-4 h-4" />
                    VERBAL COMMUNICATION MATRIX
                  </h4>
                  <div className="space-y-3 font-mono text-xs text-gray-300">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span>TECHNICAL CONCEPT DEPTH</span>
                        <span className="text-cyan-400 font-bold">{verbalScore}%</span>
                      </div>
                      <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${verbalScore}%` }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span>STAR STRUCTURAL ALIGNMENT</span>
                        <span className="text-cyan-400 font-bold">{gradeReport ? Math.min(100, Math.max(0, verbalScore + 5)) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${gradeReport ? Math.min(100, Math.max(0, verbalScore + 5)) : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] font-mono text-gray-400 leading-relaxed italic border-l-2 border-cyan-500/30 pl-2">
                    {gradeReport?.verbal_summary || "Verbal grading critique will display once mock questions are analyzed."}
                  </p>
                </div>

                {/* Behavioral competence */}
                <div className="glass-panel p-5 rounded-xl border border-white/5 bg-black/20 space-y-4">
                  <h4 className="font-orbitron text-xs text-green-400 tracking-wider font-bold uppercase flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Activity className="w-4 h-4" />
                    BEHAVIORAL DIAGNOSTIC MATRIX
                  </h4>
                  <div className="space-y-3 font-mono text-xs text-gray-300">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span>POISE & POSTURE STABILITY</span>
                        <span className="text-green-400 font-bold">{avgConfidence}%</span>
                      </div>
                      <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-green-400 h-full rounded-full" style={{ width: `${avgConfidence}%` }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span>CAMERA EYE ANCHORING</span>
                        <span className="text-green-400 font-bold">{avgEyeContact}%</span>
                      </div>
                      <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-green-400 h-full rounded-full" style={{ width: `${avgEyeContact}%` }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span>ATTENTION PERSISTENCE</span>
                        <span className="text-green-400 font-bold">{avgAttention}%</span>
                      </div>
                      <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-green-400 h-full rounded-full" style={{ width: `${avgAttention}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] font-mono text-gray-400 leading-relaxed italic border-l-2 border-green-500/30 pl-2">
                    {gradeReport?.composure_summary || "Telemetry metrics gathered from camera and analyzed via local face landmarks."}
                  </p>
                </div>
              </div>

              {/* Dynamic Overall Synergy Coach Advice */}
              <div className="p-4 rounded-xl border border-white/5 bg-black/40 font-mono text-xs text-gray-400 leading-relaxed relative">
                <span className="text-[8px] uppercase absolute -top-2 left-3 bg-[#080d1c] px-1 text-fuchsia-400 tracking-widest font-bold">
                  Overall Synthesis Report
                </span>
                {gradeReport ? (
                  `You maintained a steady telemetric presentation rating of ${telemetryScore}%, while your spoken answers received an average conceptual grade of ${verbalScore}%. This synergy gives you a combined score of ${synergyScore}%. ${
                    verbalScore > telemetryScore 
                      ? "Your technical understanding is highly developed, but we recommend matching it with more steady camera gaze anchoring and physical poise."
                      : "You project immense confidence and poise in front of the camera, but try to channel that composure into deeper conceptual accuracy and structured technical answers."
                  }`
                ) : (
                  "Complete all mock questions and submit transcripts to compile your comprehensive overall interview synergy rating."
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex justify-between items-center p-4 border-t border-green-500/10 bg-black/40 z-10 text-[10px] font-mono text-gray-500">
          <span>SESSIONS ID: {Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
          <div className="flex gap-3">
            <button 
              onClick={exportToWord}
              className="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-green-500 hover:text-black border border-green-500/20 text-green-400 transition-all font-bold cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              EXPORT REPORT
            </button>
            <button 
              onClick={handleClose}
              className="px-4 py-1.5 rounded bg-green-500 text-black font-orbitron font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,255,102,0.3)] hover:shadow-[0_0_25px_rgba(0,255,102,0.5)] cursor-pointer"
            >
              CLOSE AUDIT
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
