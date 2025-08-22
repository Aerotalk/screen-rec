import { useState } from "react";
import Screenshot from "./Screenshot";
import ScreenRecording from "./ScreenRecording";

export default function MainApp() {
  const [activeTab, setActiveTab] = useState<'screenshot' | 'recording'>('screenshot');

  return (
    <div className="min-w-96 bg-white">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('screenshot')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'screenshot'
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Screenshots
        </button>
        <button
          onClick={() => setActiveTab('recording')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'recording'
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Screen Recording
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white">
        {activeTab === 'screenshot' && <Screenshot />}
        {activeTab === 'recording' && <ScreenRecording />}
      </div>
    </div>
  );
}
