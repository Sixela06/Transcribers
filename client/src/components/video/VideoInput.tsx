import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Youtube, FileText, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { youtubeUrlSchema } from '../../utils/validation';
import { isValidYouTubeUrl, extractVideoId } from '../../utils/youtube';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface VideoInputProps {
  onTranscribe: (url: string) => Promise<void>;
  onSummarize: (url: string) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

interface FormData {
  youtubeUrl: string;
}

const VideoInput: React.FC<VideoInputProps> = ({
  onTranscribe,
  onSummarize,
  loading = false,
  disabled = false,
  className = '',
}) => {
  const [processingMode, setProcessingMode] = useState<'transcribe' | 'summarize' | null>(null);
  const [urlPreview, setUrlPreview] = useState<{ videoId: string; isValid: boolean } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: yupResolver(youtubeUrlSchema),
    mode: 'onChange',
    defaultValues: {
      youtubeUrl: '',
    },
  });

  const youtubeUrl = watch('youtubeUrl');

  // Update URL preview when URL changes
  React.useEffect(() => {
    if (youtubeUrl && youtubeUrl.length > 10) {
      const videoId = extractVideoId(youtubeUrl);
      const isValidUrl = isValidYouTubeUrl(youtubeUrl);
      setUrlPreview({ videoId: videoId || '', isValid: isValidUrl });
    } else {
      setUrlPreview(null);
    }
  }, [youtubeUrl]);

  const handleTranscribe = async (data: FormData) => {
    if (!data.youtubeUrl.trim()) return;
    
    setProcessingMode('transcribe');
    try {
      await onTranscribe(data.youtubeUrl.trim());
    } catch (error) {
      console.error('Transcription failed:', error);
    } finally {
      setProcessingMode(null);
    }
  };

  const handleSummarize = async (data: FormData) => {
    if (!data.youtubeUrl.trim()) return;
    
    setProcessingMode('summarize');
    try {
      await onSummarize(data.youtubeUrl.trim());
    } catch (error) {
      console.error('Summarization failed:', error);
    } finally {
      setProcessingMode(null);
    }
  };

  const handleClear = () => {
    reset();
    setUrlPreview(null);
    setProcessingMode(null);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && isValidYouTubeUrl(text)) {
        setValue('youtubeUrl', text, { shouldValidate: true });
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  const isProcessing = loading || processingMode !== null;
  const showActions = urlPreview?.isValid && !isProcessing;

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary-100 p-3 rounded-full">
              <Youtube className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Extract Content from YouTube Videos
          </h2>
          <p className="text-gray-600">
            Paste a YouTube URL to get instant transcripts or AI-powered summaries
          </p>
        </div>

        {/* Input Form */}
        <div className="space-y-4">
          <div className="relative">
            <Input
              {...register('youtubeUrl')}
              type="url"
              placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              label="YouTube URL"
              error={errors.youtubeUrl?.message}
              icon={<Youtube className="h-4 w-4" />}
              disabled={disabled || isProcessing}
              className="pr-24"
            />
            
            {/* Paste Button */}
            <div className="absolute right-2 top-8">
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                disabled={disabled || isProcessing}
                className="px-3 py-1 text-xs text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Paste
              </button>
            </div>
          </div>

          {/* URL Preview */}
          {urlPreview && (
            <div className="mt-3">
              {urlPreview.isValid ? (
                <div className="flex items-center text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                  <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Valid YouTube URL detected</span>
                  {urlPreview.videoId && (
                    <span className="ml-2 text-green-500">({urlPreview.videoId})</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Please enter a valid YouTube URL</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                onClick={handleSubmit(handleTranscribe)}
                disabled={!isValid || disabled || isProcessing}
                loading={isProcessing && processingMode === 'transcribe'}
                variant="secondary"
                className="flex-1"
                size="lg"
              >
                <FileText className="h-4 w-4 mr-2" />
                {isProcessing && processingMode === 'transcribe' ? 'Transcribing...' : 'Get Transcript'}
              </Button>
              
              <Button
                type="button"
                onClick={handleSubmit(handleSummarize)}
                disabled={!isValid || disabled || isProcessing}
                loading={isProcessing && processingMode === 'summarize'}
                variant="primary"
                className="flex-1"
                size="lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isProcessing && processingMode === 'summarize' ? 'Summarizing...' : 'Summarize Video'}
              </Button>
            </div>
          )}

          {/* Clear Button */}
          {youtubeUrl && !isProcessing && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleClear}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear and start over
              </button>
            </div>
          )}
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <div className="mt-6 p-4 bg-primary-50 rounded-lg">
            <div className="flex items-center justify-center space-x-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-primary-700 text-sm font-medium">
                {processingMode === 'transcribe' 
                  ? 'Extracting transcript from video...' 
                  : 'Generating AI summary...'}
              </span>
            </div>
            <p className="text-center text-primary-600 text-xs mt-3">
              This may take a few moments depending on video length
            </p>
          </div>
        )}

        {/* Feature Information */}
        {!youtubeUrl && !isProcessing && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <FileText className="h-6 w-6 text-gray-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 mb-1">Free Transcription</h3>
              <p className="text-xs text-gray-600">
                Get accurate transcripts from any YouTube video. No limits, always free.
              </p>
            </div>
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 mb-1">AI Summaries</h3>
              <p className="text-xs text-gray-600">
                Get key insights and summaries powered by advanced AI. Login required.
              </p>
            </div>
          </div>
        )}

        {/* Supported Formats Info */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">
              Supported YouTube URL formats:
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
              <code className="bg-gray-100 px-2 py-1 rounded">youtube.com/watch?v=...</code>
              <code className="bg-gray-100 px-2 py-1 rounded">youtu.be/...</code>
              <code className="bg-gray-100 px-2 py-1 rounded">youtube.com/embed/...</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoInput;