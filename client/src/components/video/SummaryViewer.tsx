import React from 'react';
import { Copy, Download, Sparkles, CheckCircle } from 'lucide-react';
import { VideoSummary, VideoMetadata } from '../../types/video';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

interface SummaryViewerProps {
  summary: VideoSummary;
  metadata: VideoMetadata;
  className?: string;
}

const SummaryViewer: React.FC<SummaryViewerProps> = ({
  summary,
  metadata,
  className = '',
}) => {
  const handleCopySummary = async () => {
    // Safely handle potentially undefined keyPoints
    const keyPointsSection = summary.keyPoints && summary.keyPoints.length > 0 
      ? `\n\nKey Points:\n${summary.keyPoints.map(point => `• ${point}`).join('\n')}`
      : '';
    
    const fullSummary = `${summary.summary}${keyPointsSection}`;
    
    try {
      await navigator.clipboard.writeText(fullSummary);
      toast.success('Summary copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy summary');
    }
  };

  const handleDownloadSummary = () => {
    // Safely handle potentially undefined keyPoints
    const keyPointsSection = summary.keyPoints && summary.keyPoints.length > 0
      ? `\n\nKey Points:\n${summary.keyPoints.map(point => `• ${point}`).join('\n')}`
      : '';
    
    const fullSummary = `Video Summary: ${metadata.title}\n\n${summary.summary}${keyPointsSection}\n\nGenerated on: ${new Date(summary.createdAt).toLocaleDateString()}`;
    
    const element = document.createElement('a');
    const file = new Blob([fullSummary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Summary downloaded!');
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 p-2 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                AI Summary
              </h3>
              <p className="text-sm text-gray-600 truncate max-w-md">
                {metadata.title}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopySummary}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadSummary}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Main Summary */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Summary</h4>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {summary.summary}
            </p>
          </div>
        </div>

        {/* Key Points */}
        {summary.keyPoints && summary.keyPoints.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Key Points</h4>
            <div className="space-y-2">
              {summary.keyPoints.map((point, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-primary-600" />
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Generated on {new Date(summary.createdAt).toLocaleDateString()}
            </span>
            <span>
              {summary.summary.split(' ').length} words
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryViewer;