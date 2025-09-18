# 🧪 Price Visibility Control System - Testing Checklist

## Pre-Testing Setup

### ✅ Environment Setup
- [ ] Hardhat node is running (`npx hardhat node`)
- [ ] Smart contracts are deployed (`npm run dev:deploy`)
- [ ] Backend server is running (`npm start`)
- [ ] Frontend is running (`cd web && npm run dev`)
- [ ] Test data is loaded (`npm run setup-test-data`)

### ✅ Test Accounts Available
- [ ] Farmer: farmer@test.com / password123
- [ ] Consumer: consumer@test.com / password123
- [ ] Distributor: distributor@test.com / password123

---

## 🌾 Farmer Functionality Tests

### Produce Management
- [ ] **Create Produce Batch**
  - [ ] Login as farmer
  - [ ] Navigate to "My Produce" tab
  - [ ] Fill form with valid data
  - [ ] Submit successfully
  - [ ] Verify batch appears in list
  - [ ] Note the batch ID for later tests

### Price Visibility Settings
- [ ] **Access Privacy Settings**
  - [ ] Navigate to "Privacy Settings" tab
  - [ ] Verify all farmer's batches are listed
  - [ ] Default visibility is "public"

- [ ] **Toggle to Private**
  - [ ] Switch a batch from public to private
  - [ ] Verify badge changes to "private"
  - [ ] Verify switch position updates
  - [ ] Check success toast appears

- [ ] **Toggle Back to Public**
  - [ ] Switch batch back to public
  - [ ] Verify all UI updates correctly

### Price Request Management
- [ ] **View Requests Tab**
  - [ ] Navigate to "Price Requests" tab
  - [ ] Initially should show "No requests yet"
  - [ ] Tab should show notification badge when requests exist

- [ ] **Handle Pending Requests** (after consumer creates request)
  - [ ] See pending request in list
  - [ ] Verify requester information is displayed
  - [ ] Batch ID and timestamp are correct

- [ ] **Approve Request**
  - [ ] Click "Approve" button
  - [ ] Verify success message
  - [ ] Request moves to "Recent Activity" section
  - [ ] Status shows as "approved"

- [ ] **Deny Request**
  - [ ] Create another request to test denial
  - [ ] Click "Deny" button
  - [ ] Verify success message
  - [ ] Status shows as "denied"

### Notifications
- [ ] **Real-time Updates**
  - [ ] Notification badge appears when new request arrives
  - [ ] Count updates correctly
  - [ ] Badge disappears when no pending requests

---

## 🛒 Consumer/Distributor Functionality Tests

### Viewing Public Prices
- [ ] **Public Batch Access**
  - [ ] Login as consumer
  - [ ] Search for a public batch
  - [ ] Verify prices are visible in timeline
  - [ ] No request button should appear

### Private Batch Interaction
- [ ] **Detect Private Pricing**
  - [ ] Search for a private batch
  - [ ] Verify "Price Information Protected" card appears
  - [ ] Prices show as "Price Hidden" in timeline
  - [ ] "Request Price Access" button is visible

- [ ] **Request Price Access**
  - [ ] Click "Request Price Access" button
  - [ ] Verify success toast appears
  - [ ] Button changes to "Request Pending"

- [ ] **After Approval**
  - [ ] Search same batch after farmer approves
  - [ ] Verify prices are now visible
  - [ ] Button shows "Access Granted"
  - [ ] No protection card appears

- [ ] **After Denial**
  - [ ] For denied requests, verify:
  - [ ] "Request Denied" badge appears
  - [ ] "Request Again" button is available
  - [ ] Can submit new request

### Request Status Persistence
- [ ] **Cross-Session Persistence**
  - [ ] Request access, logout, login again
  - [ ] Verify request status is maintained
  - [ ] Search same batch shows correct status

---

## 🔄 Cross-Role Integration Tests

### Farmer-Consumer Workflow
- [ ] **Complete Approval Flow**
  1. [ ] Farmer creates batch and sets to private
  2. [ ] Consumer requests access
  3. [ ] Farmer sees notification and approves
  4. [ ] Consumer can now view prices
  5. [ ] Both users see correct status

