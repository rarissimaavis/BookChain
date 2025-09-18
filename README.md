# 📚 BookChain
A decentralized application to create and manage book clubs where members can propose new titles, vote on what to read next, and share discussions and posts — all secured on-chain by smart contracts.

## ✨ Features
- **Create/Join Clubs**: Start a club or join existing ones
- **Book Proposals**: Suggest titles with authors
- **Voting**: One member, one vote per proposal
- **Posts & Discussions**: Share thoughts on books
- **Wallet-Based Access**: Actions tied to your wallet

## 🚀 Installation & Setup
Prerequisites: Node.js, MetaMask, Hardhat

1) Install dependencies
```bash
npm install
```

2) Start a local Hardhat node
```bash
npx hardhat node
```

3) Deploy the smart contract (new terminal)
```bash
npx hardhat run scripts/deploy.js --network localhost
```

4) Update the contract address in the frontend
- Edit `frontend/app.js`
- Replace the value of `this.contractAddress` with the deployed address

5) Run the frontend
```bash
npx http-server frontend -p 8080 -o
```

## 🔧 MetaMask Configuration
- Network name: Localhost 8545
- RPC URL: http://127.0.0.1:8545
- Chain ID: 31337
- Currency symbol: ETH
- Import a test account using a private key from the Hardhat node output

## 🧰 Tech Stack
- 🧾 **Solidity**: Smart contracts
- 🛠️ **Hardhat**: Development & local chain
- 🔷 **Ethers.js**: Blockchain interaction
- 🦊 **MetaMask**: Wallet & signing
- 🟧 **HTML5** • 🎨 **CSS3** • 🟨 **JavaScript**