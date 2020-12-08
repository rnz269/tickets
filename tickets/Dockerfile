# Specify our base image
FROM node:alpine

# Set working directory of container
WORKDIR ./app

# Install production dependencies (not dev-dependencies)
COPY ./package.json ./
RUN npm install --only=prod
COPY ./ ./

# Specify start-up command
CMD ["npm", "start"]