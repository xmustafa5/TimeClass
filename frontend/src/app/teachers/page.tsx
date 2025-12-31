'use client';

import { useState } from 'react';
import { weekDaysArabic, WeekDay } from '@/types';

interface Teacher {
  id: string;
  fullName: string;
  subject: string;
  weeklyPeriods: number;
  workDays: WeekDay[];
  notes?: string;
}

const weekDays: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    subject: '',
    weeklyPeriods: 20,
    workDays: [] as WeekDay[],
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTeacher: Teacher = {
      id: crypto.randomUUID(),
      ...formData,
    };
    setTeachers([...teachers, newTeacher]);
    setFormData({ fullName: '', subject: '', weeklyPeriods: 20, workDays: [], notes: '' });
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setTeachers(teachers.filter(t => t.id !== id));
  };

  const toggleWorkDay = (day: WeekDay) => {
    setFormData(prev => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المدرسون</h1>
          <p className="text-gray-600 mt-1">إدارة قائمة المدرسين</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + إضافة مدرس
        </button>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {teachers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg">لا يوجد مدرسون حالياً</p>
            <p className="text-sm mt-2">اضغط على "إضافة مدرس" لإضافة مدرس جديد</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">الاسم</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">المادة</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">الحصص الأسبوعية</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">أيام الدوام</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{teacher.fullName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{teacher.subject}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{teacher.weeklyPeriods}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {teacher.workDays.map(d => weekDaysArabic[d]).join('، ')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleDelete(teacher.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">إضافة مدرس جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المادة
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  عدد الحصص الأسبوعية
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={35}
                  value={formData.weeklyPeriods}
                  onChange={(e) => setFormData({ ...formData, weeklyPeriods: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  أيام الدوام
                </label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWorkDay(day)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        formData.workDays.includes(day)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {weekDaysArabic[day]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ملاحظات
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
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
