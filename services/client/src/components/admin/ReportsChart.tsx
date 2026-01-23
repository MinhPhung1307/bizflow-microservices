'use client';

export default function ReportsChart({ title, type }: { title: string; type: string }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      <div className="flex items-end gap-2 h-40 mb-4">
        {[40, 60, 45, 70, 55, 80, 65].map((height, i) => (
          <div
            key={i}
            className="flex-1 bg-blue-500 rounded-t-lg hover:bg-blue-600 transition-colors"
            style={{ height: `${height}%` }}
            title={`Tháng ${i + 1}`}
          ></div>
        ))}
      </div>

      <p className="text-sm text-gray-600">
        {type === 'revenue' ? 'Doanh thu tăng 15% so với tháng trước' : 'Gói đăng ký tăng 8% so với tháng trước'}
      </p>
    </div>
  );
}