import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Globe } from 'lucide-react';
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
      const data = availRes.data;
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
      Object.entries(schedule).forEach(([dayStr, data]) => {
        if (data.enabled) {
          data.blocks.forEach(block => {
            payload.push({
              dayOfWeek: Number(dayStr),
              startTime: block.startTime,
              endTime: block.endTime
            });
          });
        }
      });

      await Promise.all([
        api.post('/availability', { schedule: payload }),
        api.put('/user/me', { timezone })
      ]);
      toast.success('Availability schedule saved successfully!');
    } catch (err: any) {
      toast.error('Failed to save availability');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">Working hours</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Configure times when you are available for bookings.</p>
        </div>
        <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-6">
          Save
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="flex-1 overflow-hidden border-border bg-card">
          <div className="flex flex-col">
            {DAYS.map((day, idx) => {
              const dayData = schedule[day.value];
              return (
                <div key={day.value} className={`flex flex-col sm:flex-row sm:items-start gap-4 p-5 ${idx !== DAYS.length - 1 ? 'border-b border-border/50' : ''}`}>
                  <div className="flex items-center gap-3 w-40 pt-2">
                    <Switch 
                      checked={dayData.enabled} 
                      onCheckedChange={() => handleToggleDay(day.value)} 
                      className="data-[state=checked]:bg-primary"
                    />
                    <span className="font-medium text-sm">{day.label}</span>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    {dayData.enabled ? (
                      dayData.blocks.map((block, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input 
                            type="time" 
                            value={block.startTime} 
                            onChange={(e) => handleUpdateBlock(day.value, idx, 'startTime', e.target.value)} 
                            className="w-28 h-9 bg-transparent border-border/50 text-sm focus-visible:ring-1 focus-visible:ring-primary rounded-md"
                          />
                          <span className="text-muted-foreground">-</span>
                          <Input 
                            type="time" 
                            value={block.endTime} 
                            onChange={(e) => handleUpdateBlock(day.value, idx, 'endTime', e.target.value)} 
                            className="w-28 h-9 bg-transparent border-border/50 text-sm focus-visible:ring-1 focus-visible:ring-primary rounded-md"
                          />
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoveBlock(day.value, idx)}
                            className="text-muted-foreground hover:text-destructive ml-2 h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          {idx === dayData.blocks.length - 1 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleAddBlock(day.value)}
                              className="text-muted-foreground h-8 w-8"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground text-sm py-2">Unavailable</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="w-full lg:w-64 space-y-4">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
                <Globe className="mr-2 h-4 w-4" />
                Timezone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="w-full bg-transparent border-border/50 text-sm h-9">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label} ({tz.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>


      </div>
    </div>
  );
}
