// Web Audio API Sci-Fi Synthesizer
// Synthesizes premium holographic/cyber UI sounds programmatically to avoid asset loading failures

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a clean mechanical cyber UI click
 */
export function playClick() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);

    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    // Graceful failure if browser audio policies prevent immediate playback
  }
}

/**
 * Plays a high-pitched double cyber-chirp when a face is locked
 */
export function playTargetLock() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // First chirp
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.06);
    
    gain1.gain.setValueAtTime(0.04, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.06);
    
    // Second chirp slightly offset
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, now + 0.08); // C6
    osc2.frequency.exponentialRampToValueAtTime(2093, now + 0.14);
    
    gain2.gain.setValueAtTime(0.04, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc2.start(now + 0.08);
    osc2.stop(now + 0.14);
  } catch (e) {
    // Ignore context resume issues
  }
}

let warningInterval = null;

/**
 * Starts a repeating cyber alarming beep for warnings (e.g. face lost)
 */
export function startWarningAlert() {
  if (warningInterval) return;
  
  const playBeep = () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sawtooth';
      // sci-fi alarm filter
      const biquadFilter = ctx.createBiquadFilter();
      biquadFilter.type = 'lowpass';
      biquadFilter.frequency.setValueAtTime(800, now);
      
      osc.frequency.setValueAtTime(220, now); // Low Alarm Note
      osc.frequency.setValueAtTime(293.66, now + 0.15); // High Alarm Note
      
      gainNode.gain.setValueAtTime(0.06, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      osc.connect(biquadFilter);
      biquadFilter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      // Ignore
    }
  };

  playBeep(); // Play immediately
  warningInterval = setInterval(playBeep, 1200); // Pulse every 1.2s
}

/**
 * Stops the warning alert looping sound
 */
export function stopWarningAlert() {
  if (warningInterval) {
    clearInterval(warningInterval);
    warningInterval = null;
  }
}

/**
 * Plays a gorgeous dual-tone swipe chirp (600Hz to 950Hz) for Q&A card transitions
 */
export function playNextQuestionChirp() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.18);

    gainNode.gain.setValueAtTime(0.04, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  } catch (e) {
    // Ignore
  }
}

/**
 * Plays a layered cyber-chord chime celebrating the final report compilation
 */
export function playSystemReadyChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 (Cyber Major Chord)

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08); // Arpeggiated entry

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);

      gainNode.gain.setValueAtTime(0.03, now + idx * 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.65);
    });
  } catch (e) {
    // Ignore
  }
}

