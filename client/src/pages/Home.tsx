import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, FileText, MessageCircle, Clock, CheckCircle, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VideoInput from '../components/video/VideoInput';
import TranscriptViewer from '../components/video/TranscriptViewer';
import SummaryViewer from '../components/video/SummaryViewer';
import VideoChat from '../components/video/VideoChat';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Tabs from '../components/ui/Tabs';
import LoginPrompt from '../components/ui/LoginPrompt';
import { transcribeVideo, summarizeVideo } from '../services/video';
import { sendChatMessage } from '../services/chat';
import { VideoMetadata, VideoTranscript, VideoSummary, ChatMessage } from '../types/video';
import toast from 'react-hot-toast';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState<{
    metadata: VideoMetadata;
    transcript: VideoTranscript;
    summary?: VideoSummary;
  } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const handleTranscribe = async (url: string) => {
    setLoading(true);
    try {
      const result = await transcribeVideo({ youtubeUrl: url });
      setVideoData({
        metadata: result.metadata,
        transcript: result.transcript,
      });
      setChatMessages([]);
      toast.success('Transcript generated successfully!');
    } catch (error: any) {
      console.error('Transcription error:', error);
      const message = error?.response?.data?.error || error?.response?.data?.message || 'Failed to transcribe video';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async (url: string) => {
    if (!isAuthenticated) {
      toast.error('Please login to use AI summarization');
      return;
    }

    setLoading(true);
    try {
      const result = await summarizeVideo({ youtubeUrl: url });
      setVideoData({
        metadata: result.metadata,
        transcript: result.transcript,
        summary: result.summary,
      });
      setChatMessages([]);
      toast.success('Video summarized successfully!');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to summarize video';
      toast.error(message);
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
      const message = error?.response?.data?.message || 'Failed to send message';
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

  const tabItems = getTabItems();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Transform YouTube Videos into
              <span className="text-primary-600 block">Actionable Insights</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Get instant transcripts and AI-powered summaries from any YouTube video. 
              Chat with AI about the content and extract key information in seconds.
            </p>
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Video Input */}
          <VideoInput
            onTranscribe={handleTranscribe}
            onSummarize={handleSummarize}
            loading={loading}
          />

          {/* Results Section with Tabs */}
          {tabItems.length > 0 && (
            <div className="mt-12">
              <Tabs 
                items={tabItems} 
                defaultTab="transcript"
                className="w-full"
              />
            </div>
          )}

          {/* Features Section - Show when no video data */}
          {!videoData && !loading && (
            <div className="mt-16">
              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="mx-auto w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Instant Transcripts
                  </h3>
                  <p className="text-gray-600">
                    Get accurate, searchable transcripts from any YouTube video in seconds.
                  </p>
                </div>

                <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="mx-auto w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    AI Summaries
                  </h3>
                  <p className="text-gray-600">
                    Extract key insights and main points with our advanced AI summarization.
                  </p>
                </div>

                <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="mx-auto w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                    <MessageCircle className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Interactive Chat
                  </h3>
                  <p className="text-gray-600">
                    Ask questions about the video content and get instant AI-powered answers.
                  </p>
                </div>
              </div>

              {/* Social Proof */}
              <div className="text-center">
                <p className="text-gray-500 mb-8">Trusted by content creators and learners worldwide</p>
                <div className="flex flex-col sm:flex-row items-center justify-center sm:space-x-8 space-y-4 sm:space-y-0 opacity-60">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current text-yellow-400" />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">4.9/5 rating</span>
                  </div>
                  <div className="text-sm text-gray-600">10,000+ videos processed</div>
                  <div className="text-sm text-gray-600">5,000+ happy users</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;