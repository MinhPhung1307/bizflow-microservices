export const AuditLogModel = `
  CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      user_id UUID,
      action VARCHAR(255),
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;