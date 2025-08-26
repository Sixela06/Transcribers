import React from 'react';
import { Clock, FileText, List, Timer } from 'lucide-react';

export type TranscriptDisplayStyle = 
  | 'timestamped-sentences' 
  | 'timestamped-paragraphs' 
  | 'timestamped-time-based'
  | 'plain-text-sentences'
  | 'plain-text-paragraphs';

interface TranscriptStyleSelectorProps {
  currentStyle: TranscriptDisplayStyle;
  onStyleChange: (style: TranscriptDisplayStyle) => void;
  className?: string;
}

const styleOptions = [
  {
    id: 'timestamped-sentences' as const,
    name: 'Timestamped Sentences',
    icon: Clock,
  },
  {
    id: 'timestamped-paragraphs' as const,
    name: 'Timestamped Paragraphs', 
    icon: Clock,
  },
  {
    id: 'timestamped-time-based' as const,
    name: 'Time-based Chunks',
    icon: Timer,
  },
  {
    id: 'plain-text-sentences' as const,
    name: 'Plain Text Sentences',
    icon: FileText,
  },
  {
    id: 'plain-text-paragraphs' as const,
    name: 'Plain Text Paragraphs',
    icon: FileText,
  },
];

const TranscriptStyleSelector: React.FC<TranscriptStyleSelectorProps> = ({
  currentStyle,
  onStyleChange,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="mb-3">
        <h3 className="text-sm font-medium text-gray-900 mb-1">
          Transcript Display Style
        </h3>
        <p className="text-xs text-gray-600">
          Choose how you want to view the transcript
        </p>
      </div>

      <div className="space-y-2">
        {styleOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = currentStyle === option.id;
          
          return (
            <label
              key={option.id}
              className={`
                flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                ${isSelected 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <input
                type="radio"
                name="transcript-style"
                value={option.id}
                checked={isSelected}
                onChange={(e) => onStyleChange(e.target.value as TranscriptDisplayStyle)}
                className="sr-only"
              />
              
              <div className="flex items-center">
                <Icon 
                  className={`h-4 w-4 mr-3 ${
                    isSelected ? 'text-primary-600' : 'text-gray-400'
                  }`}
                />
                
                <p className={`text-sm font-medium ${
                  isSelected ? 'text-primary-900' : 'text-gray-900'
                }`}>
                  {option.name}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default TranscriptStyleSelector;