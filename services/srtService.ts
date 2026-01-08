
import { Caption } from '../types';

export interface SRTConfig {
  wordsPerLine: number;
  linesPerCaption: number;
  customStartTime?: number;
  customEndTime?: number;
}

export const generateSRT = (captions: Caption[], config: SRTConfig): string => {
  const formatSRTTime = (seconds: number): string => {
    const safeSeconds = Math.max(0, seconds);
    const date = new Date(0);
    date.setSeconds(safeSeconds);
    const ms = Math.floor((safeSeconds % 1) * 1000);
    const timeStr = date.toISOString().substr(11, 8);
    return `${timeStr},${ms.toString().padStart(3, '0')}`;
  };

  let srtContent = '';
  let index = 1;

  // Filter captions based on custom time range
  const filteredCaptions = captions.filter(caption => {
    const start = config.customStartTime ?? 0;
    const end = config.customEndTime ?? Infinity;
    // Include caption if it has any overlap with the selected range
    return caption.startTime < end && caption.endTime > start;
  });

  filteredCaptions.forEach((caption) => {
    let startTime = caption.startTime;
    let endTime = caption.endTime;

    // Clip timings to the selected range if necessary
    if (config.customStartTime !== undefined) {
      startTime = Math.max(startTime, config.customStartTime);
    }
    if (config.customEndTime !== undefined) {
      endTime = Math.min(endTime, config.customEndTime);
    }

    if (startTime >= endTime) return;

    const words = caption.text.split(/\s+/);
    const wordsPerBlock = config.wordsPerLine * config.linesPerCaption;
    
    if (words.length > wordsPerBlock) {
      const duration = endTime - startTime;
      const timePerWord = duration / words.length;

      for (let i = 0; i < words.length; i += wordsPerBlock) {
        const blockWords = words.slice(i, i + wordsPerBlock);
        const blockStartTime = startTime + (i * timePerWord);
        const blockEndTime = startTime + (Math.min(i + wordsPerBlock, words.length) * timePerWord);
        
        srtContent += `${index}\n`;
        srtContent += `${formatSRTTime(blockStartTime)} --> ${formatSRTTime(blockEndTime)}\n`;
        
        for (let j = 0; j < blockWords.length; j += config.wordsPerLine) {
          const lineWords = blockWords.slice(j, j + config.wordsPerLine);
          srtContent += `${lineWords.join(' ')}\n`;
        }
        srtContent += '\n';
        index++;
      }
    } else {
      srtContent += `${index}\n`;
      srtContent += `${formatSRTTime(startTime)} --> ${formatSRTTime(endTime)}\n`;
      
      for (let i = 0; i < words.length; i += config.wordsPerLine) {
        const lineWords = words.slice(i, i + config.wordsPerLine);
        srtContent += `${lineWords.join(' ')}\n`;
      }
      srtContent += '\n';
      index++;
    }
  });

  return srtContent;
};

export const downloadSRTFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.srt') ? filename : `${filename}.srt`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
