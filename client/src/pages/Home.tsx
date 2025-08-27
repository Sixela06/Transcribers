import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FileText, Sparkles, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { transcribeVideo, summarizeVideo } from '../services/video';
import { sendChatMessage } from '../services/chat';
import VideoInput from '../components/video/VideoInput';
import Tabs from '../components/ui/Tabs';
import TranscriptViewer from '../components/video/TranscriptViewer';
import SummaryViewer from '../components/video/SummaryViewer';
import VideoChat from '../components/video/VideoChat';
import LoginPrompt from '../components/ui/LoginPrompt';
import { VideoTranscript, VideoMetadata, VideoSummary, ChatMessage } from '../types/video';

interface VideoData {
  metadata: VideoMetadata;
  transcript: VideoTranscript;
  summary?: VideoSummary;
}

interface VideoData {
  metadata: VideoMetadata;
  transcript: VideoTranscript;
  summary?: VideoSummary;
}

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const handleTranscribe = async (url: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await transcribeVideo({ youtubeUrl: url });
      setVideoData({
        metadata: response.metadata,
        transcript: response.transcript
      });
      toast.success('Video transcribed successfully!');
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || 'Failed to transcribe video';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async (url: string): Promise<void> => {
    if (!isAuthenticated) {
      toast.error('Please login to use the summarize feature');
      return;
    }

    setLoading(true);
    try {
      // Fixed: Ensure proper request format with correct field names
      const response = await summarizeVideo({ 
        youtubeUrl: url,
        summaryType: 'STANDARD'
      });
      
      setVideoData({
        metadata: response.metadata,
        transcript: response.transcript,
        summary: response.summary
      });
      toast.success('Video summarized successfully!');
    } catch (error: any) {
      console.error('Summarization error:', error);
      
      // Improved error handling
      let errorMessage = 'Failed to summarize video';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.status === 401) {
        errorMessage = 'Please login to use the summarize feature';
      } else if (error?.response?.status === 429) {
        errorMessage = 'Daily usage limit exceeded. Please upgrade your plan.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSendChatMessage = async (message: string): Promise<void> => {
    if (!videoData || !isAuthenticated) {
      toast.error('Please login to use chat feature');
      return;
    }

    setChatLoading(true);
    try {
      const response = await sendChatMessage(videoData.metadata.id, message);
      setChatMessages(prev => [...prev, 
        { id: Date.now().toString(), role: 'user', content: message, timestamp: new Date().toISOString() },
        response
      ]);
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || 'Failed to send message';
      toast.error(message);
    } finally {
      setChatLoading(false);
    }
  };

  // Create tab items based on available data
  const getTabItems = () => {
    const tabs = [];

    // Always show transcript tab if we have video data
    if (videoData && videoData.transcript) {
      tabs.push({
        id: 'transcript',
        label: 'Transcript',
        icon: <FileText className="h-4 w-4" />,
        content: (
          <TranscriptViewer
            transcript={videoData.transcript}
            metadata={videoData.metadata}
          />
        ),
      });
    }

    // Always show summary tab if we have video data (show login prompt if not authenticated)
    if (videoData && videoData.transcript) {
      tabs.push({
        id: 'summary',
        label: 'AI Summary',
        icon: <Sparkles className="h-4 w-4" />,
        content: videoData.summary ? (
          <SummaryViewer
            summary={videoData.summary}
            metadata={videoData.metadata}
          />
        ) : isAuthenticated ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
            <Sparkles className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate AI Summary</h3>
            <p className="text-gray-600 mb-4">Click "Summarize Video" to generate an AI-powered summary of this content.</p>
            <p className="text-sm text-gray-500">Use the summarize button above to get started.</p>
          </div>
        ) : (
          <LoginPrompt feature="summary" />
        ),
      });
    }

    // Always show chat tab if we have video data (show login prompt if not authenticated)
    if (videoData && videoData.transcript) {
      tabs.push({
        id: 'chat',
        label: 'AI Chat',
        icon: <MessageCircle className="h-4 w-4" />,
        content: isAuthenticated ? (
          <VideoChat
            videoId={videoData.metadata.id}
            metadata={videoData.metadata}
            messages={chatMessages}
            onSendMessage={handleSendChatMessage}
            loading={chatLoading}
          />
        ) : (
          <LoginPrompt feature="chat" />
        ),
      });
    }

    return tabs;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Video Input */}
          <VideoInput
            onTranscribe={handleTranscribe}
            onSummarize={handleSummarize}
            loading={loading}
          />

          {/* Results */}
          {videoData && (
            <Tabs
              items={getTabItems()}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;