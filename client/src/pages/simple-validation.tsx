import { useState, useEffect } from "react";

export default function SimpleValidation() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState({
    url: '',
    search: '',
    token: '',
    type: ''
  });

  // Log that component is rendering
  console.log('SimpleValidation component rendering');
  console.log('Window location:', window.location.href);
  console.log('Search params:', window.location.search);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const type = urlParams.get('type');
    
    setDebugInfo({
      url: window.location.href,
      search: window.location.search,
      token: token || 'Not found',
      type: type || 'Not found'
    });

    if (!token || !type) {
      setStatus('error');
      setMessage('Missing validation parameters');
      return;
    }

    // Call validation API
    console.log('Making API call to:', `/api/validate-listing?token=${token}&type=${type}`);
    fetch(`/api/validate-listing?token=${token}&type=${type}`)
      .then(response => {
        console.log('API response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('API response data:', data);
        if (data.success) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.message);
        }
      })
      .catch(error => {
        console.error('API call failed:', error);
        setStatus('error');
        setMessage('Validation request failed: ' + error.message);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-5 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-5 text-gray-800">
          HotProp Validation
        </h1>
        
        {status === 'loading' && (
          <div>
            <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-5"></div>
            <p className="text-gray-600">Validating your listing...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div>
            <div className="text-5xl text-green-500 mb-5">✓</div>
            <h2 className="text-green-500 text-xl font-semibold mb-3">Success!</h2>
            <p className="text-gray-600 mb-5">{message}</p>
            <button 
              onClick={() => window.location.href = '/'} 
              className="mt-5 bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}
        
        {status === 'error' && (
          <div>
            <div className="text-5xl text-red-500 mb-5">✗</div>
            <h2 className="text-red-500 text-xl font-semibold mb-3">Validation Failed</h2>
            <p className="text-gray-600 mb-5">{message}</p>
            
            <div className="bg-gray-50 p-4 rounded text-left text-xs text-gray-500 mb-5">
              <strong>Debug Information:</strong><br/>
              URL: {debugInfo.url}<br/>
              Search: {debugInfo.search}<br/>
              Token: {debugInfo.token}<br/>
              Type: {debugInfo.type}
            </div>
            
            <button 
              onClick={() => window.location.href = '/'} 
              className="bg-gray-500 text-white px-5 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        )}
      </div>
    </div>
  );
}