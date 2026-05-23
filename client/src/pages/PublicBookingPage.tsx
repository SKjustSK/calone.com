import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/services/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Clock, Calendar as CalendarIcon, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, isBefore, addMinutes, startOfDay, getDay, addDays
} from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

interface EventType {
  id: string;
  title: string;
  description: string;
  duration: number;
  user: { id: string; name: string; email: string; timezone: string };
  bookings: { startTime: string; endTime: string }[];
}

interface Availability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export default function PublicBookingPage() {
  const { username, slug } = useParams();
  const [event, setEvent] = useState<EventType | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventRes = await api.get(`/events/${username}/${slug}`);
        setEvent(eventRes.data);
        const availRes = await api.get(`/availability?userId=${eventRes.data.user.id}`);
        setAvailability(availRes.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load booking page');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [username, slug]);

  const generateTimeSlots = (date: Date) => {
    if (!event || availability.length === 0) return [];
    
    const hostTimezone = event.user.timezone || 'Asia/Calcutta';
    const slots: Date[] = [];
    const now = new Date();

    for (let offset = -1; offset <= 1; offset++) {
      const checkDate = addDays(date, offset);
      const hostDayOfWeek = getDay(checkDate);
      const dayAvails = availability.filter(a => a.dayOfWeek === hostDayOfWeek);
      
      for (const dayAvail of dayAvails) {
        const startStr = `${format(checkDate, 'yyyy-MM-dd')}T${dayAvail.startTime}:00`;
        let currentSlot = fromZonedTime(startStr, hostTimezone);

        const endStr = `${format(checkDate, 'yyyy-MM-dd')}T${dayAvail.endTime}:00`;
        const endLimit = fromZonedTime(endStr, hostTimezone);

        while (isBefore(currentSlot, endLimit)) {
          const slotEnd = addMinutes(currentSlot, event.duration);
          if (isBefore(slotEnd, endLimit) || slotEnd.getTime() === endLimit.getTime()) {
            if (isSameDay(currentSlot, date)) {
              if (!isBefore(currentSlot, now)) {
                const conflict = event.bookings.some((b: any) => {
                  const bStart = new Date(b.startTime);
                  const bEnd = new Date(b.endTime);
                  return currentSlot < bEnd && slotEnd > bStart;
                });
                if (!conflict) {
                  slots.push(currentSlot);
                }
              }
            }
          }
          currentSlot = addMinutes(currentSlot, event.duration);
        }
      }
    }
    return slots.sort((a, b) => a.getTime() - b.getTime());
  };

  const isDayAvailable = (day: Date) => {
    if (isBefore(day, startOfDay(new Date()))) return false;
    return generateTimeSlots(day).length > 0;
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !selectedTime) return;
    setSubmitting(true);
    try {
      await api.post('/bookings', {
        eventTypeId: event.id,
        bookerName: name,
        bookerEmail: email,
        startTime: selectedTime.toISOString(),
        endTime: addMinutes(selectedTime, event.duration).toISOString()
      });
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to book. Slot might be taken.');
      // Refresh to get latest bookings
      const eventRes = await api.get(`/events/${username}/${slug}`);
      setEvent(eventRes.data);
      setSelectedTime(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-background">Loading...</div>;
  if (error || !event) return <div className="flex h-screen items-center justify-center text-destructive bg-background">{error || "Not found"}</div>;

  if (success) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-4 text-foreground font-sans">
        <div className="w-full max-w-2xl bg-[#1C1C1C] rounded-2xl border border-[#2C2C2C] p-8 md:p-12">
          <div className="flex flex-col items-center text-center space-y-4 mb-10">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold">This meeting is scheduled</h1>
            <p className="text-muted-foreground text-sm">We sent an email with a calendar invitation with the details to everyone.</p>
          </div>

          <div className="border border-[#2C2C2C] rounded-xl overflow-hidden divide-y divide-[#2C2C2C] text-sm">
            <div className="flex flex-col sm:flex-row p-4 sm:p-5">
              <div className="w-32 font-medium text-muted-foreground mb-1 sm:mb-0">What</div>
              <div className="flex-1 font-medium">{event.title} between {event.user.name} and {name}</div>
            </div>
            <div className="flex flex-col sm:flex-row p-4 sm:p-5">
              <div className="w-32 font-medium text-muted-foreground mb-1 sm:mb-0">When</div>
              <div className="flex-1">
                <div className="font-medium">{selectedTime && format(selectedTime, 'EEEE, MMMM d, yyyy')}</div>
                <div className="text-muted-foreground mt-0.5">
                  {selectedTime && `${format(selectedTime, 'h:mm a')} - ${format(addMinutes(selectedTime, event.duration), 'h:mm a')} (Local Time)`}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row p-4 sm:p-5">
              <div className="w-32 font-medium text-muted-foreground mb-1 sm:mb-0">Who</div>
              <div className="flex-1 space-y-4">
                <div>
                  <div className="font-medium">{event.user.name} <span className="text-muted-foreground text-xs font-normal ml-1 border rounded-md px-1.5 py-0.5">Host</span></div>
                  <div className="text-muted-foreground mt-0.5">{event.user.email}</div>
                </div>
                <div>
                  <div className="font-medium">{name}</div>
                  <div className="text-muted-foreground mt-0.5">{email}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  // Padding for the calendar grid
  const startDay = getDay(days[0]);
  const paddingDays = Array(startDay).fill(null);
  const timeSlots = selectedDate ? generateTimeSlots(selectedDate) : [];

  return (
    <div className="flex min-h-screen bg-background items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="flex flex-col items-center">
        <div className="bg-[#1C1C1C] border border-[#2C2C2C] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row w-full max-w-5xl transition-all duration-300">
          
          {/* Left Sidebar: Event Info */}
          <div className={`p-6 md:p-8 flex flex-col border-b md:border-b-0 md:border-r border-[#2C2C2C] w-full ${!selectedTime && !selectedDate ? 'md:w-80' : 'md:w-72'} flex-shrink-0`}>
            {selectedTime && (
              <button onClick={() => setSelectedTime(null)} className="mb-6 h-8 w-8 rounded-full border border-[#2C2C2C] flex items-center justify-center hover:bg-white/5 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
                {event.user.name.charAt(0).toUpperCase()}
              </div>
            </div>
            
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{event.user.name}</h3>
            <h1 className="text-2xl font-bold text-foreground mb-6">{event.title}</h1>
            
            <div className="space-y-4">
              {selectedTime && (
                <div className="flex items-start text-foreground font-medium text-sm">
                  <CalendarIcon className="h-4 w-4 mr-3 mt-0.5 text-muted-foreground" />
                  <div>
                    <div>{format(selectedTime, 'EEEE, MMMM d, yyyy')}</div>
                    <div className="text-muted-foreground font-normal mt-0.5">
                      {format(selectedTime, 'h:mm a')} - {format(addMinutes(selectedTime, event.duration), 'h:mm a')}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center text-muted-foreground text-sm font-medium">
                <Clock className="h-4 w-4 mr-3 text-muted-foreground" />
                {event.duration}m
              </div>
              <div className="flex items-center text-muted-foreground text-sm font-medium">
                <Globe className="h-4 w-4 mr-3 text-muted-foreground" />
                Host Timezone: {event.user.timezone || 'Asia/Calcutta'}
              </div>
            </div>
            
            {event.description && (
              <p className="mt-8 text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            )}
          </div>

          {/* Right Area: Calendar or Form */}
          <div className="flex-1 flex flex-col sm:flex-row bg-[#1C1C1C]">
            {!selectedTime ? (
              <>
                {/* Calendar Grid */}
                <div className={`p-6 md:p-8 flex-1 border-b sm:border-b-0 ${selectedDate ? 'sm:border-r border-[#2C2C2C]' : ''}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-base font-semibold text-foreground">
                      {format(currentMonth, 'MMMM yyyy')}
                    </h2>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-white/5" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-white/5" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {availability.length === 0 ? (
                    <div className="text-center p-8 bg-black/20 rounded-xl border border-dashed border-[#2C2C2C] mt-8">
                      <p className="text-muted-foreground text-sm font-medium">This host hasn't set up their availability yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-sm">
                      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                        <div key={d} className="text-muted-foreground font-medium text-[10px] sm:text-xs py-2">{d}</div>
                      ))}
                      {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
                      {days.map(day => {
                        const isAvail = isDayAvailable(day);
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isTodayDate = isToday(day);
                        return (
                          <div key={day.toISOString()} className="p-0.5 sm:p-1">
                            <button
                              disabled={!isAvail}
                              onClick={() => setSelectedDate(day)}
                              className={`
                                w-full aspect-square rounded-md flex items-center justify-center text-sm font-medium transition-all
                                ${!isAvail ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-[#2C2C2C] text-foreground bg-[#252525]'}
                                ${isTodayDate && !isSelected ? 'text-primary font-bold bg-[#333]' : ''}
                                ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary shadow-md' : ''}
                              `}
                            >
                              {format(day, 'd')}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div className="w-full sm:w-[260px] p-6 md:p-8 flex flex-col bg-[#1C1C1C] animate-in fade-in slide-in-from-right-4 duration-300">
                    <h3 className="font-semibold text-foreground mb-6">{format(selectedDate, 'EEEE d')}</h3>
                    <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[350px] custom-scrollbar">
                      {timeSlots.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No available times.</p>
                      ) : (
                        timeSlots.map(time => (
                          <div key={time.toISOString()} className="flex items-center">
                            <Button
                              variant="outline"
                              className="w-full justify-start h-10 text-foreground bg-transparent border-[#2C2C2C] hover:border-primary hover:text-primary transition-colors rounded-md text-sm font-medium"
                              onClick={() => setSelectedTime(time)}
                            >
                              <div className="w-2 h-2 rounded-full bg-primary/80 mr-3"></div>
                              {format(time, 'h:mm a')}
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Booking Form */
              <div className="p-6 md:p-10 flex-1 animate-in fade-in slide-in-from-right-4 duration-300 bg-[#1C1C1C]">
                <form onSubmit={handleBook} className="max-w-md space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">Your name *</Label>
                    <Input
                      id="name"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="h-11 bg-transparent border-[#2C2C2C] focus-visible:ring-primary rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">Email address *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="h-11 bg-transparent border-[#2C2C2C] focus-visible:ring-primary rounded-lg text-sm"
                    />
                  </div>
                  
                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-end gap-4 border-t border-[#2C2C2C] mt-8">
                    <div className="flex gap-3">
                      <Button type="button" variant="ghost" onClick={() => setSelectedTime(null)} className="rounded-full px-6 hover:bg-white/5">
                        Back
                      </Button>
                      <Button type="submit" className="rounded-full px-6 bg-primary text-primary-foreground font-semibold" disabled={submitting}>
                        {submitting ? 'Confirming...' : 'Confirm'}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-muted-foreground font-semibold text-lg flex items-center opacity-60">
          Calone
        </div>
      </div>
    </div>
  );
}
