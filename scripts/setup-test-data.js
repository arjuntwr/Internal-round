// Test data setup script for Price Visibility Control System
// Run this script to populate the system with sample users and data

const API_BASE = "http://localhost:3000";

const testUsers = [
  {
    name: "John Farmer",
    email: "farmer@test.com",
    password: "password123",
    role: "farmer"
  },
  {
    name: "Jane Consumer", 
    email: "consumer@test.com",
    password: "password123",
    role: "consumer"
  },
  {
    name: "Bob Distributor",
    email: "distributor@test.com", 
    password: "password123",
    role: "distributor"
  },
  {
    name: "Alice Admin",
    email: "admin@test.com",
    password: "password123", 
    role: "admin"
  }
];

const sampleProduce = [
  {
    cropName: "Organic Tomatoes",
    quantity: 100,
    harvestDate: "2024-01-15"
  },
  {
    cropName: "Fresh Lettuce",
    quantity: 50,
    harvestDate: "2024-01-10"
  },
  {
    cropName: "Sweet Corn",
    quantity: 200,
    harvestDate: "2024-01-20"
  }
];

async function registerUser(userData) {
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData),
      credentials: 'include'
    });
    
    const result = await response.json();
    if (response.ok) {
      console.log(`✅ Registered user: ${userData.email}`);
      return result;
    } else {
      console.log(`⚠️  User ${userData.email} might already exist: ${result.error}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Failed to register ${userData.email}:`, error.message);
    return null;
  }
}

async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    
    const result = await response.json();
    if (response.ok) {
      console.log(`✅ Logged in as: ${email}`);
      return result;
    } else {
      console.error(`❌ Login failed for ${email}:`, result.error);
      return null;
    }
  } catch (error) {
    console.error(`❌ Login error for ${email}:`, error.message);
    return null;
  }
}

async function addProduce(produceData) {
  try {
    const response = await fetch(`${API_BASE}/produce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(produceData),
      credentials: 'include'
    });
    
    const result = await response.json();
    if (response.ok) {
      console.log(`✅ Added produce: ${produceData.cropName} (Batch #${result.batchId})`);
      return result;
    } else {
      console.error(`❌ Failed to add produce ${produceData.cropName}:`, result.error);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error adding produce ${produceData.cropName}:`, error.message);
    return null;
  }
}

async function setProduceVisibility(batchId, visibility) {
  try {
    const response = await fetch(`${API_BASE}/produce/${batchId}/visibility`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ visibility }),
      credentials: 'include'
    });
    
    const result = await response.json();
    if (response.ok) {
      console.log(`✅ Set batch #${batchId} visibility to: ${visibility}`);
      return result;
    } else {
      console.error(`❌ Failed to set visibility for batch #${batchId}:`, result.error);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error setting visibility for batch #${batchId}:`, error.message);
    return null;
  }
}

async function setupTestData() {
  console.log("🚀 Setting up test data for Price Visibility Control System...\n");
  
  // Register all test users
  console.log("📝 Registering test users...");
  for (const user of testUsers) {
    await registerUser(user);
  }
  
  console.log("\n🌾 Setting up farmer data...");
  
  // Login as farmer and add produce
  const farmerLogin = await loginUser("farmer@test.com", "password123");
  if (farmerLogin) {
    const batches = [];
    
    for (const produce of sampleProduce) {
      const result = await addProduce(produce);
      if (result) {
        batches.push(result.batchId);
      }
    }
    
    // Set some batches to private for testing
    if (batches.length > 0) {
      console.log("\n🔒 Setting up privacy settings...");
      await setProduceVisibility(batches[0], "private"); // First batch private
      if (batches.length > 2) {
        await setProduceVisibility(batches[2], "private"); // Third batch private  
      }
    }
  }
  
  console.log("\n✨ Test data setup complete!");
  console.log("\n📋 Test Accounts Created:");
  console.log("👨‍🌾 Farmer: farmer@test.com / password123");
  console.log("🛒 Consumer: consumer@test.com / password123"); 
  console.log("🚚 Distributor: distributor@test.com / password123");
  console.log("👑 Admin: admin@test.com / password123");
  
  console.log("\n🎯 Next Steps:");
  console.log("1. Start your application (npm start)");
  console.log("2. Login as different users to test the system");
  console.log("3. Check the PRICE_VISIBILITY_GUIDE.md for testing scenarios");
  console.log("\n🎉 Happy Testing!");
}

// Run the setup
setupTestData().catch(console.error);
