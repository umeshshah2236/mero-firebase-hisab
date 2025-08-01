# Mero Hisab - Personal Finance Management App

A comprehensive personal finance management application built with React Native and Expo, featuring loan tracking, customer management, and financial calculations.

## 🚀 Key Features

### 📱 Offline-First Architecture
- **Offline Mode**: Use the app without internet connection
- **Local Data Storage**: All data is cached locally using AsyncStorage
- **Sync When Online**: Changes made offline are automatically synced when connection is restored
- **Network Status Indicator**: Real-time network connectivity status
- **Pending Operations**: Track and sync pending changes

### 🔐 Authentication
- Phone number-based authentication with OTP
- Secure session management
- Offline authentication state preservation

### 💼 Business Management
- Customer management (add, edit, delete)
- Loan tracking with repayment schedules
- Transaction entries (give/receive)
- Financial calculations and reports

### 🎨 User Experience
- Modern, responsive design
- Dark/Light theme support
- Multi-language support (English/Nepali)
- Smooth animations and transitions
- Touch-optimized interface

## 📋 Offline Functionality

The app is designed to work seamlessly both online and offline:

### When Online:
- Real-time data synchronization
- Immediate server updates
- Live data fetching

### When Offline:
- Full app functionality
- Local data storage and retrieval
- Pending operations queue
- Automatic sync when connection restored

### Network Status:
- Real-time connectivity monitoring
- Visual indicators for offline/online status
- Manual sync options
- Pending changes tracking

## 🛠 Technical Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase (Firestore + Authentication)
- **Storage**: AsyncStorage for offline data
- **State Management**: React Context API
- **Navigation**: Expo Router
- **UI Components**: Custom components with Lucide React Native icons

## 🔧 Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables for Firebase
4. Run the app: `npm start`

## 📱 Platform Support

- **iOS**: Full support with offline capabilities
- **Android**: Full support with offline capabilities
- **Web**: Limited support (authentication features)

## 🔄 Sync Mechanism

The app uses a sophisticated sync mechanism:

1. **Local Storage**: All data is cached locally
2. **Pending Operations**: Offline changes are queued
3. **Auto-Sync**: Automatic synchronization when online
4. **Conflict Resolution**: Smart handling of data conflicts
5. **User Feedback**: Clear indication of sync status

## 🎯 Use Cases

Perfect for:
- Small business owners
- Personal loan tracking
- Customer relationship management
- Financial record keeping
- Offline-first environments
