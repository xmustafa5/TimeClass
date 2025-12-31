'use client';

import { useState } from 'react';

interface Grade {
  id: string;
  name: string;
}

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newGrade: Grade = {
      id: crypto.randomUUID(),
      ...formData,
    };
    setGrades([...grades, newGrade]);
    setFormData({ name: '' });
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setGrades(grades.filter(g => g.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الصفوف</h1>
          <p className="text-gray-600 mt-1">إدارة الصفوف الدراسية</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + إضافة صف
        </button>
      </div>

      {/* Grades Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {grades.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
            <p className="text-lg">لا توجد صفوف حالياً</p>
            <p className="text-sm mt-2">اضغط على "إضافة صف" لإضافة صف جديد</p>
          </div>
        ) : (
          grades.map((grade) => (
            <div
              key={grade.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{grade.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">الصف الدراسي</p>
                </div>
                <button
                  onClick={() => handleDelete(grade.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  حذف
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">إضافة صف جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الصف
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الصف الأول"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  إضافة
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
