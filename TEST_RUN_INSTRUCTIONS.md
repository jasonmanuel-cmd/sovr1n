# Sovr1n Delivery App - Test Run Instructions

## Prerequisites
- Flutter SDK installed (version 3.0.0 or higher)
- Android Studio / Xcode / VS Code with Flutter plugins
- An emulator or physical device for testing

## Setup Instructions

1. **Clone or copy the project** to your local machine

2. **Install dependencies**:
   ```
   flutter pub get
   ```

3. **Run the app**:
   ```
   flutter run
   ```

   For web testing:
   ```
   flutter run -d chrome
   ```

   For a specific device:
   ```
   flutter devices  # List available devices
   flutter run -d <device_id>
   ```

## What You'll See

### Initial Screen
- Login screen with email/password fields
- Register link for new users
- App title: "Sovr1n Delivery"

### Demo Accounts (for testing)
Since we're using mock services in this version, you can use any credentials:
- Email: `test@example.com`
- Password: `password`

### Main Features to Test

#### 1. Authentication Flow
- Login with any credentials
- Register new account
- View mock user data in console/logs

#### 2. Delivery Request Creation (Customer Flow)
After login, you would normally see:
- Available deliveries list (empty initially)
- Floating action button to create new delivery request
- Form to fill out:
  - Item description
  - Pickup/drop-off addresses
  - Pickup time
  - Weight and dimensions
  - Your offer price

#### 3. Driver Flow (Available Deliveries)
- List of nearby delivery requests
- Each card shows:
  - Item description
  - Route (pickup → dropoff)
  - Customer's offer price (if set)
  - Weight/volume info
  - "Negotiate Price" button (opens price setting UI)
  - "Accept" button

#### 4. Price Negotiation
- Set your price per load as a driver
- See customer's offer price
- Visual feedback when prices match (deal possible)
- Price gap display when negotiating

#### 5. Location Tracking
- After accepting a delivery:
  - Map view showing driver location (simulated)
  - Start/stop tracking button
  - Last updated timestamp
  - Delivery details panel
  - Complete delivery button (when in progress)

#### 6. Ratings System
- After completing a delivery:
  - Option to rate the other party
  - 1-5 star rating system
  - Optional comment field
  - Submit rating button

## Testing Notes

### Mock Services
This version uses mock services that simulate API calls. All data is stored in-memory and reset when the app restarts.

### What's Simulated
- User authentication
- Delivery request creation/fetching
- Price setting (user offer/driver price)
- Location updates (simulated periodic movement)
- Delivery completion with payment processing
- Rating submission and retrieval

### What Would Need Backend
For a production version, you would need to implement:
- Actual API endpoints for all services
- Real database storage
- Authentication service (Firebase/Auth0/etc)
- Payment processing integration
- Real-time location updates (WebSocket/Firebase)
- Push notification service

## Next Steps for Production

1. **Replace mock services** with actual API implementations
2. **Add Firebase** for authentication and cloud messaging
3. **Integrate Google Maps SDK** for real maps
4. **Add image picker** for item photos
5. **Implement offline storage** with Hive/Sembast
6. **Set up CI/CD** for automated testing
7. **Add analytics** (Firebase Analytics or similar)

## Troubleshooting

If you encounter issues:
1. Run `flutter pub get` again
2. Check for Dart analysis errors in VS Code/Android Studio
3. Ensure your emulator/device is properly connected
4. Try `flutter clean` then `flutter pub get` then `flutter run`

For web-specific issues, try:
```
flutter run -d chrome --web-renderer html
```

---
*Built following Flutter architectural best practices with strict separation of concerns, MVVM pattern, repository pattern, and feature-based organization.*