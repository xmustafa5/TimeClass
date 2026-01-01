import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-6xl font-bold text-muted-foreground">404</CardTitle>
          <CardDescription className="text-lg mt-2">
            الصفحة المطلوبة غير موجودة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها.
          </p>
          <Button asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              العودة للرئيسية
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
