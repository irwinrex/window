FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

# Use clean install
RUN npm install

COPY . .

RUN npm run build
RUN npm install -g serve

CMD ["serve", "-s", "dist"]
