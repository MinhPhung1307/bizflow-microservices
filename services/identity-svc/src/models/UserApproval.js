export const UserApprovalModel = `
  CREATE TABLE IF NOT EXISTS user_approvals (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action user_status, -- Trạng thái được chuyển tới (ACTIVE/REJECTED...)
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;