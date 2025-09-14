export default function EmailPreview() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-center mb-8">HotProp Validation Email Preview</h1>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          
          {/* Email Header */}
          <div style={{
            background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
            padding: "30px",
            textAlign: "center",
            color: "white"
          }}>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>HotProp</h1>
            <p style={{ margin: "10px 0 0 0", fontSize: "16px" }}>Smart Deals, 0 Fees!</p>
          </div>
          
          {/* Email Body */}
          <div style={{ padding: "30px", backgroundColor: "#ffffff" }}>
            <h2 style={{ color: "#f97316", marginBottom: "20px" }}>Hi Sample User!</h2>
            
            <p style={{ fontSize: "16px", lineHeight: "1.6", color: "#333", marginBottom: "20px" }}>
              We hope your property "<strong>Beautiful 3-Bedroom Villa in Downtown</strong>" is going well!
            </p>
            
            <p style={{ fontSize: "16px", lineHeight: "1.6", color: "#333", marginBottom: "20px" }}>
              To keep our platform current and ensure the best experience for all users, we need you to confirm that your property is still available for sale.
            </p>
            
            <div style={{
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeaa7",
              padding: "20px",
              borderRadius: "8px",
              margin: "30px 0"
            }}>
              <p style={{ margin: 0, fontSize: "16px", color: "#856404" }}>
                <strong>⏰ Important:</strong> Please confirm within 24 hours or your property will be automatically deactivated (but not deleted).
              </p>
            </div>
            
            <div style={{ textAlign: "center", margin: "30px 0" }}>
              <a href="#" 
                 style={{
                   background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                   color: "white",
                   padding: "15px 30px",
                   textDecoration: "none",
                   borderRadius: "8px",
                   fontWeight: "bold",
                   fontSize: "16px",
                   display: "inline-block"
                 }}>
                ✓ Yes, My Property is Still Active
              </a>
            </div>
            
            <p style={{ fontSize: "14px", color: "#666", marginTop: "30px" }}>
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style={{ fontSize: "14px", color: "#f97316", wordBreak: "break-all" }}>
              https://yourapp.replit.app/validate-listing?token=validation-token-123&type=property
            </p>
            
            <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "30px 0" }} />
            
            <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
              <strong>Don't worry if you miss the deadline!</strong> If your property gets deactivated, you can easily reactivate it anytime from your account dashboard.
            </p>
            
            <p style={{ fontSize: "14px", color: "#666", margin: "10px 0 0 0" }}>
              This validation helps us maintain a high-quality platform with current listings for all our users.
            </p>
          </div>
          
          {/* Email Footer */}
          <div style={{
            backgroundColor: "#f8f9fa",
            padding: "20px",
            textAlign: "center",
            color: "#666",
            fontSize: "12px"
          }}>
            <p style={{ margin: 0 }}>© 2025 HotProp. All rights reserved.</p>
            <p style={{ margin: "5px 0 0 0" }}>Direct property connections without agent fees.</p>
          </div>
          
        </div>
        
        <div className="mt-8 text-center">
          <h2 className="text-lg font-semibold mb-4">How the Validation System Works:</h2>
          <div className="bg-white rounded-lg p-6 shadow text-left">
            <ul className="space-y-3 text-sm">
              <li>• <strong>Weekly Schedule:</strong> Every Monday at 9 AM, the system checks for listings older than 7 days</li>
              <li>• <strong>Email + Notification:</strong> Users receive both email and in-app notifications</li>
              <li>• <strong>24-Hour Window:</strong> Users have exactly 24 hours to click the validation button</li>
              <li>• <strong>Auto-Deactivation:</strong> If not validated, listings are hidden (not deleted)</li>
              <li>• <strong>Easy Reactivation:</strong> Users can reactivate anytime from their dashboard</li>
              <li>• <strong>Data Preservation:</strong> No listings are ever deleted, only temporarily hidden</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}