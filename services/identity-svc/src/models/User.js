export const UserModel = `
  CREATE TABLE IF NOT EXISTS users (
      firebase_uid VARCHAR(128) PRIMARY KEY,
      full_name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      phone_number VARCHAR(20),
      role_id INTEGER REFERENCES roles(id),
      owner_id VARCHAR(128),
      status VARCHAR(50) DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;