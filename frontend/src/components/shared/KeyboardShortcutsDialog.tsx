'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';

interface ShortcutGroup {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'التنقل',
    shortcuts: [
      { keys: ['Alt', 'H'], description: 'الانتقال للرئيسية' },
      { keys: ['Alt', 'T'], description: 'الانتقال للمدرسين' },
      { keys: ['Alt', 'G'], description: 'الانتقال للصفوف' },
      { keys: ['Alt', 'S'], description: 'الانتقال للشعب' },
      { keys: ['Alt', 'R'], description: 'الانتقال للقاعات' },
      { keys: ['Alt', 'P'], description: 'الانتقال للحصص' },
      { keys: ['Alt', 'J'], description: 'الانتقال للجدول' },
    ],
  },
  {
    title: 'إجراءات عامة',
    shortcuts: [
      { keys: ['Esc'], description: 'إغلاق النافذة الحالية' },
      { keys: ['?'], description: 'عرض اختصارات لوحة المفاتيح' },
    ],
  },
  {
    title: 'في صفحات القوائم',
    shortcuts: [
      { keys: ['N'], description: 'إضافة عنصر جديد' },
      { keys: ['E'], description: 'تعديل العنصر المحدد' },
      { keys: ['Delete'], description: 'حذف العنصر المحدد' },
    ],
  },
];

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts dialog with ? key
      if (e.key === '?' && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (
          target.tagName !== 'INPUT' &&
          target.tagName !== 'TEXTAREA' &&
          !target.isContentEditable
        ) {
          e.preventDefault();
          setOpen(true);
        }
      }
      // Close with Escape
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            اختصارات لوحة المفاتيح
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <Badge
                          key={keyIndex}
                          variant="outline"
                          className="font-mono text-xs px-2"
                        >
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          اضغط <Badge variant="outline" className="font-mono text-xs mx-1">?</Badge> في أي وقت لعرض هذه النافذة
        </p>
      </DialogContent>
    </Dialog>
  );
}
