import React, { useState } from 'react';

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ items, defaultTab, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id || '');

  const activeTabContent = items.find(item => item.id === activeTab)?.content;

  return (
    <div className={className}>
      {/* Tab Headers */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                flex items-center py-4 px-2 border-b-2 font-medium text-base transition-colors
                ${activeTab === item.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {item.icon && (
                <span className="mr-3">
                  {React.cloneElement(item.icon as React.ReactElement, { className: 'h-5 w-5' })}
                </span>
              )}
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTabContent}
      </div>
    </div>
  );
};

export default Tabs;