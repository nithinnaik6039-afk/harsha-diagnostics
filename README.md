# 🩸 Harsha Diagnostics — Complete Healthcare Ecosystem

> **On-Demand Home Sample Collection & NABL-Certified Diagnostic Laboratory Platform**

---

## 🌟 Overview

Harsha Diagnostics is a hyper-local healthcare ecosystem connecting patients, mobile phlebotomists (MLTs), and central diagnostic laboratories in real-time.

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────────┐
│  Customer App   │      │     MLT App     │      │   Admin Dashboard   │
│  (Expo Mobile)  │      │  (Expo Mobile)  │      │    (React + Vite)   │
└────────┬────────┘      └────────┬────────┘      └──────────┬──────────┘
         │                        │                          │
         └────────────────────────┼──────────────────────────┘
                                  │ HTTPS & Socket.io
                                  ▼
                   ┌───────────────────────────────┐
                   │       Node.js Backend         │
                   │    (Express 5 + Socket.io)    │
                   └──────────────┬────────────────┘
                                  │
                                  ▼
                   ┌───────────────────────────────┐
                   │       MongoDB Database        │
                   │    (9 Schemas + 2dsphere)     │
                   └───────────────────────────────┘
```

---

## 📱 Key Applications

### 1. 🏥 Customer Mobile App (`customer-app/`)
* **Instant Booking**: Book blood, urine, and pathology tests in < 60 seconds.
* **Bilingual UI**: 1-tap switching between **Telugu (తెలుగు)** and **English**.
* **Prescription OCR**: Scan doctor prescriptions with camera to auto-populate the cart.
* **Live Phlebotomist Radar**: Real-time GPS tracking of phlebotomist traveling to patient doorstep.
* **Smart Health Reports**: Visual color-coded health indicator graphs (Normal, Borderline, Risk).
* **Payment Modes**: Integrated Razorpay (UPI, Cards, Netbanking) + Cash on Collection.

### 2. 🩺 MLT (Phlebotomist) Mobile App (`mlt-app/`)
* **Instant Dispatch Alert**: 30-second audio-visual dispatch alert with patient distance and test count.
* **Tube Order of Draw**: Visual guide for EDTA (Purple), SST (Yellow), Fluoride (Grey), and Citrate (Blue).
* **Cold-Chain Monitor**: Continuous sample temperature tracking (2°C – 8°C safety lock).
* **Vein Scanner HUD**: High-contrast camera filter assisting in difficult vein location.
* **Digital Consent Pad**: Captures patient touch signature before phlebotomy puncture.
* **Offline Sync Engine**: Works seamlessly in rural/low-connectivity areas with automatic data sync.

### 3. 👑 Admin Command Center (`admin-dashboard/`)
* **Fleet Live Radar Map**: Interactive GPS map tracking all active phlebotomists in the field.
* **Kanban Dispatch Board**: Live status transitions (`Pending` ➔ `Assigned` ➔ `En Route` ➔ `In Lab` ➔ `Completed`).
* **Test Catalog Manager**: Dynamic pricing, fasting requirements, and Telugu translations.
* **Staff Roster & KYC**: Verification of MLT medical council certificates and ratings.
* **Financial Analytics**: Revenue charts, peak booking hours, and COD reconciliation.

---

## 🛠️ Tech Stack

* **Backend**: Node.js, Express 5.x, Socket.io, Mongoose 9.x, JWT, Razorpay SDK, Expo Server SDK.
* **Database**: MongoDB with 2dsphere geospatial indexing.
* **Mobile Apps**: Expo SDK, React Native 0.86, Expo Router, React Native Reanimated, Zustand.
* **Admin Web**: React 19, Vite 8, Tailwind CSS, Chart.js.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
npm --prefix customer-app install
npm --prefix mlt-app install
npm --prefix admin-dashboard install
```

### 2. Start Services
```bash
# Start Backend API (Port 5005)
npm start

# Start Admin Dashboard (Port 5173)
npm run admin

# Start Customer Mobile App Web (Port 8081)
npm run customer

# Start MLT Phlebotomist App Web (Port 8082)
npm run mlt
```

---

## 📦 Standalone Android APK Generation

All 3 apps are pre-configured for standalone `.apk` compilation via Expo Application Services (EAS):

```bash
# Run the 1-click interactive APK builder
./build-apks.sh
```

Or build individually:
* **Customer APK**: `npm run build:apk:customer`
* **MLT APK**: `npm run build:apk:mlt`
* **Admin APK**: `npm run build:apk:admin`

---

## 📄 Documentation & Presentation

* 📖 **Full Technical Documentation**: [`HARSHA_DIAGNOSTICS_FULL_PROJECT_DOCUMENTATION.txt`](HARSHA_DIAGNOSTICS_FULL_PROJECT_DOCUMENTATION.txt)
* 🖥️ **Interactive Slide Deck**: Double-click [`HARSHA_DIAGNOSTICS_PRESENTATION.html`](HARSHA_DIAGNOSTICS_PRESENTATION.html) in your browser.
* 📝 **Presentation Script**: [`HARSHA_DIAGNOSTICS_PRESENTATION_SLIDES.txt`](HARSHA_DIAGNOSTICS_PRESENTATION_SLIDES.txt)

---

## 📜 License
ISC © 2026 Harsha Diagnostics. All Rights Reserved.
