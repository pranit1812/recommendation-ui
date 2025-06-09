'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePacksStore } from '@/store/packs';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditPack({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { getPackById, updatePack } = usePacksStore();
  const resolvedParams = use(params);
  
  const [packName, setPackName] = useState('');
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const pack = mounted ? getPackById(resolvedParams.id) : null;

  useEffect(() => {
    if (pack) {
      setPackName(pack.name);
    }
  }, [pack]);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  if (!pack) {
    return (
      <div className="container mx-auto p-6">
        <Button onClick={() => router.back()} variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Pack not found</h1>
      </div>
    );
  }

  const handleSave = () => {
    updatePack(resolvedParams.id, { name: packName });
    router.push('/');
  };

  return (
    <div className="container mx-auto p-6">
      <Button onClick={() => router.back()} variant="outline" className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <h1 className="text-3xl font-bold mb-6">Edit Pack</h1>

      <Card>
        <CardHeader>
          <CardTitle>Pack Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Pack Name</label>
            <Input
              value={packName}
              onChange={(e) => setPackName(e.target.value)}
              placeholder="Enter pack name"
            />
          </div>
          
          <div>
            <p className="text-sm font-medium mb-2">Questions: {pack.questions.length}</p>
            <p className="text-sm font-medium mb-2">Trades: {pack.trades.join(', ')}</p>
          </div>

          <Button onClick={handleSave} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 