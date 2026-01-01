'use client';

import { useState, useMemo } from 'react';
import { Plus, DoorOpen, Search, Pencil, Trash2, MoreVertical, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RoomFormDialog } from '@/components/rooms/RoomFormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/PageSkeleton';
import {
  useRooms,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
} from '@/hooks/use-rooms';
import type { Room, RoomType } from '@/types';
import { roomTypesArabic } from '@/types';
import type { RoomFormData } from '@/lib/validations';

const roomTypes: RoomType[] = ['regular', 'lab', 'computer'];

const getTypeVariant = (type: RoomType): 'default' | 'secondary' | 'outline' => {
  switch (type) {
    case 'lab':
      return 'default';
    case 'computer':
      return 'secondary';
    default:
      return 'outline';
  }
};

export default function RoomsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<RoomType | ''>('');

  // Data fetching
  const { data: rooms = [], isLoading } = useRooms();

  // Mutations
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();

  // Filter rooms
  const filteredRooms = useMemo(() => {
    let result = rooms;

    if (filterType) {
      result = result.filter((r) => r.type === filterType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(query));
    }

    return result;
  }, [rooms, filterType, searchQuery]);

  // Handlers
  const handleAdd = () => {
    setSelectedRoom(null);
    setIsFormOpen(true);
  };

  const handleEdit = (room: Room) => {
    setSelectedRoom(room);
    setIsFormOpen(true);
  };

  const handleDelete = (room: Room) => {
    setSelectedRoom(room);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = (data: RoomFormData) => {
    if (selectedRoom) {
      updateRoom.mutate(
        { id: selectedRoom.id, data },
        { onSuccess: () => setIsFormOpen(false) }
      );
    } else {
      createRoom.mutate(data, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedRoom) {
      deleteRoom.mutate(selectedRoom.id, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setSelectedRoom(null);
        },
      });
    }
  };

  const isSubmitting = createRoom.isPending || updateRoom.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">القاعات</h1>
          <p className="text-muted-foreground mt-1">
            إدارة القاعات والمختبرات وغرف الحاسوب
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2 self-start">
          <Plus className="h-4 w-4" />
          إضافة قاعة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي القاعات</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rooms.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">المختبرات</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rooms.filter((r) => r.type === 'lab').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">غرف الحاسوب</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rooms.filter((r) => r.type === 'computer').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث في القاعات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as RoomType | '')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="جميع الأنواع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">جميع الأنواع</SelectItem>
            {roomTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {roomTypesArabic[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rooms Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredRooms.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            {searchQuery || filterType ? (
              <EmptyState
                icon={Search}
                title="لا توجد نتائج"
                description="لم يتم العثور على قاعات تطابق بحثك أو الفلتر المحدد"
              />
            ) : (
              <EmptyState
                icon={DoorOpen}
                title="لا توجد قاعات"
                description="لم يتم إضافة أي قاعات بعد. اضغط على زر الإضافة للبدء."
                action={{
                  label: 'إضافة قاعة',
                  onClick: handleAdd,
                }}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((room) => (
            <Card key={room.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{room.name}</CardTitle>
                  <Badge variant={getTypeVariant(room.type)}>
                    {roomTypesArabic[room.type]}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(room)}>
                      <Pencil className="ml-2 h-4 w-4" />
                      تعديل
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(room)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="ml-2 h-4 w-4" />
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>السعة: {room.capacity} طالب</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <RoomFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        room={selectedRoom}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="حذف القاعة"
        description={`هل أنت متأكد من حذف القاعة "${selectedRoom?.name}"؟`}
        confirmLabel="حذف"
        onConfirm={handleConfirmDelete}
        variant="destructive"
        loading={deleteRoom.isPending}
      />
    </div>
  );
}
