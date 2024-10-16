# Use an official Node.js runtime as the base image
FROM node:22

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json /app

# Install the application dependencies
RUN npm install

# Copy the rest of the application files
COPY . /app

# Load environment variables
ARG PORT
ENV PORT=${PORT}

# Expose the port from .env (defaults to 3000 if not specified)
EXPOSE ${PORT}

# Start the Node.js server
CMD ["node", "index.js"]
