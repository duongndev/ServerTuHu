FROM node:22-alpine
WORKDIR /app

# Cài build tools cho native modules (ví dụ: bcrypt)
RUN apk add --no-cache python3 make g++

# Cài dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Sao chép mã nguồn
COPY . .

# Biến môi trường mặc định (ghi đè khi runtime)
ENV NODE_ENV=production \
    PORT=5000

EXPOSE 5000

# Khởi động server
CMD ["node", "server.js"]