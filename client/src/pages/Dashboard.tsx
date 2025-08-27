import React, { useState } from 'react';
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

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDurationFromString = (durationStr?: string) => {
    if (!durationStr) return '0:00';
    
    // If it's already formatted (e.g., "5:30"), return as is
    if (durationStr.includes(':')) {
      return durationStr;
    }
    
    // If it's a number as string, convert to minutes:seconds
    const totalSeconds = parseInt(durationStr);
    if (isNaN(totalSeconds)) return '0:00';
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
                      width: `${Math.min((usageStats.dailyUsage / usageStats.dailyLimit) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
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
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Current Plan</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">
                    {usageStats.subscriptionPlan}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Remaining</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usageStats.dailyLimit - usageStats.dailyUsage}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* Recent Videos */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Videos</h2>
          </div>
          
          {videosData && videosData.data.length > 0 ? (
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
                              src={video.thumbnailUrl || '/placeholder-video.jpg'}
                              alt={video.title || 'Video thumbnail'}
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 line-clamp-2">
                                {video.title || 'Untitled Video'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {video.channelName || 'Unknown Channel'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {video.publishedAt ? formatDate(video.publishedAt) : 'Unknown date'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDurationFromString(video.duration)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <FileText className="h-3 w-3 mr-1" />
                              Transcript
                            </span>
                            {video.summaries && video.summaries.length > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                Summary
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/?video=${video.youtubeId}`}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              View
                            </Link>
                            <a
                              href={createYouTubeUrl(video.youtubeId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => handleDeleteVideo(video.id)}
                              disabled={deletingVideoId === video.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
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
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No videos yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by processing your first YouTube video.
              </p>
              <div className="mt-6">
                <Button onClick={() => setIsVideoInputOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Process Video
                </Button>
              </div>
            </div>
          )}
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
    </div>
  );
};

export default Dashboard;