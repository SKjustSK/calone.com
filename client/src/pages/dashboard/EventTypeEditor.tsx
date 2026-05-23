import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EventTypeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [duration, setDuration] = useState(30);
  const [bufferTime, setBufferTime] = useState(0);
  const [description, setDescription] = useState('');
  
  useEffect(() => {
    if (isEditing) {
      api.get('/events').then(res => {
        const ev = res.data.find((e: any) => e.id === id);
        if (ev) {
          setTitle(ev.title);
          setSlug(ev.slug);
          setDuration(ev.duration);
          setBufferTime(ev.bufferTime || 0);
          setDescription(ev.description || '');
        }
      });
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { title, slug, duration, bufferTime, description };
      if (isEditing) {
        await api.put(`/events/${id}`, payload);
        toast.success("Event type updated successfully");
      } else {
        await api.post('/events', payload);
        toast.success("Event type created successfully");
      }
      navigate('/dashboard/event-types');
    } catch (err: any) {
      toast.error(err.response?.data?.error || "An error occurred");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" asChild className="mb-6 -ml-4">
        <Link to="/dashboard/event-types">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to events
        </Link>
      </Button>
      
      <div className="mb-8">
        <h2 className="text-[22px] font-bold text-foreground">{isEditing ? 'Edit Event Type' : 'New Event Type'}</h2>
        <p className="text-[14px] text-muted-foreground mt-1 font-medium">Configure the details of this meeting type.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input 
            id="title" 
            placeholder="e.g. 15 Min Discovery Call" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            required 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">URL Slug</Label>
          <div className="flex rounded-md shadow-sm">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-border bg-muted px-3 text-muted-foreground sm:text-sm">
              Calone.com/admin/
            </span>
            <Input 
              id="slug" 
              className="rounded-l-none" 
              placeholder="15-min" 
              value={slug} 
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} 
              required 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input 
            id="duration" 
            type="number" 
            min="1" 
            value={duration} 
            onChange={e => setDuration(parseInt(e.target.value))} 
            required 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bufferTime">Buffer Time (minutes)</Label>
          <Select value={bufferTime.toString()} onValueChange={(v) => setBufferTime(parseInt(v))}>
            <SelectTrigger id="bufferTime">
              <SelectValue placeholder="Select buffer time" />
            </SelectTrigger>
            <SelectContent>
              {[0, 5, 10, 15, 30, 45, 60].map((mins) => (
                <SelectItem key={mins} value={mins.toString()}>
                  {mins} {mins === 1 ? 'minute' : 'minutes'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[13px] text-muted-foreground mt-1">Automatically adds blocked time after this meeting.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input 
            id="description" 
            placeholder="Instructions for the meeting..." 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit">{isEditing ? 'Save Changes' : 'Create Event Type'}</Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/dashboard/event-types">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
