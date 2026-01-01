'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  GraduationCap,
  Layers,
  Clock,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'الرئيسية', href: '/', icon: Home },
  { name: 'المدرسون', href: '/teachers', icon: Users },
  { name: 'الصفوف', href: '/grades', icon: GraduationCap },
  { name: 'الشُعَب', href: '/sections', icon: Layers },
  { name: 'الحصص', href: '/periods', icon: Clock },
  { name: 'الجدول الدراسي', href: '/schedule', icon: Calendar },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-l bg-card">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-foreground">
          نظام الجداول
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          إدارة توزيع المدرسين والحصص
        </p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
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
