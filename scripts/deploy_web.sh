#!/bin/bash

# Remove the public directory contents
rm -rf public/*

# Remove the build directory contents
rm -rf build/web/*

# Build the Flutter web app
flutter build web --release

# Move the output to public
mv build/web/* public/

# Deploy to Firebase Hosting
firebase deploy --only hosting
