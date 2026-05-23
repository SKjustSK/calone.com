import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/services/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Clock, Calendar as CalendarIcon, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Globe, Video } from 'lucide-react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, isBefore, addMinutes, startOfDay, getDay, addDays
} from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EventType {
  id: string;
  title: string;
  description: string;
  duration: number;
  bufferTime: number;
  user: { id: string; name: string; email: string; timezone: string };
  bookings: { startTime: string; endTime: string; eventType?: { bufferTime: number } }[];
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
  const [bookerTimezone, setBookerTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

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
        let endLimit = fromZonedTime(endStr, hostTimezone);

        if (isBefore(endLimit, currentSlot)) {
          endLimit = addDays(endLimit, 1);
        }

        while (isBefore(currentSlot, endLimit)) {
          const slotEnd = addMinutes(currentSlot, event.duration);
          if (isBefore(slotEnd, endLimit) || slotEnd.getTime() === endLimit.getTime()) {
            if (isSameDay(currentSlot, date)) {
              if (!isBefore(currentSlot, now)) {
                const conflict = event.bookings.some((b: any) => {
                  const bStart = new Date(b.startTime);
                  const bEndWithBuffer = addMinutes(new Date(b.endTime), b.eventType?.bufferTime || 0);
                  const slotEndWithBuffer = addMinutes(slotEnd, event.bufferTime || 0);
                  return currentSlot < bEndWithBuffer && slotEndWithBuffer > bStart;
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
      <div className="flex min-h-screen bg-[#0a0a0a] items-center justify-center p-4 text-white font-sans">
        <div className="w-full max-w-[600px] bg-[#1C1C1C] rounded-[10px] p-8 md:p-12 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-4 mb-10">
            <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center mb-2">
              <CheckCircle2 className="h-6 w-6 text-teal-500" />
            </div>
            <h1 className="text-[24px] font-bold">This meeting is scheduled</h1>
            <p className="text-muted-foreground text-[14px]">We sent an email with a calendar invitation with the details to everyone.</p>
          </div>

          <div className="border border-[#333] rounded-[8px] overflow-hidden divide-y divide-[#333] text-[14px]">
            <div className="flex flex-col sm:flex-row p-4 sm:p-5">
              <div className="w-32 font-semibold text-muted-foreground mb-1 sm:mb-0">What</div>
              <div className="flex-1 font-semibold">{event.title} between {event.user.name} and {name}</div>
            </div>
            <div className="flex flex-col sm:flex-row p-4 sm:p-5">
              <div className="w-32 font-semibold text-muted-foreground mb-1 sm:mb-0">When</div>
              <div className="flex-1">
                <div className="font-semibold">{selectedTime && format(toZonedTime(selectedTime, bookerTimezone), 'EEEE, MMMM d, yyyy')}</div>
                <div className="text-muted-foreground mt-0.5">
                  {selectedTime && `${format(toZonedTime(selectedTime, bookerTimezone), 'h:mm a')} - ${format(toZonedTime(addMinutes(selectedTime, event.duration), bookerTimezone), 'h:mm a')} (${bookerTimezone})`}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row p-4 sm:p-5">
              <div className="w-32 font-semibold text-muted-foreground mb-1 sm:mb-0">Who</div>
              <div className="flex-1 space-y-4">
                <div>
                  <div className="font-semibold">{event.user.name} <span className="text-muted-foreground text-[11px] font-medium ml-2 border border-[#333] bg-[#262626] rounded-md px-1.5 py-0.5">Host</span></div>
                  <div className="text-muted-foreground mt-0.5">{event.user.email}</div>
                </div>
                <div>
                  <div className="font-semibold">{name}</div>
                  <div className="text-muted-foreground mt-0.5">{email}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <div className="text-white font-bold text-[14px] inline-flex items-center">
              Calone
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
    <div className="flex min-h-screen bg-[#0a0a0a] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="flex flex-col items-center w-full">
        <div className="bg-[#1C1C1C] rounded-[10px] flex flex-col md:flex-row w-full max-w-[1050px] overflow-hidden">
          
          {/* Left Sidebar: Event Info */}
          <div className="p-6 md:p-8 flex flex-col w-full md:w-[320px] flex-shrink-0">
            {selectedTime && (
              <button onClick={() => setSelectedTime(null)} className="mb-6 h-8 w-8 rounded-full border border-[#2C2C2C] flex items-center justify-center hover:bg-white/5 transition-colors text-white">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-[13px]">
                {event.user.name.charAt(0).toUpperCase()}
              </div>
            </div>
            
            <h3 className="text-[14px] font-semibold text-muted-foreground/80 mb-1">{event.user.name}</h3>
            <h1 className="text-[24px] font-bold text-white mb-6">{event.title}</h1>
            
            <div className="space-y-4">
              {selectedTime && (
                <div className="flex items-start text-white font-medium text-[14px]">
                  <CalendarIcon className="h-[18px] w-[18px] mr-3 mt-0.5 text-muted-foreground" />
                  <div>
                    <div>{format(toZonedTime(selectedTime, bookerTimezone), 'EEEE, MMMM d, yyyy')}</div>
                    <div className="text-muted-foreground font-normal mt-0.5">
                      {format(toZonedTime(selectedTime, bookerTimezone), 'h:mm a')} - {format(toZonedTime(addMinutes(selectedTime, event.duration), bookerTimezone), 'h:mm a')}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center text-muted-foreground text-[14px] font-medium">
                <Clock className="h-[18px] w-[18px] mr-3" />
                {event.duration}m
              </div>
              <div className="flex items-center text-muted-foreground text-[14px] font-medium w-full">
                <Globe className="h-[18px] w-[18px] mr-3 flex-shrink-0" />
                <Select value={bookerTimezone} onValueChange={setBookerTimezone}>
                  <SelectTrigger className="h-6 border-none bg-transparent shadow-none px-0 text-[14px] font-medium text-muted-foreground hover:text-white focus:ring-0 w-max justify-start gap-1">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-[#333] max-h-[300px]">
                    {Intl.supportedValuesOf('timeZone').map(tz => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {event.description && (
              <p className="mt-8 text-muted-foreground text-[14px] leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            )}
          </div>

          {/* Right Area: Calendar or Form */}
          <div className="flex-1 flex flex-col sm:flex-row bg-[#1C1C1C]">
            {!selectedTime ? (
              <>
                {/* Calendar Grid */}
                <div className="p-6 md:p-8 flex-1">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-[15px] font-semibold text-white">
                      {format(currentMonth, 'MMMM yyyy')}
                    </h2>
                    <div className="flex space-x-1">
                      <button className="text-muted-foreground hover:text-white p-1" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button className="text-muted-foreground hover:text-white p-1" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {availability.length === 0 ? (
                    <div className="text-center p-8 mt-8">
                      <p className="text-muted-foreground text-[14px] font-medium">No availability.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center max-w-[340px] mx-auto">
                      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                        <div key={d} className="text-white font-semibold text-[11px] mb-2 tracking-wider">{d}</div>
                      ))}
                      {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
                      {days.map(day => {
                        const isAvail = isDayAvailable(day);
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isTodayDate = isToday(day);
                        
                        return (
                          <div key={day.toISOString()} className="p-0.5 relative flex justify-center">
                            <button
                              disabled={!isAvail}
                              onClick={() => setSelectedDate(day)}
                              className={`
                                w-[42px] h-[42px] rounded-[8px] flex items-center justify-center text-[15px] font-medium transition-colors
                                ${!isAvail ? 'text-muted-foreground/30 cursor-not-allowed' : 'text-white hover:bg-[#333]'}
                                ${isSelected ? 'bg-white text-black hover:bg-white' : 'bg-[#262626]'}
                                ${isTodayDate && !isSelected ? 'text-white' : ''}
                              `}
                            >
                              <span className={isTodayDate ? "mt-2" : ""}>{format(day, 'd')}</span>
                            </button>
                            {isTodayDate && (
                              <div className={`absolute top-1 text-[9px] font-bold ${isSelected ? 'text-black' : 'text-white'}`}>
                                {format(day, 'MMM').toUpperCase()}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div className="w-full sm:w-[280px] p-6 md:p-8 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-semibold text-white text-[15px]">{format(toZonedTime(selectedDate, bookerTimezone), 'E d')}</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-3 space-y-2 max-h-[380px] custom-scrollbar">
                      {timeSlots.length === 0 ? (
                        <p className="text-muted-foreground text-[14px]">No available times.</p>
                      ) : (
                        timeSlots.map(time => (
                          <div key={time.toISOString()} className="flex items-center">
                            <button
                              className="w-full h-[42px] flex items-center justify-center text-white bg-transparent border border-[#333333] hover:border-white transition-colors rounded-[6px] text-[14px] font-medium"
                              onClick={() => setSelectedTime(time)}
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-2.5"></div>
                              {format(toZonedTime(time, bookerTimezone), 'h:mma').toLowerCase()}
                            </button>
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
                    <Label htmlFor="name" className="text-[14px] font-medium text-white">Your name *</Label>
                    <Input
                      id="name"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="h-11 bg-transparent border-[#333] focus-visible:ring-1 focus-visible:ring-white rounded-md text-[14px] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[14px] font-medium text-white">Email address *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="h-11 bg-transparent border-[#333] focus-visible:ring-1 focus-visible:ring-white rounded-md text-[14px] text-white"
                    />
                  </div>
                  
                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-end gap-4 mt-8">
                    <div className="flex gap-3">
                      <Button type="submit" className="rounded-md px-6 bg-white text-black hover:bg-white/90 font-semibold h-9 text-[14px]" disabled={submitting}>
                        {submitting ? 'Confirming...' : 'Confirm'}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-white font-bold text-[14px] flex items-center">
          Calone
        </div>
      </div>
    </div>
  );
}
