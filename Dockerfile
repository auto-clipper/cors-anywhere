FROM node:22.23.4-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY lib/ ./lib/
COPY server.js ./

EXPOSE 8080

CMD ["node", "server.js"]
