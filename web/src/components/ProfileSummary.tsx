import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User as UserIcon, Star, MapPin, Leaf } from 'lucide-react';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';

type PublicProfile = {
  email: string;
  name: string;
  role: 'farmer' | 'distributor' | 'consumer' | 'admin';
  createdAt: string;
  profile?: {
    location?: string;
    experienceYears?: number;
    mainCrops?: string[];
    specialties?: string[];
    avgDealSize?: number | null;
    bio?: string;
  };
  reviewsSummary?: {
    avgRating: number;
    total: number;
  };
};

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const text = await res.text();
  let data: any;
  try { data = text ? JSON.parse(text) : {}; } catch { throw new Error('Invalid response'); }
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data as T;
}

export default function ProfileSummary({ title = 'Your Profile', email }: { title?: string; email?: string }) {
  const [data, setData] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let url = `${API_BASE}/auth/profile`;
    const init: RequestInit = { credentials: 'include' };
    if (email) {
      url = `${API_BASE}/profiles/${encodeURIComponent(email)}`;
      // public endpoint; no credentials required
      delete (init as any).credentials;
    }
    fetchJson<PublicProfile>(url, init).then(setData).catch((e) => setError(String(e?.message || e)));
  }, [email]);

  const rating = data?.reviewsSummary?.avgRating ?? 0;
  const total = data?.reviewsSummary?.total ?? 0;

  return (
    <Card className="mb-6">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-sm text-muted-foreground">
              {data ? (
                <>
                  {data.name} • {data.role}
                  {data.profile?.location ? (
                    <span className="ml-2 inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{data.profile.location}</span>
                  ) : null}
                  {typeof data.profile?.experienceYears === 'number' && data.profile.experienceYears > 0 ? (
                    <span className="ml-2">• {data.profile.experienceYears} yrs</span>
                  ) : null}
                </>
              ) : error ? (
                <span className="text-red-500">{error}</span>
              ) : (
                'Loading profile...'
              )}
            </div>
            {data?.profile?.mainCrops && data.profile.mainCrops.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {data.profile.mainCrops.slice(0, 3).map((c) => (
                  <Badge key={c} variant="secondary" className="inline-flex items-center gap-1"><Leaf className="h-3 w-3" />{c}</Badge>
                ))}
                {data.profile.mainCrops.length > 3 && (
                  <Badge variant="outline">+{data.profile.mainCrops.length - 3}</Badge>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1">
            <Star className={rating > 0 ? 'h-4 w-4 text-yellow-500' : 'h-4 w-4 text-muted-foreground'} />
            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
          </div>
          <div className="text-xs text-muted-foreground">{total} reviews</div>
        </div>
      </CardContent>
    </Card>
  );
}
