import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TIMEZONES = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Central European Time' },
  { value: 'Asia/Calcutta', label: 'India Standard Time' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'UTC', label: 'UTC' },
];

const DAYS = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

type TimeBlock = { startTime: string; endTime: string };
type AvailabilityState = Record<number, { enabled: boolean; blocks: TimeBlock[] }>;

const defaultBlocks: TimeBlock[] = [{ startTime: '09:00', endTime: '17:00' }];

export default function AvailabilitySettings() {
  const [schedule, setSchedule] = useState<AvailabilityState>({
    0: { enabled: false, blocks: [...defaultBlocks] },
    1: { enabled: true, blocks: [...defaultBlocks] },
    2: { enabled: true, blocks: [...defaultBlocks] },
    3: { enabled: true, blocks: [...defaultBlocks] },
    4: { enabled: true, blocks: [...defaultBlocks] },
    5: { enabled: true, blocks: [...defaultBlocks] },
    6: { enabled: false, blocks: [...defaultBlocks] },
  });



  const [timezone, setTimezone] = useState('Asia/Calcutta');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/availability'),
      api.get('/user/me')
    ]).then(([availRes, userRes]) => {
      const data = availRes.data.availability || [];
      if (userRes.data?.timezone) {
        setTimezone(userRes.data.timezone);
      }
      if (data && data.length > 0) {
        // Transform flat array into state
        const newState: AvailabilityState = { ...schedule };
        // Reset all to disabled first if we have DB data
        Object.keys(newState).forEach(k => {
          newState[Number(k)].enabled = false;
          newState[Number(k)].blocks = [];
        });

        data.forEach((item: any) => {
          newState[item.dayOfWeek].enabled = true;
          newState[item.dayOfWeek].blocks.push({
            startTime: item.startTime,
            endTime: item.endTime
          });
        });

        // For any enabled day that has no blocks (shouldn't happen, but just in case)
        // Or for disabled days, give them the default block so the UI has something if toggled
        Object.keys(newState).forEach(k => {
          if (newState[Number(k)].blocks.length === 0) {
            newState[Number(k)].blocks = [...defaultBlocks];
          }
        });

        setSchedule(newState);
      }
      setIsLoading(false);
    });
  }, []);

  const handleToggleDay = (day: number) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled }
    }));
  };

  const handleUpdateBlock = (day: number, blockIndex: number, field: keyof TimeBlock, value: string) => {
    setSchedule(prev => {
      const newBlocks = [...prev[day].blocks];
      newBlocks[blockIndex] = { ...newBlocks[blockIndex], [field]: value };
      return { ...prev, [day]: { ...prev[day], blocks: newBlocks } };
    });
  };

  const handleAddBlock = (day: number) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], blocks: [...prev[day].blocks, { startTime: '09:00', endTime: '17:00' }] }
    }));
  };

  const handleRemoveBlock = (day: number, blockIndex: number) => {
    setSchedule(prev => {
      const newBlocks = prev[day].blocks.filter((_, idx) => idx !== blockIndex);
      // If we removed the last block, disable the day
      if (newBlocks.length === 0) {
        return { ...prev, [day]: { enabled: false, blocks: [...defaultBlocks] } };
      }
      return { ...prev, [day]: { ...prev[day], blocks: newBlocks } };
    });
  };

  const handleSave = async () => {
    try {
      const payload: { dayOfWeek: number, startTime: string, endTime: string }[] = [];
      let hasError = false;

      Object.entries(schedule).forEach(([dayStr, data]) => {
        if (data.enabled) {
          // Sort blocks by start time
          const sortedBlocks = [...data.blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
          
          for (let i = 0; i < sortedBlocks.length; i++) {
            const block = sortedBlocks[i];
            
            if (block.startTime >= block.endTime) {
              toast.error(`Invalid time range on ${DAYS.find(d => d.value === Number(dayStr))?.label}: Start time must be before end time.`);
              hasError = true;
              return;
            }

            if (i > 0) {
              const prevBlock = sortedBlocks[i - 1];
              if (block.startTime < prevBlock.endTime) {
                toast.error(`Overlapping time slots on ${DAYS.find(d => d.value === Number(dayStr))?.label}`);
                hasError = true;
                return;
              }
            }

            payload.push({
              dayOfWeek: Number(dayStr),
              startTime: block.startTime,
              endTime: block.endTime
            });
          }
        }
      });

      if (hasError) return;

      await Promise.all([
        api.post('/availability', { schedule: payload }),
        api.put('/user/me', { timezone })
      ]);
      toast.success('Availability schedule saved successfully!');
    } catch (err: any) {
      toast.error('Failed to save availability');
    }
  };

  if (isLoading) return <div className="p-8 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="w-full pt-2 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 mt-0.5 rounded-full text-muted-foreground hover:text-white" asChild>
            <Link to="/dashboard/event-types">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-[20px] font-bold text-foreground flex items-center gap-2">
              Working hours
            </h2>
            <p className="text-[14px] text-muted-foreground mt-0.5 font-medium">Mon - Fri, 9:00 AM - 5:00 PM</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={handleSave} className="bg-white text-black hover:bg-white/90 rounded-md h-[32px] px-4 font-semibold text-sm">
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Schedule */}
        <div className="flex-1 w-full rounded-[10px] border border-border/40 bg-card overflow-hidden">
          <div className="flex flex-col">
            {DAYS.map((day) => {
              const dayData = schedule[day.value];
              return (
                <div key={day.value} className="flex flex-col sm:flex-row sm:items-start p-4">
                  {/* Switch and Day Name */}
                  <div className="flex items-center gap-3 w-[140px] pt-1">
                    <Switch 
                      checked={dayData.enabled} 
                      onCheckedChange={() => handleToggleDay(day.value)} 
                      className="data-[state=checked]:bg-white data-[state=checked]:border-white [&>span]:data-[state=checked]:bg-black scale-90"
                    />
                    <span className="font-semibold text-[14px] text-white">{day.label}</span>
                  </div>
                  
                  {/* Time Blocks */}
                  <div className="flex-1 flex flex-col gap-3">
                    {dayData.enabled ? (
                      dayData.blocks.map((block, blockIdx) => (
                        <div key={blockIdx} className="flex items-center gap-3">
                          <Input 
                            type="time" 
                            value={block.startTime} 
                            onChange={(e) => handleUpdateBlock(day.value, blockIdx, 'startTime', e.target.value)} 
                            className="w-[120px] h-[36px] bg-transparent border-[#333333] text-[14px] focus-visible:ring-1 focus-visible:ring-primary rounded-md text-white text-center [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                          />
                          <span className="text-muted-foreground/60 text-[14px]">-</span>
                          <Input 
                            type="time" 
                            value={block.endTime} 
                            onChange={(e) => handleUpdateBlock(day.value, blockIdx, 'endTime', e.target.value)} 
                            className="w-[120px] h-[36px] bg-transparent border-[#333333] text-[14px] focus-visible:ring-1 focus-visible:ring-primary rounded-md text-white text-center [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                          />
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleAddBlock(day.value)}
                            className="text-muted-foreground hover:text-white h-8 w-8 ml-1"
                          >
                            <Plus className="h-[18px] w-[18px]" />
                          </Button>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoveBlock(day.value, blockIdx)}
                            className="text-muted-foreground hover:text-destructive h-8 w-8"
                          >
                            <Trash2 className="h-[18px] w-[18px]" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground/60 text-[14px] py-1.5">Unavailable</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="w-full lg:w-[280px] flex-shrink-0 space-y-2">
          <div className="text-[13px] font-semibold text-white mb-2">Timezone</div>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="w-full bg-card border-border/40 text-[14px] h-[36px] rounded-md text-white">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent className="border-border bg-card">
              {TIMEZONES.map(tz => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
