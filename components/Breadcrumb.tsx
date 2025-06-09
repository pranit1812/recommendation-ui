'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const pathMapping: Record<string, string> = {
  '/': 'Dashboard',
  '/pack/new': 'Create Question Pack',
  '/run': 'Test Runner',
  '/admin/catalog': 'Catalog Management',
  '/admin/projects': 'Project Management',
};

export default function Breadcrumb() {
  const pathname = usePathname();
  
  // Don't show breadcrumb on home page
  if (pathname === '/') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);
  
  // Build breadcrumb items
  const breadcrumbItems: Array<{ name: string; href: string; icon?: React.ComponentType<{className?: string}> }> = [
    { name: 'Dashboard', href: '/', icon: Home }
  ];

  let currentPath = '';
  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    const name = pathMapping[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    breadcrumbItems.push({
      name,
      href: currentPath
    });
  });

  return (
    <div className="bg-gray-50 border-b">
      <div className="container mx-auto px-6 py-3">
        <nav className="flex items-center space-x-2 text-sm">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            const Icon = item.icon;
            
            return (
              <div key={item.href} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                )}
                
                {isLast ? (
                  <span className="flex items-center gap-1 text-gray-900 font-medium">
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.name}
                  </span>
                ) : (
                  <Link 
                    href={item.href}
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.name}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 