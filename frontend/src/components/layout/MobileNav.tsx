'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  GraduationCap,
  Layers,
  DoorOpen,
  Clock,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';

const navigation = [
  { name: 'الرئيسية', href: '/', icon: Home },
  { name: 'المدرسون', href: '/teachers', icon: Users },
  { name: 'الصفوف', href: '/grades', icon: GraduationCap },
  { name: 'الشُعَب', href: '/sections', icon: Layers },
  { name: 'القاعات', href: '/rooms', icon: DoorOpen },
  { name: 'الحصص', href: '/periods', icon: Clock },
  { name: 'الجدول الدراسي', href: '/schedule', icon: Calendar },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b p-6">
        <SheetTitle className="text-right">
          <span className="text-xl font-bold">نظام الجداول</span>
          <p className="text-sm font-normal text-muted-foreground mt-1">
            إدارة توزيع المدرسين والحصص
          </p>
        </SheetTitle>
      </SheetHeader>

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
    </div>
  );
}
