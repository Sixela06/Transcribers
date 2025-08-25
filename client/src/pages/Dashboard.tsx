import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  Clock, 
  FileText, 
  MessageCircle, 
  Plus, 
  Trash2, 
  ExternalLink,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProcessedVideo } from '../types/video';
import { UsageStats } from '../types/api';
import { getProcessedVideos, getUserUsageStats, transcribeVideo, summarizeVideo, deleteVideo } from '../services/video';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import VideoInput from '../components/video/VideoInput';
import Modal from '../components/ui/Modal';
import { formatViewCount, formatDuration, createYouTubeUrl } from '../utils/youtube';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [isVideoInputOpen, setIsVideoInputOpen] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);

  // Fetch user's processed videos
  const { 
    data: videosData, 
    isLoading: videosLoading, 
    refetch: refetchVideos 
  } = useQuery({
    queryKey: ['processed-videos'],
    queryFn: () => getProcessedVideos(1, 20),
  });

  // Fetch usage statistics
  const { 
    data: usageStats, 
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ['usage-stats'],
    queryFn: () => getUserUsageStats(),
  });

  const handleTranscribe = async (url: string) => {
    try {
      await transcribeVideo({ youtubeUrl: url });
      toast.success('Video transcribed successfully!');
      setIsVideoInputOpen(false);
      refetchVideos();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to transcribe video');
    }
  };

  const handleSummarize = async (url: string) => {
    try {
      await summarizeVideo({ youtubeUrl: url });
      toast.success('Video summarized successfully!');
      setIsVideoInputOpen(false);
      refetchVideos();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to summarize video');
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    setDeletingVideoId(videoId);
    try {
      await deleteVideo(videoId);
      toast.success('Video deleted successfully!');
      refetchVideos();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete video');
    } finally {
      setDeletingVideoId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (videosLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your processed videos and track your usage
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button onClick={() => setIsVideoInputOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Process New Video
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {usageStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Daily Usage</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usageStats.dailyUsage}/{usageStats.dailyLimit}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((usageStats.dailyUsage / usageStats.dailyLimit) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Videos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usageStats.totalVideosProcessed}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Plan</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">
                    {usageStats.subscriptionPlan}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {videosData?.data.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Videos */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Videos</h2>
          </div>

          {videosData?.data && videosData.data.length > 0 ? (
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Video
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Processed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Features
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {videosData.data.map((video) => (
                      <tr key={video.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <img
                              className="h-12 w-16 rounded object-cover flex-shrink-0"
                              src={video.metadata.thumbnail}
                              alt={video.metadata.title}
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 line-clamp-2">
                                {video.metadata.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {video.metadata.channelTitle} • {formatViewCount(video.metadata.viewCount)} views
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(video.processedAt)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDuration(parseInt(video.metadata.duration))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <FileText className="h-3 w-3 mr-1" />
                              Transcript
                            </span>
                            {video.summary && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                Summary
                              </span>
                            )}
                            {video.chatSession && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                Chat
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <a
                              href={createYouTubeUrl(video.youtubeId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => handleDeleteVideo(video.id)}
                              disabled={deletingVideoId === video.id}
                              className="text-red-400 hover:text-red-600 disabled:opacity-50"
                            >
                              {deletingVideoId === video.id ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No videos processed yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start by processing your first YouTube video to see it here
              </p>
              <Button onClick={() => setIsVideoInputOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Process Your First Video
              </Button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Plus className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Process New Video</h3>
                <p className="text-sm text-gray-600">Transcribe or summarize a YouTube video</p>
              </div>
            </div>
          </Link>

          <Link
            to="/account"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Upgrade Plan</h3>
                <p className="text-sm text-gray-600">Get unlimited summaries and more features</p>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Need Help?</h3>
                <p className="text-sm text-gray-600">Check our FAQ or contact support</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Input Modal */}
      <Modal
        isOpen={isVideoInputOpen}
        onClose={() => setIsVideoInputOpen(false)}
        title="Process New Video"
        maxWidth="2xl"
      >
        <VideoInput
          onTranscribe={handleTranscribe}
          onSummarize={handleSummarize}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;