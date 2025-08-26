import React, { useState, useMemo } from 'react';
import { Copy, Download, Search, Clock, Settings } from 'lucide-react';
import { VideoTranscript, VideoMetadata } from '../../types/video';
import { formatDuration } from '../../utils/youtube';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TranscriptStyleSelector, { TranscriptDisplayStyle } from './TranscriptStyleSelector';
import { formatTranscriptByStyle, getFormattedTextForExport } from '../../utils/transcriptFormatter';
import toast from 'react-hot-toast';

interface TranscriptViewerProps {
  transcript: VideoTranscript;
  metadata: VideoMetadata;
  className?: string;
}

const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  transcript,
  metadata,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedText, setHighlightedText] = useState('');
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [displayStyle, setDisplayStyle] = useState<TranscriptDisplayStyle>('plain-text-paragraphs');

  // Format segments based on selected style
  const formattedSegments = useMemo(() => {
    if (!transcript?.fullText) return [];
    
    return formatTranscriptByStyle(
      transcript.fullText,
      transcript.segments || [],
      displayStyle
    );
  }, [transcript, displayStyle]);

  // Get fullText from transcript or construct from segments
  const fullText = useMemo(() => {
    if (transcript?.fullText) {
      return transcript.fullText;
    }
    
    if (formattedSegments && formattedSegments.length > 0) {
      return formattedSegments.map(segment => segment.text).join(' ');
    }
    
    return 'No transcript available';
  }, [transcript, formattedSegments]);

  const handleCopyTranscript = async () => {
    try {
      const exportText = getFormattedTextForExport(formattedSegments, displayStyle);
      await navigator.clipboard.writeText(exportText);
      toast.success('Transcript copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy transcript');
    }
  };

  const handleDownloadTranscript = () => {
    const exportText = getFormattedTextForExport(formattedSegments, displayStyle);
    const element = document.createElement('a');
    const file = new Blob([exportText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcript.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Transcript downloaded!');
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setHighlightedText(term);
  };

  const highlightSearchTerm = (text: string) => {
    if (!highlightedText) return text;
    
    const regex = new RegExp(`(${highlightedText})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const filteredSegments = formattedSegments.filter(segment =>
    !searchTerm || segment.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!transcript) {
    return (
      <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
        <div className="p-6 text-center">
          <p className="text-gray-500">No transcript available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Video Transcript
            </h3>
            <p className="text-sm text-gray-600 truncate max-w-md">
              {metadata?.title || 'Untitled Video'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowStyleSelector(!showStyleSelector)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Style
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyTranscript}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadTranscript}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Style Selector */}
        {showStyleSelector && (
          <div className="mt-4">
            <TranscriptStyleSelector
              currentStyle={displayStyle}
              onStyleChange={(style) => {
                setDisplayStyle(style);
                setShowStyleSelector(false); // Close the selector
                toast.success(`Switched to ${style.replace('-', ' ')} format`);
              }}
            />
          </div>
        )}

        {/* Search */}
        <div className="mt-4">
          <Input
            type="text"
            placeholder="Search in transcript..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredSegments.length > 0 ? (
            displayStyle.startsWith('plain-text') ? (
              // Plain text format
              <div className="space-y-4">
                {filteredSegments.map((segment, index) => (
                  <div key={index} className="p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <p className="text-sm text-gray-900 leading-relaxed">
                      {highlightSearchTerm(segment.text)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              // Timestamped format
              <div className="space-y-4">
                {filteredSegments.map((segment, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDuration(segment.start || 0)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        {highlightSearchTerm(segment.text)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : searchTerm ? (
            <div className="text-center py-8">
              <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No matching segments found</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No transcript segments available</p>
            </div>
          )}
        </div>

        {/* Current Display Style Info */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Settings className="h-3 w-3 mr-1" />
              <span>Format: {displayStyle.replace('-', ' ')}</span>
            </div>
            <div className="text-right">
              <span>{filteredSegments.length} segments • {fullText.split(' ').length} words</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold text-primary-600">
                {filteredSegments.length}
              </p>
              <p className="text-xs text-gray-500">Segments</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-primary-600">
                {fullText.split(' ').length}
              </p>
              <p className="text-xs text-gray-500">Words</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-primary-600">
                {Math.ceil(fullText.length / 1000)}k
              </p>
              <p className="text-xs text-gray-500">Characters</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-primary-600">
                {displayStyle.startsWith('plain-text') ? '-' : formatDuration(
                  filteredSegments[filteredSegments.length - 1]?.start || 0
                )}
              </p>
              <p className="text-xs text-gray-500">Duration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptViewer;