export const MasterTemplateModel = `
    CREATE TABLE IF NOT EXISTS master_templates (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        template_name VARCHAR(255) NOT NULL, -- Ví dụ: Sổ chi tiết doanh thu
        template_code VARCHAR(50) UNIQUE NOT NULL, -- Ví dụ: S01-HKD
        file_url TEXT NOT NULL, -- Đường dẫn lưu trữ tệp
        description TEXT,
        circular_version VARCHAR(50) DEFAULT '88/2021/TT-BTC',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
`;