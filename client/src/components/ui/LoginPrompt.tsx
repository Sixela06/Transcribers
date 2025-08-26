import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkles, MessageCircle, Crown } from 'lucide-react';
import Button from './Button';

interface LoginPromptProps {
  feature: 'summary' | 'chat';
  className?: string;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ feature, className = '' }) => {
  const featureConfig = {
    summary: {
      icon: Sparkles,
      title: 'AI Summary',
      description: 'Get key insights and main points extracted by our advanced AI.',
      benefits: [
        'Instant key point extraction',
        'Multiple summary formats',
        'Save time on long videos',
        'Perfect for research and learning'
      ]
    },
    chat: {
      icon: MessageCircle,
      title: 'AI Chat',
      description: 'Ask questions about the video content and get instant AI-powered answers.',
      benefits: [
        'Ask specific questions about content',
        'Get detailed explanations',
        'Explore topics mentioned in video',
        'Interactive learning experience'
      ]
    }
  };

  const config = featureConfig[feature];
  const Icon = config.icon;

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      <div className="p-8 text-center">
        {/* Lock Icon */}
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-gray-400" />
        </div>

        {/* Feature Icon & Title */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <Icon className="h-6 w-6 text-primary-600" />
          <h3 className="text-2xl font-bold text-gray-900">{config.title}</h3>
          <Crown className="h-5 w-5 text-yellow-500" />
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {config.description}
        </p>

        {/* Benefits List */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-700 mb-3">What you get:</p>
          <ul className="text-left space-y-2 max-w-sm mx-auto">
            {config.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Link to="/signup" className="block">
            <Button size="lg" className="w-full">
              Get Started Free
            </Button>
          </Link>
          <Link to="/login" className="block">
            <Button variant="secondary" size="lg" className="w-full">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Free tier info */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Free account includes 2 AI {feature === 'summary' ? 'summaries' : 'chat sessions'} per day
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPrompt;