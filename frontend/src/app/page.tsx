'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  BookOpen,
  Clock,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeachers } from '@/hooks/use-teachers';
import { useGrades } from '@/hooks/use-grades';
import { useSections } from '@/hooks/use-sections';
import { usePeriods } from '@/hooks/use-periods';
import { useSchedule } from '@/hooks/use-schedule';
import { cn } from '@/lib/utils';

// Stats card component
function StatsCard({
  title,
  value,
  icon: Icon,
  href,
  color,
  subtitle,
  isLoading,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  href: string;
  color: string;
  subtitle?: string;
  isLoading?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={cn('p-3 rounded-lg', color)}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{title}</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-bold">{value}</p>
              )}
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Progress card component
function ProgressCard({
  title,
  current,
  total,
  icon: Icon,
  color,
  isLoading,
}: {
  title: string;
  current: number;
  total: number;
  icon: React.ElementType;
  color: string;
  isLoading?: boolean;
}) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn('p-2 rounded-lg', color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium">{title}</p>
            {isLoading ? (
              <Skeleton className="h-4 w-24 mt-1" />
            ) : (
              <p className="text-sm text-muted-foreground">
                {current} من {total}
              </p>
            )}
          </div>
        </div>
        {isLoading ? (
          <Skeleton className="h-2 w-full" />
        ) : (
          <>
            <Progress value={percentage} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2 text-left">
              {percentage}%
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  // Fetch all data
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const { data: grades = [], isLoading: gradesLoading } = useGrades();
  const { data: sections = [], isLoading: sectionsLoading } = useSections();
  const { data: periods = [], isLoading: periodsLoading } = usePeriods();
  const { data: scheduleEntries = [], isLoading: scheduleLoading } = useSchedule();

  const isLoading = teachersLoading || gradesLoading || sectionsLoading ||
                    periodsLoading || scheduleLoading;

  // Calculate statistics
  const stats = useMemo(() => {
    // Total possible schedule slots (5 days × number of periods × number of sections)
    const totalSlots = 5 * periods.length * sections.length;
    const filledSlots = scheduleEntries.length;
    const scheduleCompleteness = totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0;

    // Teacher workload
    const teacherWorkloads = teachers.map((teacher) => {
      const assignedPeriods = scheduleEntries.filter((e) => e.teacherId === teacher.id).length;
      return {
        teacher,
        assigned: assignedPeriods,
        target: teacher.weeklyPeriods,
        percentage: teacher.weeklyPeriods > 0 ? (assignedPeriods / teacher.weeklyPeriods) * 100 : 0,
      };
    });

    const overloadedTeachers = teacherWorkloads.filter((w) => w.percentage > 100).length;
    const underloadedTeachers = teacherWorkloads.filter((w) => w.percentage < 80 && w.percentage > 0).length;
    const fullyScheduledTeachers = teacherWorkloads.filter((w) => w.percentage >= 80 && w.percentage <= 100).length;

    // Empty slots count
    const emptySlots = totalSlots - filledSlots;

    // Total scheduled hours
    const totalScheduledMinutes = scheduleEntries.reduce((sum, entry) => {
      const period = periods.find((p) => p.id === entry.periodId);
      if (period) {
        const [startH, startM] = period.startTime.split(':').map(Number);
        const [endH, endM] = period.endTime.split(':').map(Number);
        return sum + (endH * 60 + endM) - (startH * 60 + startM);
      }
      return sum;
    }, 0);

    return {
      totalSlots,
      filledSlots,
      emptySlots,
      scheduleCompleteness,
      teacherWorkloads,
      overloadedTeachers,
      underloadedTeachers,
      fullyScheduledTeachers,
      totalScheduledHours: Math.floor(totalScheduledMinutes / 60),
      totalScheduledMinutes: totalScheduledMinutes % 60,
    };
  }, [teachers, sections, periods, scheduleEntries]);

  // Quick actions
  const quickActions = [
    {
      name: 'إضافة مدرس',
      href: '/teachers',
      icon: Users,
      description: 'أضف مدرس جديد للنظام',
    },
    {
      name: 'إنشاء جدول',
      href: '/schedule',
      icon: Calendar,
      description: 'إدارة الجدول الدراسي',
    },
    {
      name: 'إدارة الحصص',
      href: '/periods',
      icon: Clock,
      description: 'تعديل أوقات الحصص',
    },
  ];

  // System status items
  const systemStatus = useMemo(() => {
    const items = [];

    if (teachers.length === 0) {
      items.push({ type: 'warning', message: 'لم يتم إضافة مدرسين بعد' });
    }
    if (periods.length === 0) {
      items.push({ type: 'warning', message: 'لم يتم تحديد أوقات الحصص' });
    }
    if (sections.length === 0) {
      items.push({ type: 'warning', message: 'لم يتم إضافة شعب بعد' });
    }
    if (stats.overloadedTeachers > 0) {
      items.push({
        type: 'error',
        message: `${stats.overloadedTeachers} مدرس لديهم حصص أكثر من المطلوب`,
      });
    }
    if (items.length === 0 && scheduleEntries.length > 0) {
      items.push({ type: 'success', message: 'النظام جاهز والجدول مكتمل' });
    }
    if (items.length === 0) {
      items.push({ type: 'info', message: 'النظام جاهز - ابدأ بإضافة البيانات' });
    }

    return items;
  }, [teachers, periods, sections, scheduleEntries, stats.overloadedTeachers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground mt-1">
          مرحباً بك في نظام توزيع المدرسين والحصص
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatsCard
          title="المدرسون"
          value={teachers.length}
          icon={Users}
          href="/teachers"
          color="bg-blue-500"
          isLoading={teachersLoading}
        />
        <StatsCard
          title="الصفوف"
          value={grades.length}
          icon={GraduationCap}
          href="/grades"
          color="bg-green-500"
          isLoading={gradesLoading}
        />
        <StatsCard
          title="الشُعَب"
          value={sections.length}
          icon={BookOpen}
          href="/sections"
          color="bg-purple-500"
          isLoading={sectionsLoading}
        />
        <StatsCard
          title="الحصص"
          value={periods.length}
          icon={Clock}
          href="/periods"
          color="bg-teal-500"
          isLoading={periodsLoading}
        />
        <StatsCard
          title="حصص الجدول"
          value={scheduleEntries.length}
          icon={Calendar}
          href="/schedule"
          color="bg-pink-500"
          subtitle={`${stats.emptySlots} خانة فارغة`}
          isLoading={scheduleLoading}
        />
      </div>

      {/* Progress Cards Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ProgressCard
          title="اكتمال الجدول"
          current={stats.filledSlots}
          total={stats.totalSlots}
          icon={Calendar}
          color="bg-blue-500"
          isLoading={isLoading}
        />
        <ProgressCard
          title="المدرسون المجدولون بالكامل"
          current={stats.fullyScheduledTeachers}
          total={teachers.length}
          icon={Users}
          color="bg-green-500"
          isLoading={isLoading}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              إجراءات سريعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link key={action.name} href={action.href}>
                  <div className="p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <action.icon className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{action.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              حالة النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemStatus.map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg',
                    item.type === 'error' && 'bg-destructive/10 text-destructive',
                    item.type === 'warning' && 'bg-yellow-500/10 text-yellow-700',
                    item.type === 'success' && 'bg-green-500/10 text-green-700',
                    item.type === 'info' && 'bg-blue-500/10 text-blue-700'
                  )}
                >
                  {item.type === 'error' && <XCircle className="h-5 w-5" />}
                  {item.type === 'warning' && <AlertTriangle className="h-5 w-5" />}
                  {item.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
                  {item.type === 'info' && <TrendingUp className="h-5 w-5" />}
                  <span className="text-sm">{item.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teacher Workload Summary */}
      {teachers.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              ملخص أعباء المدرسين
            </CardTitle>
            <Link href="/teachers">
              <Button variant="ghost" size="sm" className="gap-1">
                عرض الكل
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {stats.teacherWorkloads.slice(0, 5).map(({ teacher, assigned, target, percentage }) => (
                  <div key={teacher.id} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium truncate">{teacher.fullName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {assigned} / {target}
                          </span>
                          <Badge
                            variant={
                              percentage > 100
                                ? 'destructive'
                                : percentage >= 80
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {Math.round(percentage)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress
                        value={Math.min(percentage, 100)}
                        className={cn(
                          'h-2',
                          percentage > 100 && '[&>div]:bg-destructive'
                        )}
                      />
                    </div>
                  </div>
                ))}
                {teachers.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    و {teachers.length - 5} مدرس آخر...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Schedule Summary Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">
              {isLoading ? <Skeleton className="h-9 w-16 mx-auto" /> : stats.filledSlots}
            </p>
            <p className="text-sm text-muted-foreground">حصة مجدولة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-500">
              {isLoading ? <Skeleton className="h-9 w-16 mx-auto" /> : stats.emptySlots}
            </p>
            <p className="text-sm text-muted-foreground">خانة فارغة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-500">
              {isLoading ? (
                <Skeleton className="h-9 w-20 mx-auto" />
              ) : (
                `${stats.totalScheduledHours}:${stats.totalScheduledMinutes.toString().padStart(2, '0')}`
              )}
            </p>
            <p className="text-sm text-muted-foreground">ساعات مجدولة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-500">
              {isLoading ? (
                <Skeleton className="h-9 w-16 mx-auto" />
              ) : (
                `${Math.round(stats.scheduleCompleteness)}%`
              )}
            </p>
            <p className="text-sm text-muted-foreground">نسبة الاكتمال</p>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>مميزات النظام</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>منع تضارب حصص المدرسين</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>عرض الجدول الأسبوعي واليومي</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>تصفية الجدول حسب المدرس أو الشعبة</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>تصدير البيانات بصيغة CSV و JSON</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>طباعة الجدول بتنسيق مناسب</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
