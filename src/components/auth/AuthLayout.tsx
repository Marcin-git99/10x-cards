import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50/50 font-sans">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        <Card className="border-none shadow-xl shadow-gray-200/50 bg-white overflow-hidden">
          <CardContent className="pt-8 pb-8 px-8">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
