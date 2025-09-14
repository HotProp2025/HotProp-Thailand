const { execSync } = require('child_process');
const path = require('path');

// Simple script to trigger translation using the existing API endpoint
async function runTranslation() {
  try {
    console.log("Starting translation of existing content...");
    
    // Use curl to trigger the translation via API
    const command = `curl -X POST "http://localhost:5000/api/admin/translate-existing" -H "Content-Type: application/json" -d '{}'`;
    
    console.log("Executing translation...");
    const result = execSync(command, { encoding: 'utf8', timeout: 120000 });
    console.log("Translation result:", result);
    
  } catch (error) {
    console.error("Translation failed:", error.message);
  }
}

runTranslation();