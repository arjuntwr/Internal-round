# 🌾 Supply Chain Management System

A blockchain-based supply chain management system built with React, Node.js, and Hardhat.

## 🆕 New Feature: Price Visibility Control System

Farmers can now control who can see the pricing information for their produce batches. This feature includes:

- **Private/Public Price Settings**: Farmers can set each batch to public or private pricing
- **Request-Approval Workflow**: Consumers/distributors must request and get approval to view private prices  
- **Real-time Notifications**: Farmers receive notifications for new price access requests
- **Role-based Access Control**: Proper permission management based on user roles
- **Intuitive UI**: Clean interface with status indicators and notification badges

### Quick Start with Price Visibility

1. **Setup Test Data** (optional but recommended):
   ```bash
   npm run setup-test-data
   ```

2. **Test the System**:
   - Login as farmer (farmer@test.com / password123)
   - Create produce and set privacy to "private" 
   - Login as consumer (consumer@test.com / password123)
   - Request price access for the batch
   - Switch back to farmer to approve the request

See `PRICE_VISIBILITY_GUIDE.md` for detailed testing instructions.

## 🚀 Features

- **📝 Produce Registration**: Farmers can register new crop batches with harvest dates
- **🔄 Ownership Transfer**: Distributors can transfer produce ownership with pricing
- **📊 Complete Tracking**: View full supply chain history for any produce batch
- **🎨 Modern UI**: Beautiful, responsive interface with real-time feedback
- **🔒 Blockchain Security**: Immutable records on Ethereum-compatible blockchain

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │   Node.js API   │    │ Smart Contract  │
│   (Port 5179)    │◄──►│   (Port 3000)   │◄──►│   (Port 8545)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

- **Frontend**: React + TypeScript + Vite + Custom CSS
- **Backend**: Node.js + Express + Viem (Ethereum client)
- **Blockchain**: Hardhat local network + Solidity smart contracts

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Internal-round-main
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd web
npm install
cd ..
```

### 3. Start the Blockchain Network

```bash
# Start Hardhat local blockchain
npx hardhat node --hostname 127.0.0.1
```

**Keep this terminal open** - the blockchain must be running for the app to work.

### 4. Deploy Smart Contracts

In a **new terminal**:

```bash
# Deploy contracts to local blockchain
npx hardhat ignition deploy ./ignition/modules/SupplyChain.ts --network localhost
```

### 5. Start the Backend API

In a **new terminal**:

```bash
# Start the API server
node server.js
```

### 6. Start the Frontend

In a **new terminal**:

```bash
# Start the React development server
cd web
npm run dev
```

## 🌐 Access the Application

- **Frontend**: http://localhost:5179/
- **Backend API**: http://localhost:3000/
- **Blockchain**: http://127.0.0.1:8545/

## 📖 How to Use

### For Farmers
1. Navigate to the **Farmer** section
2. Enter crop name, quantity, and harvest date
3. Click **"Add Produce"** to register on blockchain
4. Receive a unique batch ID for tracking

### For Distributors
1. Go to the **Distributor** section
2. Enter batch ID, recipient address, and price
3. Click **"Transfer Ownership"** to update blockchain
4. Ownership is transferred with pricing information

### For Consumers
1. Visit the **Consumer** section
2. Enter a batch ID to view complete history
3. See the full supply chain journey
4. Verify authenticity and pricing

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/produce` | Add new produce batch |
| `POST` | `/transfer` | Transfer ownership |
| `GET` | `/getProduce/:id` | Get produce details and history |

## 🧪 Testing

```bash
# Run all tests
npx hardhat test

# Run Solidity tests only
npx hardhat test solidity

# Run TypeScript tests only
npx hardhat test nodejs
```

## 📁 Project Structure

```
├── contracts/           # Solidity smart contracts
│   └── SupplyChain.sol
├── ignition/           # Deployment scripts
│   └── modules/
├── web/               # React frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── server.js          # Node.js API server
├── hardhat.config.ts  # Hardhat configuration
└── package.json       # Backend dependencies
```

## 🚨 Troubleshooting

### Common Issues

**"HTTP request failed" Error**
- Ensure Hardhat node is running: `npx hardhat node --hostname 127.0.0.1`
- Check that contracts are deployed: `npx hardhat ignition deploy ./ignition/modules/SupplyChain.ts --network localhost`

**"Port already in use"**
- Kill existing processes or use different ports
- Check what's running: `netstat -ano | findstr :3000`

**Frontend not loading**
- Ensure all dependencies are installed: `npm install` in both root and `web/` directories
- Check Vite dev server is running: `cd web && npm run dev`

## 🛡️ Security Notes

- This is a **development/demo** project
- Private keys are hardcoded for local testing only
- For production, implement proper key management
- Always verify smart contract code before deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Hardhat](https://hardhat.org/) for blockchain development
- Frontend powered by [React](https://reactjs.org/) and [Vite](https://vitejs.dev/)
- Ethereum interactions via [Viem](https://viem.sh/)

---
