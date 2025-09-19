@echo off
echo 🚀 Starting your web app...

:: Step 1: Install backend dependencies
echo 📦 Installing backend dependencies...
call npm install

:: Step 2: Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd web
call npm install
cd ..

:: Step 3: Start Hardhat local blockchain
echo ⛓️ Starting Hardhat blockchain...
start powershell -NoExit -Command "npx hardhat node --hostname 127.0.0.1"

timeout /t 5 >nul

:: Step 4: Deploy Smart Contracts
echo 📜 Deploying smart contracts...
start powershell -NoExit -Command "npx hardhat ignition deploy ./ignition/modules/SupplyChain.ts --network localhost"

:: Step 5: Start Backend API
echo 🖥️ Starting backend server...
start powershell -NoExit -Command "node server.js"

:: Step 6: Start Frontend
echo 🌐 Starting frontend...
start powershell -NoExit -Command "cd web; npm run dev"

echo ✅ All services started in new windows!
pause