import React from 'react';

export default function AnalyticsChart({ history = [] }) {
  // Ensure we always have at least a baseline array to draw coordinates
  const data = history.length > 0 ? history : [
    { confidence: 70, attention: 70, eyeContact: 70 },
    { confidence: 70, attention: 70, eyeContact: 70 }
  ];

  const maxPoints = 12; // Maximum historical checkpoints on screen
  const displayData = data.slice(-maxPoints);

  const width = 600;
  const height = 180;
  const padding = 20;

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Helper to map data index to X coordinate
  const getX = (index) => {
    if (displayData.length <= 1) return padding;
    return padding + (index / (displayData.length - 1)) * chartWidth;
  };

  // Helper to map score (0-100) to Y coordinate
  const getY = (score) => {
    return padding + chartHeight - (score / 100) * chartHeight;
  };

  // Create path strings for confidence, focus, eyeContact
  const createPath = (key) => {
    if (displayData.length === 0) return '';
    return displayData.reduce((acc, point, index) => {
      const x = getX(index);
      const y = getY(point[key] || 0);
      return acc + (index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, '');
  };

  // Create filled area path under the lines
  const createAreaPath = (key) => {
    if (displayData.length === 0) return '';
    const linePath = createPath(key);
    const startX = getX(0);
    const endX = getX(displayData.length - 1);
    const baseY = getY(0);
    return `${linePath} L ${endX} ${baseY} L ${startX} ${baseY} Z`;
  };

  const confidenceLine = createPath('confidence');
  const confidenceArea = createAreaPath('confidence');

  const attentionLine = createPath('attention');
  const attentionArea = createAreaPath('attention');

  const eyeContactLine = createPath('eyeContact');
  const eyeContactArea = createAreaPath('eyeContact');

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col flex-1 relative overflow-hidden pulse-border">
      {/* Background Dots */}
      <div className="absolute inset-0 cyber-dots opacity-10 pointer-events-none"></div>

      <div className="flex justify-between items-center mb-2 z-10">
        <h3 className="font-orbitron text-xs tracking-wider text-green-400 font-bold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 blink"></span>
          REAL-TIME BEHAVIORAL TELEMETRY
        </h3>
        <div className="flex gap-4 text-[10px] font-mono">
          <span className="flex items-center gap-1.5 text-green-400">
            <span className="w-2 h-0.5 bg-green-400 inline-block shadow-[0_0_5px_#00FF66]"></span>
            Confidence
          </span>
          <span className="flex items-center gap-1.5 text-blue-400">
            <span className="w-2 h-0.5 bg-blue-400 inline-block shadow-[0_0_5px_#60A5FA]"></span>
            Focus
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-0.5 bg-amber-400 inline-block shadow-[0_0_5px_#F59E0B]"></span>
            Eye Contact
          </span>
        </div>
      </div>

      <div className="relative flex-1 min-h-[140px] flex items-center justify-center">
        {history.length < 2 ? (
          <div className="text-center text-xs font-mono text-gray-500 z-10">
            [ CALIBRATING TELEMETRY CHART // AWAITING SNAPSHOTS ]
          </div>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <defs>
              {/* Gradients for Areas */}
              <linearGradient id="grad-conf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00FF66" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#00FF66" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="grad-att" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="grad-eye" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
              </linearGradient>

              {/* Filters for neon glow */}
              <filter id="glow-conf" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Grid Lines */}
            {[0, 25, 50, 75, 100].map((level) => {
              const y = getY(level);
              return (
                <g key={level}>
                  <line 
                    x1={padding} 
                    y1={y} 
                    x2={width - padding} 
                    y2={y} 
                    stroke="rgba(0, 255, 102, 0.05)" 
                    strokeWidth="1" 
                    strokeDasharray="4 4"
                  />
                  <text 
                    x={padding - 5} 
                    y={y + 3} 
                    fill="rgba(0, 255, 102, 0.3)" 
                    fontSize="7" 
                    className="font-mono text-right"
                    textAnchor="end"
                  >
                    {level}
                  </text>
                </g>
              );
            })}

            {/* Vertical divisions */}
            {displayData.map((_, idx) => {
              const x = getX(idx);
              return (
                <line
                  key={idx}
                  x1={x}
                  y1={padding}
                  x2={x}
                  y2={height - padding}
                  stroke="rgba(0, 255, 102, 0.03)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Area Fills */}
            <path d={confidenceArea} fill="url(#grad-conf)" />
            <path d={attentionArea} fill="url(#grad-att)" />
            <path d={eyeContactArea} fill="url(#grad-eye)" />

            {/* Lines with Neon Glow filters */}
            <path 
              d={confidenceLine} 
              fill="none" 
              stroke="#00FF66" 
              strokeWidth="2" 
              filter="url(#glow-conf)"
            />
            <path 
              d={attentionLine} 
              fill="none" 
              stroke="#60A5FA" 
              strokeWidth="1.5" 
            />
            <path 
              d={eyeContactLine} 
              fill="none" 
              stroke="#F59E0B" 
              strokeWidth="1.5" 
            />

            {/* Dynamic data dot indicators at final indexes */}
            {displayData.length > 0 && (
              <>
                <circle 
                  cx={getX(displayData.length - 1)} 
                  cy={getY(displayData[displayData.length - 1].confidence || 0)} 
                  r="4" 
                  fill="#00FF66" 
                  stroke="#030712" 
                  strokeWidth="1.5"
                  className="shadow-lg"
                />
                <circle 
                  cx={getX(displayData.length - 1)} 
                  cy={getY(displayData[displayData.length - 1].attention || 0)} 
                  r="4" 
                  fill="#60A5FA" 
                  stroke="#030712" 
                  strokeWidth="1.5"
                />
                <circle 
                  cx={getX(displayData.length - 1)} 
                  cy={getY(displayData[displayData.length - 1].eyeContact || 0)} 
                  r="4" 
                  fill="#F59E0B" 
                  stroke="#030712" 
                  strokeWidth="1.5"
                />
              </>
            )}
          </svg>
        )}
      </div>
      
      {/* Footer telemetric timestamp */}
      <div className="flex justify-between items-center text-[8px] font-mono text-gray-500 mt-1">
        <span>SWEEP RATE: 3000MS</span>
        <span>INDEX REF: {(history.length - 1) >= 0 ? `FRAME_ID_${history.length - 1}` : 'N/A'}</span>
      </div>
    </div>
  );
}
