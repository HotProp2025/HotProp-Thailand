import { useState } from "react";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";

export default function TestValidation() {
  const [token, setToken] = useState("");
  const [type, setType] = useState("property");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/validate-listing?token=${token}&type=${type}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-4">Test Validation System</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Token:</label>
            <input 
              className="w-full p-2 border rounded"
              value={token} 
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter validation token"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Type:</label>
            <select 
              className="w-full p-2 border rounded"
              value={type} 
              onChange={(e) => setType(e.target.value)}
            >
              <option value="property">Property</option>
              <option value="requirement">Requirement</option>
            </select>
          </div>
          
          <Button onClick={handleTest} disabled={loading || !token} className="w-full">
            {loading ? "Testing..." : "Test Validation"}
          </Button>
        </div>
        
        {result && (
          <div className="mt-6 p-4 bg-gray-100 rounded">
            <h3 className="font-medium mb-2">Result:</h3>
            <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
        
        <div className="mt-6 text-sm text-gray-600">
          <p><strong>Current URL:</strong> {window.location.href}</p>
          <p><strong>Search Params:</strong> {window.location.search}</p>
        </div>
      </div>
    </div>
  );
}