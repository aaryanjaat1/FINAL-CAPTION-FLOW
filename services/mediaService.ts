
export const extractAudioFromVideo = async (videoFile: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Decode the video file to get audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // We use a simplified approach to get a base64 of the audio.
        // For Gemini, we can send a WAV or simply the original file if it's small,
        // but for "out of memory" fix, sending a downsampled mono WAV is best.
        
        const wavBlob = audioBufferToWav(audioBuffer);
        const wavReader = new FileReader();
        wavReader.onload = () => {
          const base64 = (wavReader.result as string).split(',')[1];
          resolve({ base64, mimeType: 'audio/wav' });
        };
        wavReader.onerror = reject;
        wavReader.readAsDataURL(wavBlob);
        
        audioContext.close();
      } catch (err) {
        reject(new Error("Failed to extract audio: " + err));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(videoFile);
  });
};

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const result = flatten(buffer);
  const data = new DataView(new ArrayBuffer(44 + result.length * 2));
  
  /* RIFF identifier */
  writeString(data, 0, 'RIFF');
  /* file length */
  data.setUint32(4, 36 + result.length * 2, true);
  /* RIFF type */
  writeString(data, 8, 'WAVE');
  /* format chunk identifier */
  writeString(data, 12, 'fmt ');
  /* format chunk length */
  data.setUint32(16, 16, true);
  /* sample format (raw) */
  data.setUint16(20, format, true);
  /* channel count */
  data.setUint16(22, numChannels, true);
  /* sample rate */
  data.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  data.setUint32(28, sampleRate * numChannels * 2, true);
  /* block align (channel count * bytes per sample) */
  data.setUint16(32, numChannels * 2, true);
  /* bits per sample */
  data.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(data, 36, 'data');
  /* data chunk length */
  data.setUint32(40, result.length * 2, true);
  
  floatTo16BitPCM(data, 44, result);
  
  return new Blob([data], { type: 'audio/wav' });
}

function flatten(buffer: AudioBuffer): Float32Array {
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length * numChannels;
  const result = new Float32Array(length);
  const channels = [];
  
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  let offset = 0;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      result[offset++] = channels[channel][i];
    }
  }
  
  return result;
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(output: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    output.setUint8(offset + i, string.charCodeAt(i));
  }
}
