#!/bin/bash

# Harsha Diagnostics - Complete 3-App Android APK Build Helper
# Customer App | MLT Phlebotomist App | Admin App

set -e

echo "============================================================"
echo "🩸 HARSHA DIAGNOSTICS — ANDROID APK BUILD GENERATOR"
echo "============================================================"
echo ""
echo "Select which APK you want to build:"
echo "  1) 🏥 Customer App APK  (com.harshadiagnostics.customer)"
echo "  2) 🩺 MLT App APK       (com.harshadiagnostics.mlt)"
echo "  3) 👑 Admin App APK     (com.harshadiagnostics.admin)"
echo "  4) 🚀 Build All 3 APKs sequentially"
echo "  5) 🔑 Login to Expo (EAS)"
echo ""
read -p "Enter choice [1-5]: " choice

PROJECT_DIR="/Users/palthiyanithinnaik/HARSHA-DIAGNOSTIC CENTRE_"

case $choice in
  1)
    echo ""
    echo "🔨 Building Customer App APK..."
    cd "$PROJECT_DIR/customer-app"
    npx -y eas-cli build --platform android --profile preview
    ;;
  2)
    echo ""
    echo "🔨 Building MLT App APK..."
    cd "$PROJECT_DIR/mlt-app"
    npx -y eas-cli build --platform android --profile preview
    ;;
  3)
    echo ""
    echo "🔨 Building Admin App APK..."
    cd "$PROJECT_DIR/admin-app"
    npx -y eas-cli build --platform android --profile preview
    ;;
  4)
    echo ""
    echo "🔨 [1/3] Building Customer App APK..."
    cd "$PROJECT_DIR/customer-app"
    npx -y eas-cli build --platform android --profile preview

    echo ""
    echo "🔨 [2/3] Building MLT App APK..."
    cd "$PROJECT_DIR/mlt-app"
    npx -y eas-cli build --platform android --profile preview

    echo ""
    echo "🔨 [3/3] Building Admin App APK..."
    cd "$PROJECT_DIR/admin-app"
    npx -y eas-cli build --platform android --profile preview

    echo ""
    echo "✅ All 3 APK builds triggered successfully!"
    ;;
  5)
    echo ""
    echo "🔑 Logging in to Expo..."
    npx -y eas-cli login
    ;;
  *)
    echo "❌ Invalid option selected."
    exit 1
    ;;
esac
