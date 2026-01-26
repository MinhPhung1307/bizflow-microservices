export const SystemConfigModel = `
  CREATE TABLE IF NOT EXISTS system_config (
      id SERIAL PRIMARY KEY,
      maintenance_mode BOOLEAN DEFAULT FALSE,
      support_email VARCHAR(100) DEFAULT 'support@bizflow.vn',
      ai_model_version VARCHAR(50) DEFAULT 'gpt-4o-mini',
      tax_vat_default DECIMAL(5, 2) DEFAULT 8.00,
      max_upload_size_mb INT DEFAULT 10,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  INSERT INTO system_config (id, maintenance_mode)
  SELECT 1, FALSE
  WHERE NOT EXISTS (SELECT 1 FROM system_config WHERE id = 1);
`;