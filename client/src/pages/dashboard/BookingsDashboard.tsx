import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { format, isPast, isFuture } from 'date-fns';
import { toast } from 'sonner';
import { MoreHorizontal, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    return <div className="p-8 text-muted-foreground text-sm">Loading bookings...</div>;
  }

  return (
    <div className="w-full space-y-4 pt-2">
      
      {/* Top Navigation Tabs */}
      <div className="flex items-center space-x-1 mb-6 border border-border/40 rounded-full w-max p-1 bg-card">
        {(['upcoming', 'past', 'cancelled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-1.5 text-[14px] font-medium capitalize rounded-full transition-colors",
              activeTab === tab
                ? "bg-secondary/60 text-white"
                : "text-muted-foreground/80 hover:text-white"
            )}
          >
            {tab === 'cancelled' ? 'Canceled' : tab}
          </button>
        ))}
      </div>

      <div className="rounded-[10px] border border-border/40 bg-card overflow-hidden">
        {/* Next Header */}
        <div className="px-6 py-3 border-b border-border/40">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {activeTab === 'upcoming' ? 'Next' : activeTab}
          </h3>
        </div>
        
        <div className="flex flex-col">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-[14px]">
              No {activeTab === 'cancelled' ? 'canceled' : activeTab} bookings found.
            </div>
          ) : (
            filteredBookings.map((booking, idx) => (
              <div key={booking.id} className={cn("flex flex-col md:flex-row p-6 items-start md:items-center", idx !== filteredBookings.length - 1 && "border-b border-border/40")}>
                
                {/* Left Column: Date & Time */}
                <div className="w-full md:w-[220px] flex-shrink-0 mb-4 md:mb-0">
                  <div className="font-semibold text-[14px] text-white">
                    {format(new Date(booking.startTime), 'EEE, d MMM')}
                  </div>
                  <div className="text-muted-foreground/80 text-[13px] mt-0.5">
                    {format(new Date(booking.startTime), 'h:mma').toLowerCase()} - {format(new Date(booking.endTime), 'h:mma').toLowerCase()}
                  </div>
                </div>
                
                {/* Middle Column: Details */}
                <div className="flex-1 mb-4 md:mb-0">
                  <div className="font-semibold text-[14px] text-white">
                    {booking.eventType.title} between you and {booking.bookerName}
                  </div>
                  <div className="text-muted-foreground/80 text-[13px] mt-1 flex flex-col gap-1">
                    <div>You and {booking.bookerName}</div>
                    <div 
                      className="group flex items-center gap-2 cursor-pointer hover:text-white transition-colors w-max"
                      onClick={() => {
                        navigator.clipboard.writeText(booking.bookerEmail);
                        toast.success('Email copied to clipboard');
                      }}
                    >
                      {booking.bookerEmail}
                      <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>

                {/* Right Column: Actions */}
                <div className="flex-shrink-0 flex items-center justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-[32px] w-[32px] rounded-full border border-border/60 bg-transparent text-muted-foreground hover:text-white hover:bg-secondary">
                        <MoreHorizontal className="h-[15px] w-[15px]" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 border-border bg-card">
                      {booking.status !== 'CANCELLED' && (
                        <DropdownMenuItem className="text-red-500 focus:text-red-500 cursor-pointer flex items-center font-medium" onClick={() => handleCancel(booking.id)}>
                          Cancel Booking
                        </DropdownMenuItem>
                      )}
                      {booking.status === 'CANCELLED' && (
                        <DropdownMenuItem disabled className="text-muted-foreground flex items-center font-medium">
                          Already Canceled
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
