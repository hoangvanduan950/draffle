# 🎯 Draffle - Decentralized Raffle Platform

Draffle is a decentralized raffle platform built on the Internet Computer. Users can create raffles with custom prizes and durations, while participants can buy entries using ICRC1 tokens. Winners are selected automatically using secure randomness.

## ✨ Features

- **🎪 Create Raffles**: Set up raffles with custom titles, entry prices, and durations
- **🎫 Buy Entries**: Purchase raffle entries using ICRC1 tokens
- **🏆 Automatic Winners**: Fair winner selection using IC's secure randomness
- **💰 Token Integration**: Full ICRC1 token support with approval flow
- **📱 Modern UI**: Beautiful, responsive interface with Material Design
- **⏰ Live Updates**: Real-time countdown timers and status updates
- **👤 Account Management**: Track your created raffles and participation history

## 🚀 Quick Start

### Prerequisites

- [DFX](https://internetcomputer.org/docs/current/developer-docs/setup/install) (version 0.15.0 or later)
- [Node.js](https://nodejs.org/) (version 18 or later)
- [Git](https://git-scm.com/)

### Installation

1. **Clone and navigate to the project**:
   ```bash
   cd Draffle/
   ```

2. **Install dependencies**:
   ```bash
   npm install
   cd src/Draffle_frontend && npm install && cd ../..
   ```

## 🏗️ Development Setup

### 1. Start the Internet Computer Replica

```bash
# Start the local IC replica
dfx start --background
```

### 2. Deploy the ICRC1 Ledger (Required for Token Operations)

```bash
# Deploy the local ledger for testing
./scripts/setup_ledger.sh
```

### 3. Deploy Draffle Canisters

```bash
# Deploy the backend and frontend canisters
dfx deploy
```

### 4. Start the Frontend Development Server

```bash
# Start the frontend with hot reload
cd src/Draffle_frontend
npm start
```

The application will be available at `http://localhost:3000`

## 🧪 Testing with Tokens

Since Draffle uses ICRC1 tokens, you need test tokens to create raffles. The Internet Identity principal is different from your dfx identity.

### Step 1: Get Your Internet Identity Principal

1. Open the app at `http://localhost:3000`
2. Click "🔐 Connect Wallet"
3. Create or log in with Internet Identity
4. Copy your principal ID from the navigation (shows as `abc123...xyz789`)

### Step 2: Transfer Test Tokens

Use the included script to transfer tokens to your Internet Identity:

```bash
# Transfer 10,000 test tokens to your Internet Identity principal
./scripts/transfer_tokens.sh YOUR_INTERNET_IDENTITY_PRINCIPAL

# Example:
./scripts/transfer_tokens.sh rdmx6-jaaaa-aaaah-qcaiq-cai

# Or specify a custom amount (in e8s format):
./scripts/transfer_tokens.sh rdmx6-jaaaa-aaaah-qcaiq-cai 5000000000000
```

### Step 3: Test Raffle Creation

1. Refresh the Draffle app
2. Your balance should now show the transferred tokens
3. Click "✨ Create Raffle" to test the functionality

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `./scripts/setup_ledger.sh` | Deploy local ICRC1 ledger canister |
| `./scripts/transfer_tokens.sh <principal> [amount]` | Transfer tokens to a principal |
| `dfx deploy` | Deploy all canisters |
| `dfx start --background` | Start local IC replica |
| `npm start` | Start frontend development server |

## 📁 Project Structure

```
Draffle/
├── src/
│   ├── Draffle_backend/          # Motoko backend canister
│   │   ├── main.mo              # Main raffle logic
│   │   └── utils.mo             # Utility functions
│   └── Draffle_frontend/         # React frontend
│       ├── src/
│       │   ├── components/      # React components
│       │   ├── styles/         # SCSS styles
│       │   └── utils/          # Frontend utilities
│       └── public/             # Static assets
├── scripts/                     # Helper scripts
│   ├── setup_ledger.sh         # Ledger setup
│   └── transfer_tokens.sh      # Token transfer
└── dfx.json                    # DFX configuration
```

## 🎮 How to Use

### Creating a Raffle

1. **Connect Wallet**: Click "🔐 Connect Wallet" and authenticate with Internet Identity
2. **Get Tokens**: Use the transfer script to get test tokens
3. **Create Raffle**: Click "✨ Create Raffle"
4. **Configure**:
   - Set a catchy title
   - Choose entry price (minimum 1 ICP)
   - Set initial prize contribution
   - Select duration (supports precise times like 1h15m)
5. **Launch**: Click "🚀 Create Raffle"

### Participating in Raffles

1. **Browse Raffles**: View all available raffles on the homepage
2. **Select Raffle**: Click on any raffle card to view details
3. **Buy Entries**: Choose how many entries to purchase
4. **Wait for Results**: Winner is automatically selected when the raffle ends

### Managing Your Activity

- **My Account**: View your created raffles, participation history, and winnings
- **Balance**: Check your current token balance
- **History**: Track all your raffle activities

## 🔑 Key Features

### Smart Duration Selection
- **Preset Options**: Quick selection (5min, 15min, 30min, 1hr, 2hr, 1day)
- **Precise Control**: Set exact times like 1h15m using separate hour/minute inputs
- **User-Friendly**: Intuitive +/- buttons for fine-tuning

### Secure Token Operations
- **ICRC1 Integration**: Full support for ICRC1 token standard
- **Approval Flow**: Secure token approval before transfers
- **Balance Checking**: Real-time balance updates

### Fair Winner Selection
- **Cryptographic Randomness**: Uses IC's secure random number generation
- **Transparent Process**: All operations are verifiable on-chain
- **Automatic Execution**: Winners selected automatically when raffles end

## 🎨 UI/UX Highlights

- **Material Design**: Clean, modern interface following Google's Material Design
- **Responsive**: Works perfectly on desktop, tablet, and mobile
- **Accessible**: High contrast ratios and keyboard navigation
- **Real-time Updates**: Live countdown timers and status indicators
- **Visual Feedback**: Clear loading states and error messages

## 🚀 Production Deployment

For production deployment on the Internet Computer mainnet:

1. **Configure for Mainnet**:
   ```bash
   dfx deploy --network ic
   ```

2. **Update Frontend URLs**: Ensure all canister URLs point to mainnet
3. **Set up Real ICRC1 Ledger**: Configure with actual ICP ledger canister
4. **Test Thoroughly**: Run comprehensive tests before launch

## 📞 Support

For questions or issues:
- Check the [Internet Computer Documentation](https://internetcomputer.org/docs/)
- Review the [Motoko Language Guide](https://internetcomputer.org/docs/current/motoko/main/motoko)
- Join the [IC Developer Community](https://forum.dfinity.org/)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
