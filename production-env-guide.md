# 🏥 Harsha Diagnostics — Production Environment & Deployment Guide

This guide details how to deploy the Harsha Diagnostics suite (Backend, Admin Dashboard, Customer App, and MLT App) to production platforms like Railway and Vercel.

---

## 🔌 Part 1: Backend API & MongoDB (Railway)

We recommend deploying the Node.js Express server to **Railway**, which includes a managed **MongoDB** database plugin.

### 1. Database Provisioning
1. Log in to [Railway.app](https://railway.app/).
2. Click **New Project** ➡️ **Provision MongoDB**.
3. Once MongoDB is ready, copy the **Mongo Connection URI** (e.g. `mongodb://mongo:password@containers-us-west.railway.app:5005/harsha-diagnostics`).

### 2. Backend Environment Variables
Create a new Node.js service in Railway linked to your repository, and set the following environment variables:

| Variable Name | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `PORT` | Listening port for Express | `5005` (or Railway default) |
| `MONGO_URI` | MongoDB Connection string | `${{MONGODB_URL}}` (Railway template variable) |
| `JWT_SECRET` | Secure key for token signatures | *Generate a secure random string* |
| `RAZORPAY_KEY_ID` | Razorpay Live/Test Key ID | `rzp_test_xxxxxx` / `rzp_live_xxxxxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay Live/Test Secret | `xxxxxx` |
| **Twilio SMS Credentials** | *(Option A)* | |
| `TWILIO_ACCOUNT_SID` | Account Identifier | `ACxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Auth Token | `xxxxxxxxxxxxxxxx` |
| `TWILIO_PHONE_NUMBER` | Sender phone number | `+1xxxxxxxxxx` |
| **MSG91 SMS Credentials** | *(Option B)* | |
| `MSG91_AUTH_KEY` | Auth Key | `xxxxxxxxxxxxxxxx` |
| `MSG91_TEMPLATE_ID` | SMS Template ID | `xxxxxxxxxxxxxxxx` |

---

## 🖥️ Part 2: Admin Dashboard (Vercel)

The React/Vite Admin Dashboard can be hosted for free on **Vercel** or **Netlify**.

### 1. Deployment Settings
*   **Build Command**: `npm run build`
*   **Output Directory**: `dist`
*   **Root Directory**: `admin-dashboard`

### 2. Environment Variables
You must configure the URL of the production Backend API so that the dashboard communicates with the live server:

| Variable Name | Description | Value |
| :--- | :--- | :--- |
| `VITE_BACKEND_URL` | Live URL of the Backend API | `https://your-backend-api.up.railway.app` |

---

## 📱 Part 3: Customer & MLT Apps (Expo Web / Vercel)

If hosting the Customer and MLT apps as static web applications, they can also be hosted on **Vercel**.

### 1. Build and Export
To compile the Expo Router applications as pure Single Page Applications (SPA) for static deployment:
- Build command: `npx expo export`
- Output directory: `dist`

### 2. Environment Variables
Both Expo apps need the backend URL configured during the build process:

#### Customer App Variables:
| Variable Name | Description | Value |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_BACKEND_URL` | Live URL of the Backend API | `https://your-backend-api.up.railway.app` |

#### MLT App Variables:
| Variable Name | Description | Value |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_BACKEND_URL` | Live URL of the Backend API | `https://your-backend-api.up.railway.app` |

---

## 📱 Part 4: Native Android / iOS Builds (EAS Build)

To compile the Customer App and MLT App into native `.apk`, `.aab`, or `.ipa` files for release on the Google Play Store and Apple App Store, use **EAS (Expo Application Services)**:

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```
2. **Log In to Expo**:
   ```bash
   eas login
   ```
3. **Configure Project**:
   ```bash
   eas build:configure
   ```
4. **Trigger Build**:
   *   For Android: `eas build --platform android --profile production`
   *   For iOS: `eas build --platform ios --profile production`
