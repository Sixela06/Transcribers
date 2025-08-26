import { TranscriptSegment } from '../types/video';
import { TranscriptDisplayStyle } from '../components/video/TranscriptStyleSelector';

interface FormattedSegment {
  text: string;
  start?: number;
  duration?: number;
  showTimestamp: boolean;
}

/**
 * Format transcript segments based on the selected display style
 */
export function formatTranscriptByStyle(
  fullText: string,
  originalSegments: TranscriptSegment[],
  style: TranscriptDisplayStyle,
  wordsPerMinute: number = 150
): FormattedSegment[] {
  switch (style) {
    case 'timestamped-sentences':
      return generateTimestampedSentences(fullText, wordsPerMinute);
    
    case 'timestamped-paragraphs':
      return generateTimestampedParagraphs(fullText, wordsPerMinute);
    
    case 'timestamped-time-based':
      return generateTimeBasedSegments(fullText, wordsPerMinute, 15); // 15-second chunks
    
    case 'plain-text-sentences':
      return generatePlainTextSentences(fullText);
    
    case 'plain-text-paragraphs':
      return generatePlainTextParagraphs(fullText);
    
    default:
      return generateTimestampedSentences(fullText, wordsPerMinute);
  }
}

/**
 * Generate timestamped sentences
 */
function generateTimestampedSentences(
  content: string,
  wordsPerMinute: number
): FormattedSegment[] {
  const sentences = content
    .split(/[.!?]+/)
    .filter(sentence => sentence.trim().length > 0)
    .map(sentence => sentence.trim());

  let currentTime = 0;
  return sentences.map((sentence, index) => {
    const words = sentence.split(/\s+/).length;
    const duration = Math.max(2, (words / wordsPerMinute) * 60);
    const punctuation = index < sentences.length - 1 ? '.' : '';
    
    const segment = {
      text: sentence + punctuation,
      start: Math.round(currentTime * 100) / 100,
      duration: Math.round(duration * 100) / 100,
      showTimestamp: true,
    };
    
    currentTime += duration;
    return segment;
  });
}

/**
 * Generate timestamped paragraphs
 */
function generateTimestampedParagraphs(
  content: string,
  wordsPerMinute: number
): FormattedSegment[] {
  const paragraphs = content
    .split(/\n\s*\n|\r\n\s*\r\n/)
    .filter(para => para.trim().length > 0)
    .map(para => para.trim().replace(/\s+/g, ' '));

  // If no clear paragraphs, split by sentence groups
  if (paragraphs.length === 1) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentencesPerParagraph = Math.ceil(sentences.length / Math.max(1, Math.floor(sentences.length / 3)));
    
    const artificialParagraphs = [];
    for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
      const paragraphSentences = sentences.slice(i, i + sentencesPerParagraph);
      artificialParagraphs.push(paragraphSentences.join('. ') + '.');
    }
    
    return generateTimestampedParagraphsFromArray(artificialParagraphs, wordsPerMinute);
  }

  return generateTimestampedParagraphsFromArray(paragraphs, wordsPerMinute);
}

function generateTimestampedParagraphsFromArray(
  paragraphs: string[],
  wordsPerMinute: number
): FormattedSegment[] {
  let currentTime = 0;
  
  return paragraphs.map(paragraph => {
    const words = paragraph.split(/\s+/).length;
    const duration = Math.max(5, (words / wordsPerMinute) * 60);
    
    const segment = {
      text: paragraph,
      start: Math.round(currentTime * 100) / 100,
      duration: Math.round(duration * 100) / 100,
      showTimestamp: true,
    };
    
    currentTime += duration;
    return segment;
  });
}

/**
 * Generate time-based segments
 */
function generateTimeBasedSegments(
  content: string,
  wordsPerMinute: number,
  segmentDurationSeconds: number
): FormattedSegment[] {
  const words = content.split(/\s+/).filter(word => word.length > 0);
  const wordsPerSegment = Math.ceil((wordsPerMinute * segmentDurationSeconds) / 60);
  
  const segments = [];
  let currentTime = 0;
  
  for (let i = 0; i < words.length; i += wordsPerSegment) {
    const segmentWords = words.slice(i, i + wordsPerSegment);
    const text = segmentWords.join(' ');
    
    segments.push({
      text: text,
      start: Math.round(currentTime * 100) / 100,
      duration: segmentDurationSeconds,
      showTimestamp: true,
    });
    
    currentTime += segmentDurationSeconds;
  }
  
  return segments;
}

/**
 * Generate plain text sentences (no timestamps)
 */
function generatePlainTextSentences(content: string): FormattedSegment[] {
  const sentences = content
    .split(/[.!?]+/)
    .filter(sentence => sentence.trim().length > 0)
    .map(sentence => sentence.trim());

  return sentences.map((sentence, index) => ({
    text: sentence + (index < sentences.length - 1 ? '.' : ''),
    showTimestamp: false,
  }));
}

/**
 * Generate plain text paragraphs (no timestamps)
 */
function generatePlainTextParagraphs(content: string): FormattedSegment[] {
  let paragraphs = content
    .split(/\n\s*\n|\r\n\s*\r\n/)
    .filter(para => para.trim().length > 0)
    .map(para => para.trim().replace(/\s+/g, ' '));

  // If no clear paragraphs, create them from sentences
  if (paragraphs.length === 1) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentencesPerParagraph = Math.ceil(sentences.length / Math.max(1, Math.floor(sentences.length / 3)));
    
    paragraphs = [];
    for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
      const paragraphSentences = sentences.slice(i, i + sentencesPerParagraph);
      paragraphs.push(paragraphSentences.join('. ') + '.');
    }
  }

  return paragraphs.map(paragraph => ({
    text: paragraph,
    showTimestamp: false,
  }));
}

/**
 * Get formatted text for copy/download based on style
 */
export function getFormattedTextForExport(
  segments: FormattedSegment[],
  style: TranscriptDisplayStyle
): string {
  if (style.startsWith('plain-text')) {
    if (style === 'plain-text-paragraphs') {
      return segments.map(segment => segment.text).join('\n\n');
    } else {
      return segments.map(segment => segment.text).join(' ');
    }
  } else {
    // Timestamped formats
    return segments.map(segment => {
      const timestamp = formatDuration(segment.start || 0);
      return `${timestamp} ${segment.text}`;
    }).join('\n\n');
  }
}

/**
 * Format duration in MM:SS format
 */
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}