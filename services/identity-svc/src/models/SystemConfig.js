export const SystemConfigModel = `
  CREATE TABLE IF NOT EXISTS system_config (
      id SERIAL PRIMARY KEY,
      config_key VARCHAR(100) UNIQUE NOT NULL,
      config_value TEXT,
      description TEXT
  );
`;