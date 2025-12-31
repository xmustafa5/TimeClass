'use client';

import { useState } from 'react';
import { WeekDay, weekDaysArabic } from '@/types';

interface ScheduleEntry {
  id: string;
  teacherId: string;
  teacherName: string;
  gradeId: string;
  sectionId: string;
  sectionName: string;
  periodId: string;
  periodNumber: number;
  roomId: string;
  roomName: string;
  day: WeekDay;
  subject: string;
}

const weekDays: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
const periodNumbers = [1, 2, 3, 4, 5, 6, 7];

// Teacher colors for visual distinction
const teacherColors = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-teal-100 border-teal-300 text-teal-800',
  'bg-yellow-100 border-yellow-300 text-yellow-800',
];

export default function SchedulePage() {
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDay, setSelectedDay] = useState<WeekDay>('sunday');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: WeekDay; period: number } | null>(null);

  // Mock data for dropdowns
  const [teachers] = useState([
    { id: '1', name: 'أحمد محمد', subject: 'الرياضيات' },
    { id: '2', name: 'سارة علي', subject: 'العلوم' },
    { id: '3', name: 'محمود خالد', subject: 'اللغة العربية' },
  ]);
  const [sections] = useState([
    { id: '1', name: 'الأول - أ' },
    { id: '2', name: 'الأول - ب' },
    { id: '3', name: 'الثاني - أ' },
  ]);
  const [rooms] = useState([
    { id: '1', name: 'قاعة 101' },
    { id: '2', name: 'قاعة 102' },
    { id: '3', name: 'مختبر العلوم' },
  ]);

  const [formData, setFormData] = useState({
    teacherId: '',
    sectionId: '',
    roomId: '',
    subject: '',
  });

  const getTeacherColor = (teacherId: string) => {
    const index = teachers.findIndex(t => t.id === teacherId);
    return teacherColors[index % teacherColors.length];
  };

  const getEntryForSlot = (day: WeekDay, periodNumber: number) => {
    return scheduleEntries.find(e => e.day === day && e.periodNumber === periodNumber);
  };

  const handleSlotClick = (day: WeekDay, period: number) => {
    const existing = getEntryForSlot(day, period);
    if (!existing) {
      setSelectedSlot({ day, period });
      setIsModalOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    const teacher = teachers.find(t => t.id === formData.teacherId);
    const section = sections.find(s => s.id === formData.sectionId);
    const room = rooms.find(r => r.id === formData.roomId);

    // Check for conflicts
    const teacherConflict = scheduleEntries.find(
      e => e.teacherId === formData.teacherId && e.day === selectedSlot.day && e.periodNumber === selectedSlot.period
    );
    const roomConflict = scheduleEntries.find(
      e => e.roomId === formData.roomId && e.day === selectedSlot.day && e.periodNumber === selectedSlot.period
    );
    const sectionConflict = scheduleEntries.find(
      e => e.sectionId === formData.sectionId && e.day === selectedSlot.day && e.periodNumber === selectedSlot.period
    );

    if (teacherConflict) {
      alert('تضارب: المدرس لديه حصة أخرى في هذا الوقت');
      return;
    }
    if (roomConflict) {
      alert('تضارب: القاعة مستخدمة في هذا الوقت');
      return;
    }
    if (sectionConflict) {
      alert('تضارب: الشعبة لديها حصة أخرى في هذا الوقت');
      return;
    }

    const newEntry: ScheduleEntry = {
      id: crypto.randomUUID(),
      teacherId: formData.teacherId,
      teacherName: teacher?.name || '',
      gradeId: '1',
      sectionId: formData.sectionId,
      sectionName: section?.name || '',
      periodId: selectedSlot.period.toString(),
      periodNumber: selectedSlot.period,
      roomId: formData.roomId,
      roomName: room?.name || '',
      day: selectedSlot.day,
      subject: formData.subject || teacher?.subject || '',
    };

    setScheduleEntries([...scheduleEntries, newEntry]);
    setFormData({ teacherId: '', sectionId: '', roomId: '', subject: '' });
    setIsModalOpen(false);
    setSelectedSlot(null);
  };

  const handleDelete = (id: string) => {
    setScheduleEntries(scheduleEntries.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الجدول الدراسي</h1>
          <p className="text-gray-600 mt-1">عرض وإدارة الجدول الأسبوعي</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            أسبوعي
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            يومي
          </button>
        </div>
      </div>

      {/* Day selector for daily view */}
      {viewMode === 'daily' && (
        <div className="flex gap-2">
          {weekDays.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-lg ${
                selectedDay === day ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {weekDaysArabic[day]}
            </button>
          ))}
        </div>
      )}

      {/* Schedule Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 w-20">
                  الحصة
                </th>
                {viewMode === 'weekly' ? (
                  weekDays.map((day) => (
                    <th key={day} className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                      {weekDaysArabic[day]}
                    </th>
                  ))
                ) : (
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                    {weekDaysArabic[selectedDay]}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {periodNumbers.map((period) => (
                <tr key={period}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {period}
                  </td>
                  {viewMode === 'weekly' ? (
                    weekDays.map((day) => {
                      const entry = getEntryForSlot(day, period);
                      return (
                        <td
                          key={day}
                          className="px-2 py-2"
                          onClick={() => !entry && handleSlotClick(day, period)}
                        >
                          {entry ? (
                            <div
                              className={`p-2 rounded-lg border ${getTeacherColor(entry.teacherId)} cursor-pointer`}
                              onClick={() => handleDelete(entry.id)}
                            >
                              <p className="font-medium text-sm">{entry.teacherName}</p>
                              <p className="text-xs">{entry.subject}</p>
                              <p className="text-xs opacity-75">{entry.sectionName}</p>
                            </div>
                          ) : (
                            <div className="h-16 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-center text-gray-400 hover:text-blue-500">
                              +
                            </div>
                          )}
                        </td>
                      );
                    })
                  ) : (
                    <td className="px-2 py-2" onClick={() => handleSlotClick(selectedDay, period)}>
                      {(() => {
                        const entry = getEntryForSlot(selectedDay, period);
                        return entry ? (
                          <div
                            className={`p-3 rounded-lg border ${getTeacherColor(entry.teacherId)}`}
                            onClick={() => handleDelete(entry.id)}
                          >
                            <p className="font-medium">{entry.teacherName}</p>
                            <p className="text-sm">{entry.subject}</p>
                            <p className="text-sm opacity-75">{entry.sectionName} - {entry.roomName}</p>
                          </div>
                        ) : (
                          <div className="h-20 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-center text-gray-400 hover:text-blue-500">
                            + إضافة حصة
                          </div>
                        );
                      })()}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-3">المدرسون</h3>
        <div className="flex flex-wrap gap-2">
          {teachers.map((teacher, index) => (
            <span
              key={teacher.id}
              className={`px-3 py-1 rounded-full text-sm ${teacherColors[index % teacherColors.length]}`}
            >
              {teacher.name} - {teacher.subject}
            </span>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">إضافة حصة</h2>
            <p className="text-gray-600 mb-4">
              {weekDaysArabic[selectedSlot.day]} - الحصة {selectedSlot.period}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المدرس
                </label>
                <select
                  required
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">اختر المدرس</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} - {teacher.subject}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الشعبة
                </label>
                <select
                  required
                  value={formData.sectionId}
                  onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">اختر الشعبة</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  القاعة
                </label>
                <select
                  required
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">اختر القاعة</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المادة (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="سيتم استخدام مادة المدرس تلقائياً"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
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
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedSlot(null);
                  }}
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
