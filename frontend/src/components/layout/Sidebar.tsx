'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'الرئيسية', href: '/', icon: '🏠' },
  { name: 'المدرسون', href: '/teachers', icon: '👨‍🏫' },
  { name: 'الصفوف', href: '/grades', icon: '🏫' },
  { name: 'الشُعَب', href: '/sections', icon: '📚' },
  { name: 'القاعات', href: '/rooms', icon: '🚪' },
  { name: 'الحصص', href: '/periods', icon: '⏰' },
  { name: 'الجدول الدراسي', href: '/schedule', icon: '📅' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-l border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">
          نظام الجداول
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          إدارة توزيع المدرسين والحصص
        </p>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
