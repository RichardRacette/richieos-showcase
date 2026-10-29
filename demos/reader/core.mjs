const clamp=(value,low,high,fallback)=>Number.isFinite(value)?Math.min(high,Math.max(low,value)):fallback;
export function normalizeSettings(value) {
  const s = value && typeof value === 'object' ? value : {};
  return {
    quiet: s.quiet === true,
    narration: typeof s.narration === 'boolean' ? s.narration : true,
    sound: typeof s.sound === 'boolean' ? s.sound : true,
    music: typeof s.music === 'boolean' ? s.music : true,
    musicVolume: clamp(s.musicVolume, 0, 1, 0.22),
    effectsVolume: clamp(s.effectsVolume, 0, 1, 0.55),
    voiceSource: s.voiceSource === 'device' ? 'device' : 'storybook',
    reducedMotion: typeof s.reducedMotion === 'boolean' ? s.reducedMotion : false,
    rate: clamp(s.rate, 0.7, 1.1, 0.9),
    volume: clamp(s.volume, 0, 1, 0.8),
    voiceURI: typeof s.voiceURI === 'string' ? s.voiceURI : ''
  };
}

export function selectVoice(voices = [], preferred = '') {
  return voices.find(v => v.voiceURI === preferred)
    || voices.find(v => /^en[-_]US$/i.test(v.lang) && v.localService)
    || voices.find(v => /^en\b/i.test(v.lang) && v.localService)
    || voices.find(v => /^en\b/i.test(v.lang))
    || voices.find(v => v.default)
    || voices[0] || null;
}

export function isDeliberateTap(start, end, elapsed) {
  return !!start && !!end && elapsed >= 0 && elapsed < 800 && Math.hypot(end.x - start.x, end.y - start.y) < 14;
}
