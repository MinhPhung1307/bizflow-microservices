export const RoleModel = `
  CREATE TABLE IF NOT EXISTS role (
      id BIGSERIAL PRIMARY KEY,
      role_name VARCHAR(10) UNIQUE NOT NULL, -- ADMIN, OWNER, EMPLOYEE
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  INSERT INTO role (role_name)
  VALUES 
      ('ADMIN'),
      ('OWNER'),
      ('EMPLOYEE')
  ON CONFLICT (role_name) DO NOTHING;
`;