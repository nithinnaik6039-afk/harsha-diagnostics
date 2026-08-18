# 📦 Harsha Diagnostics — Complete 3-App Android APK Generation & Download Guide

This guide explains how to generate, download, and install standalone `.apk` files for all three applications:
1. 🏥 **Customer App** (`com.harshadiagnostics.customer`)
2. 🩺 **MLT Phlebotomist App** (`com.harshadiagnostics.mlt`)
3. 👑 **Admin Command Center App** (`com.harshadiagnostics.admin`)

---

## ⚡ Quick 1-Command Interactive Builder

You can run our all-in-one builder menu directly from your project root:

```bash
cd "/Users/palthiyanithinnaik/HARSHA-DIAGNOSTIC CENTRE_"
./build-apks.sh
```

---

## 🚀 Step-by-Step Instructions to Generate & Download Each APK

### 🔑 Step 0: Free Expo Login (One-Time Setup)
All builds use Expo Application Services (EAS) cloud infrastructure. You only need to login once:
```bash
npx -y eas-cli login
```
*(If you don't have an Expo account yet, register free at [expo.dev/signup](https://expo.dev/signup) in 30 seconds).*

---

### 🏥 1. Customer App APK (`customer-app.apk`)

To generate the standalone Android APK for the Customer Booking & Diagnostic Reports app:

```bash
cd "/Users/palthiyanithinnaik/HARSHA-DIAGNOSTIC CENTRE_/customer-app"
npx -y eas-cli build --platform android --profile preview
```

#### What happens:
1. If prompted *"Generate a new Android Keystore?"*, press **Enter** (Yes).
2. Expo cloud runners compile the native Android APK package (~2–4 minutes).
3. When complete, the terminal displays:
   - 🔗 **Direct APK Download Link** (e.g., `https://expo.dev/artifacts/eas/...apk`)
   - 📱 **QR Code** (Scan with your phone camera to download directly to your mobile)

---

### 🩺 2. MLT Phlebotomist App APK (`mlt-app.apk`)

To generate the standalone Android APK for the Field Technician & Phlebotomist app:

```bash
cd "/Users/palthiyanithinnaik/HARSHA-DIAGNOSTIC CENTRE_/mlt-app"
npx -y eas-cli build --platform android --profile preview
```

#### What happens:
1. If prompted *"Generate a new Android Keystore?"*, press **Enter** (Yes).
2. Expo builds the dedicated MLT technician APK.
3. Download via the generated URL or scan the terminal QR code.

---

### 👑 3. Admin Command Center App APK (`admin-app.apk`)

To generate the standalone Android APK for the Admin Command Center:

```bash
cd "/Users/palthiyanithinnaik/HARSHA-DIAGNOSTIC CENTRE_/admin-app"
npx -y eas-cli build --platform android --profile preview
```

#### What happens:
1. If prompted *"Generate a new Android Keystore?"*, press **Enter** (Yes).
2. Expo packages the full Admin Command Center mobile wrapper into an Android APK.
3. Download via the generated URL or scan the terminal QR code.

---

## 📥 How to Download & Install on Your Android Phone

1. **Download the APK file**:
   - **On Computer**: Open the generated `expo.dev/artifacts/eas/...apk` link in your browser to save the `.apk` file, then transfer it to your phone via USB, Google Drive, or WhatsApp.
   - **Directly on Mobile**: Scan the QR code shown in your terminal with your phone camera, or open the link directly in your mobile browser.
2. **Install the APK**:
   - Open your phone's **Files / Downloads** app and tap the downloaded `.apk` file.
   - If Android shows *"For your security, your phone is not allowed to install unknown apps from this source"*:
     - Tap **Settings** ➡️ Enable **Allow from this source** ➡️ Tap **Install**.
3. **Launch & Use**:
   - The app icon will appear on your Android home screen and app drawer.

---

## 🌐 Instant WebAPK Installation (Zero Wait Time)

If you want to install any of the apps immediately onto your Android device without waiting for cloud builds:

1. Connect your Android phone to the same Wi-Fi network (`192.168.0.158`).
2. Open Google Chrome on your phone and visit:
   - **Customer App**: [http://192.168.0.158:8081](http://192.168.0.158:8081)
   - **MLT App**: [http://192.168.0.158:8082](http://192.168.0.158:8082)
   - **Admin App**: [http://192.168.0.158:5173](http://192.168.0.158:5173)
3. Tap the **3-dot menu (⋮)** in Chrome ➡️ Tap **"Install App"** (or **"Add to Home Screen"**).
4. Android Google Play Services will automatically package and install a real, full-screen **native Android app icon** on your mobile home screen.
