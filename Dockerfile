# Use the official Node 20 slim image
FROM node:20-slim

# Set the working directory
WORKDIR /app

# Copy root package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy backend package files and install backend dependencies
COPY backend/package.json backend/package-lock.json* ./backend/
RUN npm install --prefix backend

# Copy the rest of the application files
COPY . .

# Expose the port Hugging Face expects (7860)
ENV PORT=7860
EXPOSE 7860

# Start the unified server
CMD ["npm", "start"]
