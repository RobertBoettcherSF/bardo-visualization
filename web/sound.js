// Browser-only Sidpa wind and clicks. No audio files.
// The context is created on the Sound tap, never before.
let audio = null;
let windGain = null;
let soundOn = false;
const reducedSound = matchMedia("(prefers-reduced-motion: reduce)");

function soundEnabled() {
  return soundOn;
}

function ensureAudio() {
  if (audio) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  audio = new Ctx();
  const rate = audio.sampleRate;
  const buffer = audio.createBuffer(1, rate * 2, rate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const source = audio.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 240;
  windGain = audio.createGain();
  windGain.gain.value = 0;
  source.connect(filter);
  filter.connect(windGain);
  windGain.connect(audio.destination);
  source.start();
}

function setWind(active) {
  if (!windGain || !audio) return;
  const level = soundOn && active && !reducedSound.matches ? 0.028 : 0;
  windGain.gain.setTargetAtTime(level, audio.currentTime, 0.15);
}

function setSound(on) {
  soundOn = on;
  if (on) {
    ensureAudio();
    audio.resume();
  }
  setWind(false);
}

function playClick() {
  if (!soundOn || !audio || reducedSound.matches) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.value = 440;
  gain.gain.setValueAtTime(0.035, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.05);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.06);
}

reducedSound.addEventListener("change", function () {
  if (reducedSound.matches) setWind(false);
});
