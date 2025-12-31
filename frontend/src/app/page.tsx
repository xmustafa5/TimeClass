import Link from 'next/link';

const stats = [
  { name: 'المدرسون', value: '0', href: '/teachers', icon: '👨‍🏫', color: 'bg-blue-500' },
  { name: 'الصفوف', value: '0', href: '/grades', icon: '🏫', color: 'bg-green-500' },
  { name: 'الشُعَب', value: '0', href: '/sections', icon: '📚', color: 'bg-purple-500' },
  { name: 'القاعات', value: '0', href: '/rooms', icon: '🚪', color: 'bg-orange-500' },
];

const quickActions = [
  { name: 'إضافة مدرس جديد', href: '/teachers', description: 'أضف مدرس إلى النظام' },
  { name: 'إنشاء جدول', href: '/schedule', description: 'أنشئ جدول دراسي جديد' },
  { name: 'إدارة الحصص', href: '/periods', description: 'تعديل أوقات الحصص' },
];

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          لوحة التحكم
        </h1>
        <p className="mt-2 text-gray-600">
          مرحباً بك في نظام توزيع المدرسين والحصص
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-lg text-white text-2xl`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          إجراءات سريعة
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">{action.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Features Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          مميزات النظام
        </h2>
        <ul className="space-y-3 text-gray-600">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            منع تضارب حصص المدرسين
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            منع استخدام نفس القاعة في وقت واحد
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            عرض الجدول الأسبوعي واليومي
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            إمكانية التعديل السريع عند الغياب
          </li>
        </ul>
      </div>
    </div>
  );
}
