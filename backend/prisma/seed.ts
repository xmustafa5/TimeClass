import { PrismaClient } from '../src/generated/prisma/client.ts';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import 'dotenv/config';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.scheduleEntry.deleteMany();
  await prisma.section.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.room.deleteMany();
  await prisma.period.deleteMany();

  // Create Grades (الصفوف)
  const grades = await Promise.all([
    prisma.grade.create({ data: { name: 'الصف الأول', order: 1 } }),
    prisma.grade.create({ data: { name: 'الصف الثاني', order: 2 } }),
    prisma.grade.create({ data: { name: 'الصف الثالث', order: 3 } }),
    prisma.grade.create({ data: { name: 'الصف الرابع', order: 4 } }),
    prisma.grade.create({ data: { name: 'الصف الخامس', order: 5 } }),
    prisma.grade.create({ data: { name: 'الصف السادس', order: 6 } }),
  ]);
  console.log(`✅ Created ${grades.length} grades`);

  // Create Sections for each grade (الشُعَب)
  const sectionNames = ['أ', 'ب', 'ج'];
  const sections = [];
  for (const grade of grades) {
    for (const name of sectionNames) {
      const section = await prisma.section.create({
        data: { name, gradeId: grade.id },
      });
      sections.push(section);
    }
  }
  console.log(`✅ Created ${sections.length} sections`);

  // Create Teachers (المدرسون)
  const teachers = await Promise.all([
    prisma.teacher.create({
      data: {
        fullName: 'أحمد محمد علي',
        subject: 'الرياضيات',
        weeklyPeriods: 24,
        workDays: JSON.stringify(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']),
        notes: 'مدرس أول رياضيات',
      },
    }),
    prisma.teacher.create({
      data: {
        fullName: 'سارة خالد العمري',
        subject: 'العلوم',
        weeklyPeriods: 20,
        workDays: JSON.stringify(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']),
      },
    }),
    prisma.teacher.create({
      data: {
        fullName: 'محمود حسن الصالح',
        subject: 'اللغة العربية',
        weeklyPeriods: 24,
        workDays: JSON.stringify(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']),
      },
    }),
    prisma.teacher.create({
      data: {
        fullName: 'فاطمة أحمد الناصر',
        subject: 'اللغة الإنجليزية',
        weeklyPeriods: 18,
        workDays: JSON.stringify(['sunday', 'monday', 'tuesday', 'wednesday']),
        notes: 'دوام جزئي',
      },
    }),
    prisma.teacher.create({
      data: {
        fullName: 'عبدالله سعيد القحطاني',
        subject: 'التربية الإسلامية',
        weeklyPeriods: 16,
        workDays: JSON.stringify(['sunday', 'tuesday', 'thursday']),
      },
    }),
    prisma.teacher.create({
      data: {
        fullName: 'نورة محمد الشمري',
        subject: 'الحاسب الآلي',
        weeklyPeriods: 12,
        workDays: JSON.stringify(['monday', 'wednesday', 'thursday']),
      },
    }),
  ]);
  console.log(`✅ Created ${teachers.length} teachers`);

  // Create Rooms (القاعات)
  const rooms = await Promise.all([
    prisma.room.create({ data: { name: 'قاعة 101', capacity: 30, type: 'regular' } }),
    prisma.room.create({ data: { name: 'قاعة 102', capacity: 30, type: 'regular' } }),
    prisma.room.create({ data: { name: 'قاعة 103', capacity: 30, type: 'regular' } }),
    prisma.room.create({ data: { name: 'قاعة 104', capacity: 25, type: 'regular' } }),
    prisma.room.create({ data: { name: 'قاعة 105', capacity: 25, type: 'regular' } }),
    prisma.room.create({ data: { name: 'مختبر العلوم', capacity: 20, type: 'lab' } }),
    prisma.room.create({ data: { name: 'معمل الحاسب 1', capacity: 25, type: 'computer' } }),
    prisma.room.create({ data: { name: 'معمل الحاسب 2', capacity: 25, type: 'computer' } }),
  ]);
  console.log(`✅ Created ${rooms.length} rooms`);

  // Create Periods (الحصص)
  const periods = await Promise.all([
    prisma.period.create({ data: { number: 1, startTime: '07:30', endTime: '08:15' } }),
    prisma.period.create({ data: { number: 2, startTime: '08:20', endTime: '09:05' } }),
    prisma.period.create({ data: { number: 3, startTime: '09:10', endTime: '09:55' } }),
    prisma.period.create({ data: { number: 4, startTime: '10:15', endTime: '11:00' } }), // After break
    prisma.period.create({ data: { number: 5, startTime: '11:05', endTime: '11:50' } }),
    prisma.period.create({ data: { number: 6, startTime: '11:55', endTime: '12:40' } }),
    prisma.period.create({ data: { number: 7, startTime: '12:45', endTime: '13:30' } }),
  ]);
  console.log(`✅ Created ${periods.length} periods`);

  // Create some sample schedule entries
  const scheduleEntries = await Promise.all([
    // Sunday schedule for Grade 1, Section A
    prisma.scheduleEntry.create({
      data: {
        day: 'sunday',
        subject: 'الرياضيات',
        teacherId: teachers[0].id, // أحمد - رياضيات
        gradeId: grades[0].id,
        sectionId: sections[0].id, // الأول - أ
        periodId: periods[0].id, // الحصة الأولى
        roomId: rooms[0].id,
      },
    }),
    prisma.scheduleEntry.create({
      data: {
        day: 'sunday',
        subject: 'العلوم',
        teacherId: teachers[1].id, // سارة - علوم
        gradeId: grades[0].id,
        sectionId: sections[0].id,
        periodId: periods[1].id, // الحصة الثانية
        roomId: rooms[5].id, // مختبر العلوم
      },
    }),
    prisma.scheduleEntry.create({
      data: {
        day: 'sunday',
        subject: 'اللغة العربية',
        teacherId: teachers[2].id, // محمود - عربي
        gradeId: grades[0].id,
        sectionId: sections[0].id,
        periodId: periods[2].id, // الحصة الثالثة
        roomId: rooms[0].id,
      },
    }),
    // Monday schedule
    prisma.scheduleEntry.create({
      data: {
        day: 'monday',
        subject: 'اللغة الإنجليزية',
        teacherId: teachers[3].id, // فاطمة - إنجليزي
        gradeId: grades[0].id,
        sectionId: sections[0].id,
        periodId: periods[0].id,
        roomId: rooms[0].id,
      },
    }),
    prisma.scheduleEntry.create({
      data: {
        day: 'monday',
        subject: 'الحاسب الآلي',
        teacherId: teachers[5].id, // نورة - حاسب
        gradeId: grades[0].id,
        sectionId: sections[0].id,
        periodId: periods[1].id,
        roomId: rooms[6].id, // معمل حاسب
      },
    }),
  ]);
  console.log(`✅ Created ${scheduleEntries.length} schedule entries`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
