import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { authApi, profilesApi, PublicProfile, Review } from '@/lib/api';

const roleTitles = {
  farmer: 'Farmer',
  distributor: 'Distributor',
  consumer: 'Consumer'
};

const Profile = () => {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    experienceYears: 0,
    mainCrops: '' as string, // comma-separated
    specialties: '' as string, // comma-separated
    avgDealSize: '' as string, // number as string for input
    bio: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const p = await authApi.getProfile();
        setProfile(p);
        setFormData({
          name: p.name || '',
          email: p.email || '',
          location: p.profile?.location || '',
          experienceYears: Number(p.profile?.experienceYears || 0),
          mainCrops: (p.profile?.mainCrops || []).join(', '),
          specialties: (p.profile?.specialties || []).join(', '),
          avgDealSize: p.profile?.avgDealSize != null ? String(p.profile.avgDealSize) : '',
          bio: p.profile?.bio || '',
        });
        // Load reviews for this profile
        const r = await profilesApi.getReviews(p.email);
        setReviews(r.reviews || []);
      } catch (e: any) {
        console.error('Failed to load profile:', e);
      }
    };
    load();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updated = await authApi.updateProfile({ 
        name: formData.name,
        location: formData.location,
        experienceYears: Number(formData.experienceYears) || 0,
        mainCrops: formData.mainCrops.split(',').map(s => s.trim()).filter(Boolean),
        specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
        avgDealSize: formData.avgDealSize === '' ? undefined : Number(formData.avgDealSize) || 0,
        bio: formData.bio,
      });
      setProfile(updated);
      setFormData(prev => ({ 
        ...prev, 
        name: updated.name,
        location: updated.profile.location,
        experienceYears: updated.profile.experienceYears,
        mainCrops: (updated.profile.mainCrops || []).join(', '),
        specialties: (updated.profile.specialties || []).join(', '),
        avgDealSize: updated.profile.avgDealSize != null ? String(updated.profile.avgDealSize) : '',
        bio: updated.profile.bio || ''
      }));
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
        variant: 'default',
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: 'Error', description: 'New password must be at least 8 characters', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      await authApi.changePassword({ oldPassword, newPassword });
      toast({ title: 'Password Changed', description: 'Your password has been updated.' });
      setShowPasswordForm(false);
      setOldPassword('');
      setNewPassword('');
    } catch (error: any) {
      toast({ title: 'Error', description: error?.error || 'Failed to change password', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    try {
      await authApi.deleteAccount();
      toast({ title: 'Account Deleted', description: 'Your account has been deleted.' });
      await logout();
    } catch (error: any) {
      toast({ title: 'Error', description: error?.error || 'Failed to delete account', variant: 'destructive' });
    }
  };

  if (!user) {
    return null; // or redirect to login
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  {roleTitles[user.role as keyof typeof roleTitles]} Account
                  {profile?.reviewsSummary && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      • Rating {profile.reviewsSummary.avgRating || 0}/5 ({profile.reviewsSummary.total} reviews)
                    </span>
                  )}
                </CardDescription>
              </div>
              <Button 
                variant={isEditing ? 'outline' : 'default'}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </div>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                ) : (
                  <p className="text-sm">{formData.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled
                  />
                ) : (
                  <p className="text-sm">{formData.email}</p>
                )}
              </div>
              
              {/* Extended profile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  {isEditing ? (
                    <Input id="location" name="location" value={formData.location} onChange={handleChange} />
                  ) : (
                    <p className="text-sm">{formData.location || '—'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experienceYears">Experience (years)</Label>
                  {isEditing ? (
                    <Input id="experienceYears" name="experienceYears" type="number" value={String(formData.experienceYears)} onChange={handleChange} />
                  ) : (
                    <p className="text-sm">{formData.experienceYears || 0}</p>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="mainCrops">{user.role === 'farmer' ? 'Crops grown/sold' : 'Specialties'}</Label>
                  {isEditing ? (
                    <Input id="mainCrops" name="mainCrops" placeholder="e.g., Wheat, Rice" value={formData.mainCrops} onChange={handleChange} />
                  ) : (
                    <p className="text-sm">{formData.mainCrops || '—'}</p>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="specialties">Additional specialties</Label>
                  {isEditing ? (
                    <Input id="specialties" name="specialties" placeholder="e.g., Cold-chain, Organic" value={formData.specialties} onChange={handleChange} />
                  ) : (
                    <p className="text-sm">{formData.specialties || '—'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avgDealSize">Typical deal size (₹)</Label>
                  {isEditing ? (
                    <Input id="avgDealSize" name="avgDealSize" type="number" value={formData.avgDealSize} onChange={handleChange} />
                  ) : (
                    <p className="text-sm">{formData.avgDealSize || '—'}</p>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="bio">About</Label>
                  {isEditing ? (
                    <textarea id="bio" name="bio" className="w-full min-h-[100px] border rounded-md p-2 bg-background" value={formData.bio} onChange={handleChange} />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{formData.bio || '—'}</p>
                  )}
                </div>
              </div>
              
              {isEditing && (
                <div className="pt-4 flex items-center gap-3">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </form>
          
          <CardFooter className="border-t pt-6">
            <div className="w-full space-y-4">
              {/* Reviews summary */}
              {reviews.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Recent Reviews</h3>
                  <div className="space-y-3">
                    {reviews.slice(0, 5).map((r, idx) => (
                      <div key={idx} className="text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{r.fromEmail}</span>
                          <span className="text-yellow-600">{r.rating}/5</span>
                        </div>
                        <div className="text-muted-foreground">{new Date(r.dateISO).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                        {r.comment && <div className="mt-1">{r.comment}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="font-medium">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">
                  Be careful with these actions as they cannot be undone.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowPasswordForm(v => !v)}>
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </Button>
                <Button variant="destructive" className="w-full sm:w-auto" onClick={handleDeleteAccount}>
                  Delete Account
                </Button>
              </div>

              {showPasswordForm && (
                <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-2 gap-4 border rounded-lg p-4">
                  <div className="space-y-2">
                    <Label htmlFor="oldPassword">Current Password</Label>
                    <Input id="oldPassword" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={isLoading}>{isLoading ? 'Updating...' : 'Update Password'}</Button>
                  </div>
                </form>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
