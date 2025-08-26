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

          {/* Results */}
          {videoData && (
            <div className="mt-12 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Transcript */}
                <TranscriptViewer
                  transcript={videoData.transcript}
                  metadata={videoData.metadata}
                />

                {/* Summary */}
                {videoData.summary ? (
                  <SummaryViewer
                    summary={videoData.summary}
                    metadata={videoData.metadata}
                  />
                ) : (
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                    <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Get AI Summary
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {isAuthenticated
                        ? 'Click "Summarize Video" to get an AI-powered summary'
                        : 'Sign up to unlock AI-powered summaries and chat features'}
                    </p>
                    {!isAuthenticated && (
                      <Link to="/signup">
                        <Button>Sign Up Free</Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Chat */}
              {videoData.summary && isAuthenticated && (
                <VideoChat
                  videoId={videoData.metadata.id}
                  metadata={videoData.metadata}
                  messages={chatMessages}
                  onSendMessage={handleSendChatMessage}
                  loading={chatLoading}
                />
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to extract video insights
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform makes it easy to get the most important information 
              from any YouTube video in minutes, not hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Instant Transcription
              </h3>
              <p className="text-gray-600">
                Get accurate transcripts from any YouTube video in seconds. 
                Search, copy, and download with ease.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI-Powered Summaries
              </h3>
              <p className="text-gray-600">
                Our advanced AI extracts key points and creates concise summaries, 
                saving you time and highlighting what matters most.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Interactive Chat
              </h3>
              <p className="text-gray-600">
                Ask questions about the video content and get instant answers. 
                Perfect for learning and research.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  $0<span className="text-lg text-gray-600">/month</span>
                </div>
                <p className="text-gray-600">Perfect for trying out our service</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Unlimited transcriptions</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">2 AI summaries per day</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Basic chat functionality</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Export transcripts</span>
                </li>
              </ul>

              <Link to="/signup" className="block">
                <Button variant="secondary" className="w-full">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-primary-500 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  $9<span className="text-lg text-gray-600">/month</span>
                </div>
                <p className="text-gray-600">For power users and professionals</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Everything in Free</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Unlimited AI summaries</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Advanced chat features</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Priority support</span>
                </li>
                <li className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-500 mr-3" />
                  <span className="text-gray-700">Chrome extension access</span>
                </li>
              </ul>

              <Link to="/signup" className="block">
                <Button className="w-full">
                  Start Premium Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;