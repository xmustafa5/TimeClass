'use client';

import { useState } from 'react';

interface Section {
  id: string;
  name: string;
  gradeId: string;
  gradeName: string;
}

interface Grade {
  id: string;
  name: string;
}

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [grades] = useState<Grade[]>([
    { id: '1', name: 'الصف الأول' },
    { id: '2', name: 'الصف الثاني' },
    { id: '3', name: 'الصف الثالث' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', gradeId: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const grade = grades.find(g => g.id === formData.gradeId);
    const newSection: Section = {
      id: crypto.randomUUID(),
      name: formData.name,
      gradeId: formData.gradeId,
      gradeName: grade?.name || '',
    };
    setSections([...sections, newSection]);
    setFormData({ name: '', gradeId: '' });
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  // Group sections by grade
  const sectionsByGrade = sections.reduce((acc, section) => {
    if (!acc[section.gradeId]) {
      acc[section.gradeId] = {
        gradeName: section.gradeName,
        sections: [],
      };
    }
    acc[section.gradeId].sections.push(section);
    return acc;
  }, {} as Record<string, { gradeName: string; sections: Section[] }>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الشُعَب</h1>
          <p className="text-gray-600 mt-1">إدارة شُعَب الصفوف</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + إضافة شعبة
        </button>
      </div>

      {/* Sections by Grade */}
      {Object.keys(sectionsByGrade).length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          <p className="text-lg">لا توجد شُعَب حالياً</p>
          <p className="text-sm mt-2">اضغط على "إضافة شعبة" لإضافة شعبة جديدة</p>
        </div>
      ) : (
        Object.entries(sectionsByGrade).map(([gradeId, data]) => (
          <div key={gradeId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{data.gradeName}</h2>
            <div className="flex flex-wrap gap-3">
              {data.sections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg"
                >
                  <span className="text-gray-700">{section.name}</span>
                  <button
                    onClick={() => handleDelete(section.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">إضافة شعبة جديدة</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الصف
                </label>
                <select
                  required
                  value={formData.gradeId}
                  onChange={(e) => setFormData({ ...formData, gradeId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">اختر الصف</option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الشعبة
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أ، ب، ج"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
