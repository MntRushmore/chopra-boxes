import { formatCode, parseCode } from "@/lib/codes";

/** KIT-3 → "KIT 03". Never the room name. */
export function spokenCode(code: string): string {
  const parsed = parseCode(code);
  if (!parsed) return code.replace("-", " ");
  return formatCode(parsed.room, parsed.n).replace("-", " ");
}

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext || (window as AudioWindow).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new Ctor();
  }
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

function tone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.14, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Short two-note ding. Must run from a user gesture on iOS. */
export function playDing() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    tone(ctx, 880, now, 0.11);
    tone(ctx, 1318.5, now + 0.08, 0.16);
  } catch {
    // packing still works without sound
  }
}

function pickVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | undefined {
  const voices = synth.getVoices();
  return (
    voices.find((voice) => voice.lang.startsWith("en") && voice.localService) ??
    voices.find((voice) => voice.lang.startsWith("en")) ??
    undefined
  );
}

/** Speak the Sharpie form. Safe to call if speech is missing or blocked. */
export function speakCode(code: string) {
  try {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(spokenCode(code));
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.lang = "en-US";
    const voice = pickVoice(synth);
    if (voice) utterance.voice = voice;
    synth.speak(utterance);
  } catch {
    // show the code on screen instead
  }
}

/** Ding, then speak. Call from the same tap that generates the code. */
export function announceCode(code: string) {
  playDing();
  speakCode(code);
}
