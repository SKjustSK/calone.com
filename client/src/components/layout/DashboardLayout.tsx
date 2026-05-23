import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  Calendar, Clock, Link as LinkIcon, ExternalLink, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  hasSubmenu?: boolean;
}

export default function DashboardLayout() {
  const location = useLocation();

  const navigation: NavItem[] = [
    { name: 'Event types', href: '/dashboard/event-types', icon: LinkIcon },
    { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
    { name: 'Availability', href: '/dashboard/availability', icon: Clock },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-[260px] flex-shrink-0 flex flex-col hidden md:flex border-r border-border/40">
        
        {/* Header Area */}
        <div className="h-16 flex items-center justify-between px-6 mt-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Calone</h1>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 space-y-[2px] mt-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href) && item.href !== '#';
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive 
                    ? "bg-secondary/80 text-foreground" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <div className="flex items-center">
                  <item.icon className={cn("mr-3 h-[18px] w-[18px]", isActive ? "text-foreground" : "text-muted-foreground")} strokeWidth={isActive ? 2.5 : 2} />
                  {item.name}
                </div>
                {item.hasSubmenu && <ChevronDown className="h-3 w-3 text-muted-foreground" />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="p-4 mt-auto">
          <Link 
            to="/admin" 
            target="_blank"
            className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground rounded-md transition-colors"
          >
            <div className="flex items-center">
              <ExternalLink className="mr-3 h-[18px] w-[18px] text-muted-foreground" strokeWidth={2} />
              Public Page
            </div>
          </Link>
        </div>

      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#0a0a0a]">
        <div className="mx-auto max-w-[1200px] py-6 px-4 md:px-6 w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
