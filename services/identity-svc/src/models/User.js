export const UserModel = `
  -- 1. Tạo kiểu ENUM cho trạng thái
  DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
          CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'LOCKED', 'REJECTED');
      END IF;
  END $$;

  -- 2. Tạo bảng users
  CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      shop_name VARCHAR(255) DEFAULT NULL,
      phone_number VARCHAR(20) UNIQUE NOT NULL,
      password TEXT NOT NULL, -- Lưu hash password nếu cần

      role_id BIGINT NOT NULL REFERENCES role(id) ON DELETE CASCADE,
      owner_id UUID DEFAULT NULL REFERENCES users(id) ON DELETE CASCADE,
      avatar JSONB DEFAULT NULL,

      plan_id INTEGER DEFAULT 1,

      status user_status NOT NULL DEFAULT 'PENDING',

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;