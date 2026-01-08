
import { Caption } from '../types';

export interface SRTConfig {
  wordsPerLine: number;
  linesPerCaption: number;
  customStartTime?: number;
  customEndTime?: number;
}

/**
 * Generates a valid SRT file content string from an array of captions.
 * Supports splitting long captions into multiple time-stamped blocks
 * and multi-line formatting within those blocks.
 */
export const generateSRT = (captions: Caption[], config: SRTConfig): string => {
  const formatSRTTime = (seconds: number): string => {
    const safeSeconds = Math.max(0, seconds);
    const hrs = Math.floor(safeSeconds / 3600);
    const mins = Math.floor((safeSeconds % 3600) / 60);
    const secs = Math.floor(safeSeconds % 60);
    const ms = Math.floor((safeSeconds % 1) * 1000);

    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  };

  let srtContent = '';
  let index = 1;

  // Filter captions based on custom time range
  const filteredCaptions = captions
    .filter(caption => {
      const start = config.customStartTime ?? 0;
      const end = config.customEndTime ?? Infinity;
      return caption.startTime < end && caption.endTime > start;
    })
    .sort((a, b) => a.startTime - b.startTime);

  filteredCaptions.forEach((caption) => {
    let globalStart = caption.startTime;
    let globalEnd = caption.endTime;

    // Clip timings to the selected range if necessary
    if (config.customStartTime !== undefined) globalStart = Math.max(globalStart, config.customStartTime);
    if (config.customEndTime !== undefined) globalEnd = Math.min(globalEnd, config.customEndTime);

    if (globalStart >= globalEnd) return;

    const words = caption.text.trim().split(/\s+/);
    if (words.length === 0 || (words.length === 1 && words[0] === "")) return;

    const wordsPerBlock = config.wordsPerLine * config.linesPerCaption;
    const numBlocks = Math.ceil(words.length / wordsPerBlock);
    const duration = globalEnd - globalStart;
    const timePerWord = duration / words.length;

    for (let i = 0; i < numBlocks; i++) {
      const blockStartIndex = i * wordsPerBlock;
      const blockEndIndex = Math.min((i + 1) * wordsPerBlock, words.length);
      const blockWords = words.slice(blockStartIndex, blockEndIndex);

      // Proportionally distribute time based on word count
      const blockStartTime = globalStart + (blockStartIndex * timePerWord);
      const blockEndTime = globalStart + (blockEndIndex * timePerWord);

      srtContent += `${index}\n`;
      srtContent += `${formatSRTTime(blockStartTime)} --> ${formatSRTTime(blockEndTime)}\n`;

      // Structure lines within the block
      for (let j = 0; j < blockWords.length; j += config.wordsPerLine) {
        const lineWords = blockWords.slice(j, j + config.wordsPerLine);
        srtContent += `${lineWords.join(' ')}\n`;
      }
      
      srtContent += '\n'; // Blank line between blocks
      index++;
    }
  });

  return srtContent.trim() + '\n';
};

export const downloadSRTFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.toLowerCase().endsWith('.srt') ? filename : `${filename}.srt`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
