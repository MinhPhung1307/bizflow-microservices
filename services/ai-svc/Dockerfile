FROM python:3.11-slim

WORKDIR /app

# Cài đặt curl (để debug nếu cần)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy file main.py vào root của WORKDIR
COPY main.py . 
# Copy các file khác (nếu có)
COPY . .

EXPOSE 5000

# Lệnh chạy quan trọng: "main:app" thay vì "app.main:app"
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]