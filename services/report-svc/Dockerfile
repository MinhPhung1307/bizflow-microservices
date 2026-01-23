# Sử dụng Node.js bản nhẹ (alpine)
FROM node:18-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Copy package.json và install dependencies trước để tận dụng cache của Docker
COPY package*.json ./
RUN npm install

# Copy toàn bộ mã nguồn vào container
COPY . .

# Mở cổng 4004
EXPOSE 4004

# Lệnh khởi chạy service
CMD ["npm", "start"]