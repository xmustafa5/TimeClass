'use client';

import { useState } from 'react';

interface Period {
  id: string;
  number: number;
  startTime: string;
  endTime: string;
}

export default function PeriodsPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    number: 1,
    startTime: '08:00',
    endTime: '08:45',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPeriod: Period = {
      id: crypto.randomUUID(),
      ...formData,
    };
    setPeriods([...periods, newPeriod].sort((a, b) => a.number - b.number));
    setFormData({ number: periods.length + 2, startTime: '08:00', endTime: '08:45' });
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setPeriods(periods.filter(p => p.id !== id));
  };

  const getPeriodName = (number: number) => {
    const names = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة'];
    return names[number - 1] || `الحصة ${number}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الحصص</h1>
          <p className="text-gray-600 mt-1">إدارة أوقات الحصص الدراسية</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + إضافة حصة
        </button>
      </div>

      {/* Periods Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {periods.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg">لا توجد حصص حالياً</p>
            <p className="text-sm mt-2">اضغط على "إضافة حصة" لإضافة حصة جديدة</p>
          </div>
        ) : (
          <div className="space-y-4">
            {periods.map((period) => (
              <div
                key={period.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {period.number}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      الحصة {getPeriodName(period.number)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {period.startTime} - {period.endTime}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(period.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">إضافة حصة جديدة</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الحصة
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={10}
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    وقت البداية
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    وقت النهاية
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
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
