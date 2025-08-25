import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  User, 
  Mail, 
  Crown, 
  Settings, 
  CreditCard, 
  Shield, 
  Bell,
  Save,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const profileSchema = yup.object({
  name: yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
});

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your password'),
});

interface ProfileFormData {
  name: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Account: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'billing' | 'notifications'>('profile');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: yupResolver(passwordSchema),
  });

  const handleProfileUpdate = async (data: ProfileFormData) => {
    setProfileLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (data: PasswordFormData) => {
    setPasswordLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      passwordForm.reset();
      toast.success('Password changed successfully!');
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account preferences and settings
          </p>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Profile Information
                  </h3>
                  <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                    <Input
                      {...profileForm.register('name')}
                      label="Full Name"
                      error={profileForm.formState.errors.name?.message}
                      disabled={profileLoading}
                    />
                    <Input
                      {...profileForm.register('email')}
                      type="email"
                      label="Email Address"
                      error={profileForm.formState.errors.email?.message}
                      disabled={profileLoading}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        loading={profileLoading}
                        disabled={!profileForm.formState.isValid}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Change Password
                  </h3>
                  <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                    <Input
                      {...passwordForm.register('currentPassword')}
                      type="password"
                      label="Current Password"
                      error={passwordForm.formState.errors.currentPassword?.message}
                      disabled={passwordLoading}
                    />
                    <Input
                      {...passwordForm.register('newPassword')}
                      type="password"
                      label="New Password"
                      error={passwordForm.formState.errors.newPassword?.message}
                      disabled={passwordLoading}
                    />
                    <Input
                      {...passwordForm.register('confirmPassword')}
                      type="password"
                      label="Confirm New Password"
                      error={passwordForm.formState.errors.confirmPassword?.message}
                      disabled={passwordLoading}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        loading={passwordLoading}
                        disabled={!passwordForm.formState.isValid}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                    </div>
                  </form>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Two-Factor Authentication
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Add an extra layer of security to your account
                  </p>
                  <Button variant="secondary">
                    Enable 2FA
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Current Plan
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Crown className="h-8 w-8 text-yellow-500 mr-3" />
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 capitalize">
                            {user?.subscription?.plan || 'Free'} Plan
                          </h4>
                          <p className="text-sm text-gray-600">
                            {user?.subscription?.plan === 'free' 
                              ? '2 AI summaries per day' 
                              : 'Unlimited AI summaries'
                            }
                          </p>
                        </div>
                      </div>
                      {user?.subscription?.plan === 'free' && (
                        <Button>
                          Upgrade to Premium
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Usage This Month
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Settings className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Videos Processed</p>
                          <p className="text-xl font-bold text-gray-900">12</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">AI Summaries</p>
                          <p className="text-xl font-bold text-gray-900">
                            {user?.subscription?.dailyUsage || 0}/{user?.subscription?.dailyLimit || 2}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Crown className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Plan Status</p>
                          <p className="text-xl font-bold text-gray-900 capitalize">
                            {user?.subscription?.status || 'Active'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {user?.subscription?.plan === 'premium' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Billing History
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <p className="text-gray-600">No billing history available</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Email Notifications
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          Video Processing Complete
                        </h4>
                        <p className="text-sm text-gray-600">
                          Get notified when your video processing is complete
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          Daily Limit Reached
                        </h4>
                        <p className="text-sm text-gray-600">
                          Get notified when you reach your daily usage limit
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          Product Updates
                        </h4>
                        <p className="text-sm text-gray-600">
                          Get notified about new features and updates
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;