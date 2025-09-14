import React from 'react';

export default function MobileDemo() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 text-center">
        <div className="text-4xl mb-4">🏠</div>
        <h1 className="text-2xl font-bold text-blue-600 mb-2">HotProp Mobile</h1>
        <p className="text-gray-600 mb-6">Your mobile app is ready!</p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-800 mb-2">How to Access:</h2>
          <div className="text-sm text-blue-700 text-left space-y-2">
            <p>1. Download <strong>Expo Go</strong> app on your phone</p>
            <p>2. In Replit, go to the <strong>Shell</strong> tab</p>
            <p>3. Run: <code className="bg-blue-100 px-1 rounded">cd mobile/HotPropMobile && npx expo start</code></p>
            <p>4. Scan the QR code with Expo Go</p>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">✅ Features Ready</h3>
          <div className="text-sm text-green-700 text-left space-y-1">
            <p>• Authentication with your backend</p>
            <p>• Mobile-optimized interface</p>
            <p>• Property browsing foundation</p>
            <p>• Navigation system prepared</p>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-4">
          App created in: <code>/mobile/HotPropMobile/</code>
        </p>
      </div>
    </div>
  );
}