'use client';

export default function AdminHeader() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            A
          </div>
          <span className="text-sm font-medium text-gray-800">Admin User</span>
        </div>
      </div>
    </header>
  );
}