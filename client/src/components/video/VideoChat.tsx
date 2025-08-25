import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Send, MessageCircle, Bot, User } from 'lucide-react';
import { ChatMessage, VideoMetadata } from '../../types/video';
import { chatMessageSchema } from '../../utils/validation';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LoadingSpinner from '../ui/LoadingSpinner';

interface VideoChatProps {
  videoId: string;
  metadata: VideoMetadata;
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  loading?: boolean;
  className?: string;
}

interface FormData {
  message: string;
}

const VideoChat: React.FC<VideoChatProps> = ({
  videoId,
  metadata,
  messages,
  onSendMessage,
  loading = false,
  className = '',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: yupResolver(chatMessageSchema),
    mode: 'onChange',
  });

  const message = watch('message');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessageSubmit = async (data: FormData) => {
    if (!data.message.trim()) return;

    setIsSubmitting(true);
    try {
      await onSendMessage(data.message.trim());
      reset();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-96 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary-100 p-2 rounded-lg">
            <MessageCircle className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Chat about this video
            </h3>
            <p className="text-sm text-gray-600 truncate max-w-md">
              {metadata.title}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">
              Start a conversation about this video!
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Ask questions about the content, key points, or request clarifications.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-600" />
                  </div>
                </div>
              )}
              
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.role === 'user' ? 'text-primary-200' : 'text-gray-500'
                  }`}
                >
                  {formatTimestamp(msg.timestamp)}
                </p>
              </div>

              {msg.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-600" />
              </div>
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <LoadingSpinner size="sm" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <form
          onSubmit={handleSubmit(handleSendMessageSubmit)}
          className="flex gap-2"
        >
          <div className="flex-1">
            <Input
              {...register('message')}
              placeholder="Ask a question about this video..."
              disabled={isSubmitting || loading}
              error={errors.message?.message}
            />
          </div>
          <Button
            type="submit"
            disabled={!isValid || isSubmitting || loading || !message?.trim()}
            loading={isSubmitting}
            size="md"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default VideoChat;