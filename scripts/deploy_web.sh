#!/bin/bash

# Build the Flutter web app
flutter build web

# Move the output to public
mv build/web/* public/

# Deploy to Firebase Hosting
firebase deploy --only hosting