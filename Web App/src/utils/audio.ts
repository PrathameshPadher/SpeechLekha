export interface AudioVisualizerState {
  analyser: AnalyserNode | null;
  dataArray: any;
  audioContext: AudioContext | null;
  stream: MediaStream | null;
  isRealMic: boolean;
}

export async function initAudioCapture(): Promise<AudioVisualizerState> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.8;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    return {
      analyser,
      dataArray,
      audioContext,
      stream,
      isRealMic: true
    };
  } catch (err) {
    console.warn('Audio capture permission rejected or unavailable, falling back to dynamic audio synthesis.', err);
    return {
      analyser: null,
      dataArray: new Uint8Array(32),
      audioContext: null,
      stream: null,
      isRealMic: false
    };
  }
}

export function stopAudioCapture(state: AudioVisualizerState | null) {
  if (!state) return;
  try {
    if (state.stream) {
      state.stream.getTracks().forEach((track) => track.stop());
    }
    if (state.audioContext && state.audioContext.state !== 'closed') {
      state.audioContext.close();
    }
  } catch (e) {
    console.error('Error stopping audio tracks:', e);
  }
}

export const TRANSCRIPT_CHUNKS = [
  '“Photosynthesis converts light energy into chemical energy.',
  'It happens in two stages, the light-dependent reactions and the Calvin cycle.',
  'Chlorophyll absorbs red and blue light.',
  'Compare C3 and C4 plants and explain why C4 plants are more efficient in hot environments.',
  'C4 plants use PEP carboxylase and Kranz anatomy to eliminate photorespiration.”'
];
