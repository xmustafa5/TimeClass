import { useState, useCallback } from 'react';

interface UseModalReturn<T = undefined> {
  isOpen: boolean;
  data: T | null;
  open: (data?: T) => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Custom hook for managing modal state
 * @template T - Type of data to pass to the modal
 * @returns Modal state and control functions
 *
 * @example
 * // Simple usage
 * const modal = useModal();
 * <Button onClick={() => modal.open()}>Open</Button>
 * <Dialog open={modal.isOpen} onOpenChange={modal.close} />
 *
 * @example
 * // With data
 * const editModal = useModal<Teacher>();
 * <Button onClick={() => editModal.open(teacher)}>Edit</Button>
 * {editModal.data && <EditForm teacher={editModal.data} />}
 */
export function useModal<T = undefined>(): UseModalReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((modalData?: T) => {
    setData(modalData ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Delay clearing data to allow for exit animations
    setTimeout(() => setData(null), 200);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
  };
}

/**
 * Hook for managing multiple modals
 * @template T - Union type of modal names
 * @returns Functions to control multiple modals
 *
 * @example
 * const modals = useModals<'add' | 'edit' | 'delete'>();
 * modals.open('edit', teacher);
 * modals.isOpen('edit'); // true
 * modals.getData('edit'); // teacher
 */
export function useModals<T extends string>() {
  const [openModals, setOpenModals] = useState<Set<T>>(new Set());
  const [modalData, setModalData] = useState<Record<string, unknown>>({});

  const open = useCallback(<D>(name: T, data?: D) => {
    setOpenModals((prev) => new Set(prev).add(name));
    if (data !== undefined) {
      setModalData((prev) => ({ ...prev, [name]: data }));
    }
  }, []);

  const close = useCallback((name: T) => {
    setOpenModals((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
    setTimeout(() => {
      setModalData((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }, 200);
  }, []);

  const isOpen = useCallback((name: T) => openModals.has(name), [openModals]);

  const getData = useCallback(<D>(name: T): D | null => {
    return (modalData[name] as D) ?? null;
  }, [modalData]);

  const closeAll = useCallback(() => {
    setOpenModals(new Set());
    setTimeout(() => setModalData({}), 200);
  }, []);

  return {
    open,
    close,
    isOpen,
    getData,
    closeAll,
  };
}
