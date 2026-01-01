'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  handler: () => void;
  description: string;
}

// Global keyboard shortcuts
const globalShortcuts: Omit<ShortcutHandler, 'handler'>[] = [
  { key: 'h', alt: true, description: 'الانتقال للرئيسية' },
  { key: 't', alt: true, description: 'الانتقال للمدرسين' },
  { key: 'g', alt: true, description: 'الانتقال للصفوف' },
  { key: 's', alt: true, description: 'الانتقال للشعب' },
  { key: 'r', alt: true, description: 'الانتقال للقاعات' },
  { key: 'p', alt: true, description: 'الانتقال للحصص' },
  { key: 'j', alt: true, description: 'الانتقال للجدول' },
  { key: '/', ctrl: true, description: 'فتح البحث' },
  { key: 'Escape', description: 'إغلاق النافذة الحالية' },
];

export function useKeyboardShortcuts(customShortcuts: ShortcutHandler[] = []) {
  const router = useRouter();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        // Allow Escape to work even in inputs
        if (event.key !== 'Escape') {
          return;
        }
      }

      // Check custom shortcuts first
      for (const shortcut of customShortcuts) {
        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!event.ctrlKey === !!shortcut.ctrl &&
          !!event.altKey === !!shortcut.alt &&
          !!event.shiftKey === !!shortcut.shift
        ) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }

      // Global navigation shortcuts (Alt + key)
      if (event.altKey && !event.ctrlKey && !event.shiftKey) {
        switch (event.key.toLowerCase()) {
          case 'h':
            event.preventDefault();
            router.push('/');
            break;
          case 't':
            event.preventDefault();
            router.push('/teachers');
            break;
          case 'g':
            event.preventDefault();
            router.push('/grades');
            break;
          case 's':
            event.preventDefault();
            router.push('/sections');
            break;
          case 'r':
            event.preventDefault();
            router.push('/rooms');
            break;
          case 'p':
            event.preventDefault();
            router.push('/periods');
            break;
          case 'j':
            event.preventDefault();
            router.push('/schedule');
            break;
        }
      }
    },
    [router, customShortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return { shortcuts: [...globalShortcuts, ...customShortcuts.map(s => ({
    key: s.key,
    ctrl: s.ctrl,
    alt: s.alt,
    shift: s.shift,
    description: s.description,
  }))] };
}

// Hook for page-specific shortcuts
export function usePageShortcuts(shortcuts: ShortcutHandler[]) {
  useKeyboardShortcuts(shortcuts);
}

// Format shortcut key for display
export function formatShortcut(shortcut: Omit<ShortcutHandler, 'handler'>): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  parts.push(shortcut.key.toUpperCase());
  return parts.join(' + ');
}
