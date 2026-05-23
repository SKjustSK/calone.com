import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/services/api';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PublicEventType {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  slug: string;
}

interface PublicProfile {
  name: string;
  slug: string;
  email: string;
  events: PublicEventType[];
}

export default function PublicProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/events/public/${username}`);
        if (response.data && response.data.length > 0) {
          const user = response.data[0].user;
          setProfile({
            name: user.name,
            slug: user.slug,
            email: user.email,
            events: response.data.map((e: any) => ({
              id: e.id,
              title: e.title,
              description: e.description,
              duration: e.duration,
              slug: e.slug
            }))
          });
        }
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    if (username) {
      fetchProfile();
    }
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-muted-foreground text-[14px]">
        Loading...
      </div>
    );
  }

  if (!profile || profile.events.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-muted-foreground text-[14px]">
        No events found for this user.
      </div>
    );
  }

  const initial = profile.name ? profile.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-24 px-4 flex justify-center items-start font-sans">
      <div className="w-full max-w-[650px] space-y-4">
        
        {/* Profile Card */}
        <div className="rounded-[10px] border border-[#2C2C2C] bg-[#111111] p-6">
          <div className="flex flex-col gap-4">
            <div className="h-10 w-10 rounded-full bg-teal-500 flex items-center justify-center text-white text-[18px] font-medium">
              {initial}
            </div>
            <h1 className="text-[18px] font-bold text-white">
              {profile.name}
            </h1>
          </div>
        </div>

        {/* Events List */}
        <div className="rounded-[10px] border border-[#2C2C2C] bg-[#111111] overflow-hidden">
          <div className="flex flex-col">
            {profile.events.map((event, idx) => (
              <Link 
                to={`/${profile.slug}/${event.slug}`} 
                key={event.id}
                className={cn(
                  "p-5 flex flex-col gap-2 transition-colors hover:bg-[#1a1a1a]",
                  idx !== profile.events.length - 1 && "border-b border-[#2C2C2C]"
                )}
              >
                <div className="font-semibold text-[#f2f2f2] text-[14px]">
                  {event.title}
                </div>
                <div className="flex items-center text-[#a1a1a1] text-[12px] bg-[#2C2C2C] w-max px-2 py-0.5 rounded-[4px] font-medium">
                  <Clock className="w-[12px] h-[12px] mr-1.5" />
                  {event.duration}m
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
