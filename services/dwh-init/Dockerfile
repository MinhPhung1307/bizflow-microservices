# Sử dụng Node.js phiên bản mới ổn định
FROM node:20-slim

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Copy các file quản lý thư viện trước để tối ưu hóa việc cache layer
COPY package*.json ./

# Cài đặt các thư viện cần thiết (đặc biệt là pg cho PostgreSQL)
RUN npm install --production

# Copy toàn bộ mã nguồn khởi tạo DWH vào container
COPY . .

# Chạy script khởi tạo khi container bắt đầu
# DATABASE_URL sẽ được truyền vào từ Docker Compose hoặc biến môi trường
CMD ["node", "init-dwh.js"]