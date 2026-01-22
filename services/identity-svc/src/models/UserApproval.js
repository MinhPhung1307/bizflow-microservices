export const UserApprovalModel = `
  CREATE TABLE IF NOT EXISTS user_approvals (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(128) REFERENCES users(firebase_uid),
      approved_by VARCHAR(128),
      status VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;