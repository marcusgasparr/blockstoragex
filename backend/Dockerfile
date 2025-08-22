FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build || exit 1
RUN ls -l dist || echo 'dist não existe'

RUN npm ci --only=production && npm cache clean --force

RUN mkdir -p /app/storage

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["npm", "start"]

ENV DB_PORT=3306