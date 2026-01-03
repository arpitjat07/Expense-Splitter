# Expense Splitter

A web-based application for managing and splitting expenses among groups. This application allows users to create trips, add members, track shared expenses, and automatically calculate optimal settlements to minimize the number of transactions required.

## Overview

Expense Splitter is a client-side web application built with vanilla web technologies and Firebase. It runs entirely in the browser without the need for a dedicated backend server. Users can access their data from any device by logging in with their account.

## Features

### Trip Management
- Create and manage multiple distinct trips.
- View active and completed trips on a dashboard.
- Mark trips as completed when finished.
- Delete trips and all associated data.

### Member Management
- Add members to a trip.
- Edit member details (updates reflect everywhere).
- Remove members if they have no associated expenses.
- Alphabetical sorting of member lists for easy access.

### Expense Tracking
- Record expenses with description, amount, and payer.
- Support for "Equal" splits (automatically divides amount).
- Support for "Manual" splits (assign specific amounts).
- Edit and delete existing expenses.
- Real-time updates of total spending.

### Settlement Calculations
- Automatically calculates "who owes whom".
- Uses an algorithm to minimize the total number of transactions.
- Displays individual spending summaries (Paid vs. Share).
- Generates clear settlement instructions.

### User Authentication
- Secure login and signup functionality.
- Username-based authentication.
- Password visibility toggle.
- Persistent login sessions.

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+).
- **Backend Services**: Firebase Authentication, Firebase Firestore.
- **Hosting**: Can be hosted on any static site provider (GitHub Pages, Netlify, Firebase Hosting).

## Project Structure

The project uses a flat generic structure for easy deployment:

- `index.html`: The main application interface for a specific trip.
- `dashboard.html`: The user dashboard showing all trips.
- `login.html`: The authentication page (Login/Signup).
- `script.js`: Core logic for the expense tracker and trip management.
- `dashboard.js`: Logic for the dashboard and trip loading.
- `login.js`: Logic for authentication.
- `firebase-config.js`: Firebase configuration file.
- `style.css`: Global styles shared across the application.
- `dashboard.css`: Styles specific to the dashboard.
- `login.css`: Styles specific to the login page.

## Setup and Installation

### Prerequisites
- A modern web browser.
- An internet connection.

### Configuration
1. Create a project in the Firebase Console.
2. Enable **Authentication** (Email/Password provider).
3. Enable **Cloud Firestore** database.
4. Update `firebase-config.js` with your Firebase project credentials:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Running the Application
Since this is a client-side application, you can run it in several ways:

**Option 1: Local Development**
Open `login.html` directly in your web browser. Note that some browsers may block certain features when opening files directly; using a local server is recommended.

**Option 2: Local Server (Python)**
If you have Python installed, run a simple HTTP server in the project directory:
```
python -m http.server
```
Then navigate to `http://localhost:8000/login.html`.

**Option 3: Deployment**
Upload all files to a static hosting provider like GitHub Pages or Netlify.

## Usage Guide

1. **Sign Up**: specific a username, name, and password on the login page.
2. **Create Trip**: On the dashboard, click "New Trip" and give it a name.
3. **Add Members**: Open the trip and use the "Add Member" form to list all participants.
4. **Add Expenses**: Use the expense form to record spending. Select the payer and split method.
5. **View Settlements**: Scroll down to the "Who Owes Whom" section to see the calculated debts.

## Browser Support

- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari

## Future Goals

- **Export Options**: Functionality to export trip data and settlements to PDF or CSV.
- **Multi-Currency Support**: Ability to handle expenses in multiple currencies with real-time conversion.
- **Receipt Integration**: Option to upload and attach photos of receipts to specific expenses.
- **Recurring Expenses**: Support for repeating expenses such as monthly subscriptions.

## License

This project is open-source and available for personal and educational use.
