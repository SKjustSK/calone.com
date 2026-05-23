import { Link, Outlet, useLocation } from 'react-router-dom';
import { Calendar, Clock, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function DashboardLayout() {
  const location = useLocation();

  const navigation = [
    { name: 'Event Types', href: '/dashboard/event-types', icon: LinkIcon },
    { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
    { name: 'Availability', href: '/dashboard/availability', icon: Clock },
  ];

  return (
    <div className="flex h-screen bg-muted/30">
      <div className="w-64 border-r bg-background flex flex-col hidden md:flex">
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Calone</h1>
          <ThemeToggle />
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl py-8 px-4 md:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