- [ ] **Complete Denial Flow**
  1. [ ] Consumer requests access to private batch
  2. [ ] Farmer denies request
  3. [ ] Consumer sees denial status
  4. [ ] Consumer can request again

### Multiple Users
- [ ] **Multiple Consumers**
  - [ ] Have both consumer and distributor request access
  - [ ] Farmer can see both requests
  - [ ] Can approve one and deny another
  - [ ] Each user sees their own status

### Edge Cases
- [ ] **Invalid Batch ID**
  - [ ] Consumer searches for non-existent batch
  - [ ] Proper error message displayed

- [ ] **Farmer Own Batches**
  - [ ] Farmer viewing their own batch
  - [ ] Always sees prices regardless of privacy setting
  - [ ] No request button appears

---

## 🎨 UI/UX Tests

### Visual Indicators
- [ ] **Status Badges**
  - [ ] Public batches show green "public" badge
  - [ ] Private batches show orange "private" badge
  - [ ] Request status badges have correct colors

- [ ] **Loading States**
  - [ ] Loading spinners appear during API calls
  - [ ] Buttons disable during requests
  - [ ] Proper loading messages

- [ ] **Responsive Design**
  - [ ] Test on mobile device/small screen
  - [ ] All components remain usable
  - [ ] Text remains readable

### Error Handling
- [ ] **Network Errors**
  - [ ] Disconnect internet, try actions
  - [ ] Proper error messages appear
  - [ ] UI remains stable

- [ ] **Authentication Errors**
  - [ ] Logout and try protected actions
  - [ ] Proper authentication prompts

---

## 🔧 Technical Tests

### API Endpoints
- [ ] **Price Request Endpoints**
  - [ ] POST /price-requests (creates request)
  - [ ] GET /price-requests (lists farmer requests)
  - [ ] POST /price-requests/:id/respond (approve/deny)
  - [ ] GET /price-requests/status/:batchId (check status)

- [ ] **Visibility Endpoints**
  - [ ] POST /produce/:id/visibility (set visibility)
  - [ ] GET /produce/visibility (get settings)

- [ ] **Modified Endpoints**
  - [ ] GET /getProduce/:id (respects permissions)

### Data Persistence
- [ ] **In-Memory Storage**
  - [ ] Requests persist during session
  - [ ] Permissions persist during session
  - [ ] Settings persist during session

### Security
- [ ] **Authorization Checks**
  - [ ] Only farmers can set visibility
  - [ ] Only farmers can respond to requests
  - [ ] Users can only see their own request status

---

## 🚀 Performance Tests

### Load Testing
- [ ] **Multiple Simultaneous Users**
  - [ ] 3+ users logged in simultaneously
  - [ ] All can perform actions without conflicts
  - [ ] Notifications update correctly

- [ ] **Rapid Actions**
  - [ ] Quickly toggle visibility settings
  - [ ] Rapid approve/deny actions
  - [ ] No race conditions or errors

---

## ✅ Final Validation

### Complete User Journey
- [ ] **End-to-End Test**
  1. [ ] New farmer registers and creates produce
  2. [ ] Sets some batches to private
  3. [ ] New consumer registers and finds batches
  4. [ ] Requests access to private batches
  5. [ ] Farmer manages requests appropriately
  6. [ ] Consumer can access approved content
  7. [ ] All notifications and statuses work correctly

### Documentation
- [ ] **User Guide**
  - [ ] PRICE_VISIBILITY_GUIDE.md is accurate
  - [ ] All features are documented
  - [ ] Screenshots/examples are current

### Code Quality
- [ ] **No Console Errors**
  - [ ] Browser console is clean
  - [ ] No TypeScript errors
  - [ ] No runtime warnings

---

## 🎯 Success Criteria

✅ **All tests pass**  
✅ **No critical bugs found**  
✅ **User experience is intuitive**  
✅ **Performance is acceptable**  
✅ **Security measures work correctly**  

---

**Testing Complete! 🎉**

If all items are checked, the Price Visibility Control System is ready for production use!
