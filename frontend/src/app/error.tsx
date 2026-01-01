'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">حدث خطأ غير متوقع</CardTitle>
          <CardDescription>
            عذراً، حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
