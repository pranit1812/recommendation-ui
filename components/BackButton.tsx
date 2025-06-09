'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  href?: string;
  children?: React.ReactNode;
}

export default function BackButton({ href, children }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <Button 
      onClick={handleClick}
      variant="outline" 
      size="sm"
      className="mb-4"
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {children || 'Back'}
    </Button>
  );
} 