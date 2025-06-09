'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Eye, EyeOff } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Breadcrumb from '@/components/Breadcrumb';

const CORRECT_PASSWORD = 'Test1111!';
const STORAGE_KEY = 'bidboard-auth';

interface PasswordProtectionProps {
  children: React.ReactNode;
}

export default function PasswordProtection({ children }: PasswordProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'authenticated') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
      localStorage.setItem(STORAGE_KEY, 'authenticated');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY);
    setPassword('');
    setError('');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div>Loading...</div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Access Required</CardTitle>
            <CardDescription>
              Enter the password to access BidBoard Test Harness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className={error ? 'border-red-500' : ''}
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
              </div>
              <Button type="submit" className="w-full">
                Access System
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                BidBoard Test Harness - Excel-driven prototype for testing project requirements
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show authenticated content with navigation and logout option
  return (
    <div className="min-h-screen bg-background">
      {/* Header with logout */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-600">Authenticated</span>
            </div>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              size="sm"
              className="text-xs h-7"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <Navigation />
      
      {/* Breadcrumb */}
      <Breadcrumb />
      
      {/* Main content */}
      <div>
        {children}
      </div>
    </div>
  );
} 