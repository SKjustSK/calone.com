import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Plus, Clock, MoreHorizontal, ExternalLink, Link as LinkIcon, Pencil, Trash2, Search, EyeOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function EventTypesList() {
  const [events, setEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.get('/events').then(res => setEvents(res.data)).catch(err => console.error(err));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event type?')) return;
    try {
      await api.delete(`/events/${id}`);
      setEvents(events.filter(e => e.id !== id));
      toast.success('Event type deleted successfully');
    } catch (err) {
      toast.error('Failed to delete event type');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await api.put(`/events/${id}`, { isActive: !currentActive });
      setEvents(events.map(e => e.id === id ? { ...e, isActive: !currentActive } : e));
      toast.success(currentActive ? 'Event type deactivated' : 'Event type activated');
    } catch (err) {
      toast.error('Failed to update event type');
    }
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    event.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-bold text-foreground">Event types</h2>
          <p className="text-[14px] text-muted-foreground mt-1 font-medium">Configure different events for people to book on your calendar.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="w-[14px] h-[14px] text-muted-foreground" />
            </span>
            <input 
              type="text" 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-4 py-[6px] rounded-full text-sm bg-secondary/80 text-foreground w-[180px] focus:outline-none border-none placeholder:text-muted-foreground" 
            />
          </div>
          <Button asChild className="bg-white text-black hover:bg-white/90 rounded-md h-[32px] px-3 font-semibold text-sm">
            <Link to="/dashboard/event-types/new">
              <Plus className="mr-1.5 h-4 w-4" /> New
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex flex-col">
          {filteredEvents.map((event, idx) => (
            <div key={event.id} className={cn("flex flex-col sm:flex-row sm:items-center justify-between p-[18px]", idx !== filteredEvents.length - 1 && "border-b border-border/60")}>
              <div>
                <div className="flex items-center gap-2 mb-[6px]">
                  <h3 className="text-[15px] font-bold text-foreground">{event.title}</h3>
                  <span className="text-muted-foreground/80 text-[14px] font-medium">/{event.user?.slug || 'admin'}/{event.slug}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-[13px] font-medium">{event.duration}m</span>
                  {event.slug === 'secret' && (
                    <span className="ml-2 text-[11px] font-medium px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center">
                      <EyeOff className="w-3 h-3 mr-1" />Hidden
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-4 sm:mt-0">
                <Switch 
                  checked={event.isActive !== false}
                  onCheckedChange={() => handleToggleActive(event.id, event.isActive !== false)}
                  className="data-[state=checked]:bg-white data-[state=checked]:border-white [&>span]:data-[state=checked]:bg-black scale-90" />
                
                <div className="flex items-center gap-1 border-l border-border/60 pl-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md" asChild>
                    <a href={`${window.location.origin}/${event.user?.slug || 'admin'}/${event.slug}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-[15px] w-[15px]" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md" onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/${event.user?.slug || 'admin'}/${event.slug}`);
                    toast.success('Link copied to clipboard!');
                  }} title="Copy Link">
                    <LinkIcon className="h-[15px] w-[15px]" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md">
                        <MoreHorizontal className="h-[15px] w-[15px]" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 border-border bg-card">
                      <DropdownMenuItem asChild>
                        <Link to={`/dashboard/event-types/${event.id}`} className="cursor-pointer flex items-center">
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500 focus:text-red-500 cursor-pointer flex items-center" onClick={() => handleDelete(event.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
          {filteredEvents.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No event types found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
