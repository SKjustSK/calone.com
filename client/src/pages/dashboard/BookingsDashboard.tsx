import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, isPast, isFuture } from 'date-fns';
import { toast } from 'sonner';
import { Calendar, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Booking {
  id: string;
  eventTypeId: string;
  bookerName: string;
  bookerEmail: string;
  startTime: string;
  endTime: string;
  status: string;
  eventType: {
    title: string;
    duration: number;
  };
}

export default function BookingsDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings');
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.delete(`/bookings/${id}`);
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (b.status === 'CANCELLED') return activeTab === 'cancelled';
    if (activeTab === 'upcoming') return isFuture(new Date(b.startTime));
    if (activeTab === 'past') return isPast(new Date(b.startTime));
    return false;
  });

  if (loading) {
    return <div className="p-8">Loading bookings...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Bookings</h2>
        <p className="text-sm text-muted-foreground mt-1">See upcoming and past events booked through your links.</p>
      </div>

      <div className="flex items-center space-x-1 mb-6">
        {(['upcoming', 'past', 'cancelled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-sm font-medium capitalize rounded-full transition-colors ${
              activeTab === tab
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden border-border bg-card">
        <div className="bg-muted/30 px-6 py-3 border-b border-border/50">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Next</h3>
        </div>
        <div className="flex flex-col">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="mx-auto h-12 w-12 opacity-20 mb-4" />
              <p>No {activeTab} bookings found.</p>
            </div>
          ) : (
            filteredBookings.map((booking, idx) => (
              <div key={booking.id} className={`flex flex-col md:flex-row p-6 ${idx !== filteredBookings.length - 1 ? 'border-b border-border/50' : ''}`}>
                <div className="md:w-64 flex-shrink-0 pr-6">
                  <div className="font-medium text-sm mb-1.5">
                    {format(new Date(booking.startTime), 'EEE, d MMM yyyy')}
                  </div>
                  <div className="text-muted-foreground text-sm flex items-center">
                    {format(new Date(booking.startTime), 'h:mma')} - {format(new Date(booking.endTime), 'h:mma')}
                  </div>
                </div>
                <div className="flex-1 flex justify-between items-start mt-4 md:mt-0 pl-0 md:pl-6 border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0">
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{booking.eventType.title} between {booking.bookerName} and Admin</h3>
                    <div className="flex items-center text-muted-foreground text-sm">
                      You and {booking.bookerName}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {booking.status === 'CANCELLED' && (
                      <span className="bg-destructive/10 text-destructive text-xs px-2 py-1 rounded-full font-medium">
                        Cancelled
                      </span>
                    )}
                    {activeTab === 'upcoming' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full bg-transparent border-border/50">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleCancel(booking.id)} className="cursor-pointer text-destructive focus:text-destructive">
                            Cancel booking
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
