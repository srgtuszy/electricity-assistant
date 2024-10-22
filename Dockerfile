FROM --platform=linux/amd64 dart:stable AS build

WORKDIR /app

# Install necessary dependencies
RUN apt-get update && apt-get install -y curl git unzip xz-utils zip libglu1-mesa

# Download and install Flutter SDK
RUN curl -L https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.24.3-stable.tar.xz | tar xJ
ENV PATH="/app/flutter/bin:${PATH}"

# Copy the Flutter project files to the container
COPY . .

# Enable Flutter web
RUN git config --global --add safe.directory /app/flutter
RUN flutter upgrade
RUN flutter config --enable-web

# Get Flutter packages
RUN flutter pub get

# Build the web release version
RUN flutter build web --release

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy the built app from the previous stage
COPY --from=build /app/build/web /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]