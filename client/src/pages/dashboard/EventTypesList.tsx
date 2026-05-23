import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Link as LinkIcon, Clock, MoreHorizontal, Copy, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

export default function EventTypesList() {
  const [events, setEvents] = useState<any[]>([]);

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Event types</h2>
          <p className="text-sm text-muted-foreground">Configure different events for people to book on your calendar.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </span>
            <input type="text" placeholder="Search" className="pl-9 pr-4 py-2 border rounded-md text-sm bg-transparent w-48 focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">
            <Link to="/dashboard/event-types/new">
              <Plus className="mr-1.5 h-4 w-4" /> New
            </Link>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border bg-card">
        <div className="flex flex-col">
          {events.map((event, idx) => (
            <div key={event.id} className={`flex items-center justify-between p-5 ${idx !== events.length - 1 ? 'border-b border-border/50' : ''}`}>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-base font-semibold">{event.title}</h3>
                  <span className="text-muted-foreground text-sm font-normal">/{event.user?.slug || 'admin'}/{event.slug}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-1.5 h-4 w-4" />
                    {event.duration}m
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-md bg-transparent border-border/50" onClick={() => {
                  navigator.clipboard.writeText(`http://localhost:5173/${event.user?.slug || 'admin'}/${event.slug}`);
                  toast.success('Link copied to clipboard!');
                }} title="Copy Link">
                  <Copy className="h-4 w-4" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-md bg-transparent border-border/50">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem asChild>
                      <Link to={`/dashboard/event-types/${event.id}`} className="cursor-pointer flex items-center">
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(event.id)} className="cursor-pointer text-destructive focus:text-destructive flex items-center">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No event types found. Create one to get started!
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
