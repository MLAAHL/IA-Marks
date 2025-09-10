# IA-MARKS MANAGEMENT SYSTEM

A comprehensive Node.js application for managing Internal Assessment (IA) marks with Firebase authentication and MongoDB database.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB instance
- Firebase project with authentication enabled

### Installation & Setup

1. **Clone and Navigate to Project**
   ```bash
   cd Final_ia_marks
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   The project uses a `.env` file for all configuration. Ensure your `.env` file contains:

   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

   # API Base URL for backend
   NEXT_PUBLIC_API_URL=http://localhost:5000/api

   # MongoDB Connection String
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000

   # Firebase Service Account Path
   FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
   ```

4. **Firebase Service Account Setup**
   
   Place your Firebase service account JSON file in the `config/` directory as `firebase-service-account.json`.

### Running the Application

#### Development Mode
```bash
npm run dev
```
or
```bash
npm start
```

#### Production Mode
```bash
NODE_ENV=production npm start
```

The application will be available at:
- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api
- **Environment Variables Endpoint**: http://localhost:5000/api/env

## 🔧 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API Key | `AIzaSyD...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID | `my-project-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `project.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `123456789` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID | `1:123:web:abc123` |
| `MONGODB_URI` | MongoDB Connection String | `mongodb+srv://...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server Port | `5000` |
| `NODE_ENV` | Environment Mode | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Firebase Service Account | `./config/firebase-service-account.json` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase Analytics ID | Optional |

## 🏗️ Architecture

### Backend Structure
- **Server.js**: Main entry point with dotenv configuration
- **Routes**: API endpoints for academic data, teachers, and subjects
- **Models**: MongoDB schemas for data structures
- **Config**: Firebase service account and configuration files

### Frontend Structure
- **Public**: HTML files with environment-aware JavaScript
- **Assets**: CSS and JavaScript files including environment loader
- **Components**: Reusable HTML components

### Environment Loading System
The application uses a sophisticated environment loading system:

1. **Server-side**: `dotenv` loads variables from `.env` file
2. **Client-side**: Environment variables are served via `/api/env` endpoint
3. **Frontend**: `env-loader.js` fetches and makes variables globally available
4. **Firebase**: Configuration is dynamically loaded from environment variables

## 🔒 Security Features

- ✅ No hardcoded credentials in source code
- ✅ Environment variables for all sensitive data
- ✅ Firebase Admin SDK with service account authentication
- ✅ CORS configuration with environment-based origins
- ✅ Secure token-based authentication

## 📁 Project Structure

```
Final_ia_marks/
├── .env                          # Environment variables (DO NOT COMMIT)
├── server.js                     # Main server entry point
├── package.json                  # Dependencies and scripts
├── config/
│   └── firebase-service-account.json  # Firebase service account
├── routes/
│   ├── academic.js              # Academic data routes
│   ├── teacher.js               # Teacher management routes
│   └── subjects.js              # Subject management routes
├── models/
│   ├── Academic.js              # Academic year model
│   ├── Stream.js                # Stream model
│   ├── Student.js               # Student model
│   ├── Subject.js               # Subject model
│   └── Teacher.js               # Teacher model
├── public/
│   ├── index.html               # Login page
│   ├── dashboard.html           # Teacher dashboard
│   ├── subject-dashboard.html   # Subject management
│   ├── subject-selection.html   # Subject selection
│   └── report-generator.html    # Report generation
└── assets/
    ├── css/                     # Stylesheets
    └── js/
        ├── env-loader.js        # Environment variables loader
        ├── firebase-config.js   # Firebase configuration
        ├── auth.js              # Authentication logic
        └── dashboard.js         # Dashboard functionality
```

## 🚀 Deployment

### Environment Setup for Production

1. Set `NODE_ENV=production` in your production environment
2. Update `FRONTEND_URL` to your production domain
3. Use production MongoDB URI
4. Ensure Firebase service account is properly configured

### Vercel/Netlify Deployment

Add all environment variables to your deployment platform's environment configuration.

## 🛠️ Development

### Adding New Environment Variables

1. Add the variable to `.env` file
2. If it's a client-side variable, add it to the `/api/env` endpoint in `server.js`
3. Update this README with the new variable documentation

### Database Seeding

To seed the database with sample data:
```bash
node seed.js
```

## 📝 API Endpoints

- `GET /api/env` - Environment variables for frontend
- `GET /api/status` - Server status and database connection
- `POST /api/teachers/checkOrCreate` - Teacher authentication
- `GET /api/academic/streams` - Available streams
- `GET /api/subjects` - Subject management

## 🔍 Troubleshooting

### Common Issues

1. **Firebase Service Account Error**
   - Ensure `firebase-service-account.json` exists in `config/` directory
   - Check `FIREBASE_SERVICE_ACCOUNT_PATH` environment variable

2. **MongoDB Connection Error**
   - Verify `MONGODB_URI` is correct
   - Check network connectivity and database permissions

3. **Environment Variables Not Loading**
   - Ensure `.env` file is in project root
   - Check that `dotenv` is properly configured in `server.js`

### Debug Mode

Set `NODE_ENV=development` for detailed error messages and stack traces.

## 📄 License

This project is licensed under the MIT License.
