'use client';

import { useState } from 'react';
import { RoomType, roomTypesArabic } from '@/types';

interface Room {
  id: string;
  name: string;
  capacity: number;
  type: RoomType;
}

const roomTypes: RoomType[] = ['regular', 'lab', 'computer'];

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 30,
    type: 'regular' as RoomType,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRoom: Room = {
      id: crypto.randomUUID(),
      ...formData,
    };
    setRooms([...rooms, newRoom]);
    setFormData({ name: '', capacity: 30, type: 'regular' });
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setRooms(rooms.filter(r => r.id !== id));
  };

  const getTypeColor = (type: RoomType) => {
    switch (type) {
      case 'regular': return 'bg-gray-100 text-gray-700';
      case 'lab': return 'bg-green-100 text-green-700';
      case 'computer': return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">القاعات</h1>
          <p className="text-gray-600 mt-1">إدارة القاعات والمختبرات</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + إضافة قاعة
        </button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
            <p className="text-lg">لا توجد قاعات حالياً</p>
            <p className="text-sm mt-2">اضغط على "إضافة قاعة" لإضافة قاعة جديدة</p>
          </div>
        ) : (
          rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">السعة: {room.capacity} طالب</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${getTypeColor(room.type)}`}>
                    {roomTypesArabic[room.type]}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(room.id)}
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
            <h2 className="text-xl font-bold mb-4">إضافة قاعة جديدة</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم/رقم القاعة
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: قاعة 101"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  السعة
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  نوع القاعة
                </label>
                <div className="flex flex-wrap gap-2">
                  {roomTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      className={`px-4 py-2 rounded-lg text-sm ${
                        formData.type === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {roomTypesArabic[type]}
                    </button>
                  ))}
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
