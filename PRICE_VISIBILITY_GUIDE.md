# Price Visibility Control System - User Guide

## 🌟 Overview
The price visibility control system allows farmers to control who can see the pricing information for their produce batches. This feature enhances privacy and enables farmers to manage their business relationships more effectively.

## 🚀 Getting Started

### 1. Start the Application
```bash
# Terminal 1 - Start the backend server
npm start

# Terminal 2 - Start the frontend (in web directory)
cd web
npm run dev
```

### 2. Create Test Users
Register the following users to test the system:

**Farmer Account:**
- Name: John Farmer
- Email: farmer@test.com
- Password: password123
- Role: Farmer

**Consumer Account:**
- Name: Jane Consumer
- Email: consumer@test.com
- Password: password123
- Role: Consumer

**Distributor Account:**
- Name: Bob Distributor
- Email: distributor@test.com
- Password: password123
- Role: Distributor

## 📋 Testing Workflow

### Step 1: Farmer Creates Produce (as farmer@test.com)
1. Login as the farmer
2. Go to "My Produce" tab
3. Add a new produce batch:
   - Crop Name: "Organic Tomatoes"
   - Quantity: 100
   - Harvest Date: Today's date
4. Note the Batch ID (e.g., #001)

### Step 2: Set Price Visibility to Private
1. Switch to "Privacy Settings" tab
2. Find your batch and toggle the switch to make it "Private"
3. Verify the badge shows "private"

### Step 3: Test Consumer View (as consumer@test.com)
1. Logout and login as the consumer
2. Go to Consumer Dashboard
3. Search for the batch ID (e.g., 001)
4. Notice the "Price Information Protected" card appears
5. Click "Request Price Access" button
6. Verify the request is sent successfully

### Step 4: Farmer Manages Requests (as farmer@test.com)
1. Switch back to farmer account
2. Notice the red notification badge on "Price Requests" tab
3. Go to "Price Requests" tab
4. See the pending request from the consumer
5. Click "Approve" to grant access (or "Deny" to reject)

### Step 5: Verify Access Granted (as consumer@test.com)
1. Switch back to consumer account
2. Search for the same batch again
3. Notice prices are now visible in the supply chain timeline
4. The "Request Price Access" button should show "Access Granted"

## 🔧 API Endpoints

### Price Request Management
- `POST /price-requests` - Request price access
- `GET /price-requests` - Get farmer's pending requests
- `POST /price-requests/:id/respond` - Approve/deny requests
- `GET /price-requests/status/:batchId` - Check request status

### Visibility Settings
- `POST /produce/:batchId/visibility` - Set visibility (public/private)
- `GET /produce/visibility` - Get farmer's settings

## 🎯 Key Features

### For Farmers:
- ✅ Toggle price visibility per batch (public/private)
- ✅ View and manage price access requests
- ✅ Real-time notifications for new requests
- ✅ Approve or deny requests with one click

### For Consumers/Distributors:
- ✅ Request access to view private prices
- ✅ Clear status indicators for request progress
- ✅ Automatic price visibility after approval
- ✅ Retry requests if denied

### System Features:
- ✅ Role-based access control
- ✅ Real-time notification system
- ✅ Persistent permissions storage
- ✅ Clean, intuitive UI with status badges

## 🐛 Troubleshooting

### Common Issues:

**1. Prices still showing as hidden after approval:**
- Refresh the page or search again
- Check if you're logged in as the correct user

**2. Request button not appearing:**
- Ensure you're logged in as a consumer/distributor (not farmer)
- Verify the batch has private pricing enabled

**3. Notification count not updating:**
- The system polls every 30 seconds for updates
- Manually refresh the page to see immediate updates

**4. Cannot set visibility:**
- Ensure you're logged in as a farmer
- Verify you own the batch you're trying to modify

## 🔄 Testing Different Scenarios

### Scenario 1: Public Pricing (Default)
- Create a batch as farmer
- Leave privacy setting as "public"
- Consumer can see prices immediately without requesting

### Scenario 2: Private Pricing with Approval
- Create a batch and set to "private"
- Consumer requests access
- Farmer approves → Consumer sees prices

### Scenario 3: Private Pricing with Denial
- Consumer requests access
- Farmer denies → Consumer sees "Request Denied" badge
- Consumer can request again

### Scenario 4: Multiple Users
- Test with multiple consumers requesting access to same batch
- Farmer can manage all requests individually

## 📱 Mobile Responsiveness
The system is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile devices

## 🔐 Security Features
- Authentication required for all price operations
- Role-based authorization (only farmers can set visibility)
- Session-based access control
- Request validation and sanitization

## 🚀 Next Steps
Consider implementing:
- Email notifications for requests
- Bulk approval/denial actions
- Price visibility templates
- Analytics for request patterns
- Integration with external notification services

---

**Happy Testing! 🎉**

For any issues or questions, check the browser console for error messages and ensure all dependencies are properly installed.
