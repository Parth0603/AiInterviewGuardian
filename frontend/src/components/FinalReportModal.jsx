import React from 'react';
import { X, Award, ShieldAlert, CheckCircle2, FileText, Share2, CornerDownRight } from 'lucide-react';
import { playClick } from '../utils/audio';

export default function FinalReportModal({ history = [], onClose }) {
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

  // 1. Dynamic Strengths Identification
  if (avgConfidence >= 75) {
    strengths.push(`Posture Composure: You sustained a solid confidence rating of ${avgConfidence}%, showing stable shoulder lines and steady alignment.`);
  }
  if (avgAttention >= 80) {
    strengths.push(`Focus Persistence: Excellent attentive gaze score (${avgAttention}%), indicating minimal visual distractions.`);
  }
  if (avgEyeContact >= 75) {
    strengths.push(`Direct Engagement: Elite camera lens contact index (${avgEyeContact}%), establishing strong virtual connection.`);
  }

  // 2. Dynamic Development Areas
  if (avgConfidence < 75) {
    let advice = `Posture Correction: Your confidence score dropped below the 60% threshold in ${confidenceDips} check intervals. Focus on sitting upright and aligning your face to the center guidelines.`;
    if (confidenceDips === 0) advice = `Face Alignment stability: Stabilize your posture and hold a calm, neutral facial expression to maximize composture ratings.`;
    improvements.push(advice);
  }
  if (avgAttention < 80) {
    let advice = `Attention Drift: We registered ${attentionDips} minor focus disruptions where your head shifted. Focus on minimizing peripheral checking or looking away from standard screen center bounds.`;
    if (attentionDips === 0) advice = `Avoid Off-Screen Drift: Keep your attention fixed forward on the screen center rather than scanning side boundaries.`;
    improvements.push(advice);
  }
  if (avgEyeContact < 75) {
    let advice = `Gaze Stabilization: We flagged ${eyeDips} instances of gaze departure. Maintain continuous lens anchor rather than looking down or reading distracting scripts.`;
    if (eyeDips === 0) advice = `Lens Anchor consistency: Hold your gaze steadily on the camera lens rather than scanning secondary display windows.`;
    improvements.push(advice);
  }

  // Backups if blank
  if (strengths.length === 0) {
    strengths.push("Initial composure tracking calibration complete. Telemetry session logs saved.");
  }
  if (improvements.length === 0) {
    strengths.push("Perfect Composure Spectrum: Continue practicing this high level of posture and gaze stability.");
  }

  // 3. Dynamic Coach Insights Paragraph Generation
  let dynamicCoachInsights = "";
  if (count === 0) {
    dynamicCoachInsights = "Session calibration incomplete. Please run active telemetry to compile real-time behavioral insights.";
  } else {
    let trendPhrase = "retained a steady focus level throughout the session.";
    if (isImproving) {
      trendPhrase = `showed a clear positive progression, with composure scores rising by ${secondHalfAvg - firstHalfAvg}% in the second half of the session as you acclimated.`;
    } else if (isDeclining) {
      trendPhrase = `exhibited minor performance fatigue, with telemetry indices dropping by ${firstHalfAvg - secondHalfAvg}% towards the latter half. Focus on sustaining postural focus during longer drills.`;
    }

    let lowestMetricName = "Confidence";
    let lowestMetricScore = avgConfidence;
    if (avgAttention < lowestMetricScore) {
      lowestMetricName = "Attentiveness";
      lowestMetricScore = avgAttention;
    }
    if (avgEyeContact < lowestMetricScore) {
      lowestMetricName = "Eye Gaze Alignment";
      lowestMetricScore = avgEyeContact;
    }

    dynamicCoachInsights = `Overall, during this ${count * 3}s session, the candidate ${trendPhrase} Your most prominent development priority lies in ${lowestMetricName} (averaging ${lowestMetricScore}%), which triggered ${lowestMetricScore < 60 ? 'critical warnings' : 'minor deviations'} in telemetry tracking. To maximize composure ratings, practice structured breathing intervals and anchor your gaze firmly on the optical lens.`;
  }

  const handleClose = () => {
    playClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] pulse-border">
        {/* Background Details */}
        <div className="absolute inset-0 cyber-dots opacity-5 pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-green-500/10 bg-black/40 z-10">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-400" />
            <h2 className="font-orbitron font-bold tracking-widest text-sm text-green-400 glow-green">
              AI SECURITY // ASSESSMENT RECORD
            </h2>
          </div>
          <button 
            onClick={handleClose}
            className="p-1 rounded bg-green-950/20 hover:bg-green-500 hover:text-black border border-green-500/20 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 z-10">
          
          {/* Cyber Title Banner */}
          <div className={`p-4 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${verdictColor}`}>
            <div className="space-y-1">
              <span className="text-[9px] font-mono tracking-wider opacity-60">SYSTEM VERDICT // AUTH-RECORD</span>
              <h3 className="font-orbitron font-extrabold text-base tracking-wide flex items-center gap-2">
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

        {/* Modal Footer */}
        <div className="flex justify-between items-center p-4 border-t border-green-500/10 bg-black/40 z-10 text-[10px] font-mono text-gray-500">
          <span>SESSIONS ID: {Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
          <div className="flex gap-3">
            <button 
              onClick={() => { playClick(); alert('Report successfully locked in database.'); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-green-500 hover:text-black border border-green-500/20 text-green-400 transition-all font-bold cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              EXPORT REPORT
            </button>
            <button 
              onClick={handleClose}
              className="px-4 py-1.5 rounded bg-green-500 text-black font-orbitron font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,255,102,0.3)] hover:shadow-[0_0_25px_rgba(0,255,102,0.5)] cursor-pointer"
            >
              CLOSE TELEMETRY
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
