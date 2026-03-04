import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, CreditCard, Ticket, Plus, Shield, RefreshCw, Search, XCircle, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  has_access: boolean;
  access_type: string | null;
  subscription_status: string | null;
  promo_used: string | null;
  created_at: string;
}

interface AccessCode {
  id: string;
  code: string;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
}

interface Subscription {
  id: string;
  price_id: string;
  status: string;
  cancel_at_period_end: boolean | null;
}

const PLAN_PRICES: Record<string, { name: string; price: number }> = {
  price_1SpOpRQrqKHReEDtP3WD1zne: { name: 'Basic', price: 4.99 },
  price_1SpOqPQrqKHReEDtqHZcLsbY: { name: 'Pro', price: 13.99 },
  price_1Sn2CkQrqKHReEDtvJ6iR1gz: { name: 'Insider', price: 49.00 },
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New access code form
  const [newCode, setNewCode] = useState('');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState('');
  const [isCreatingCode, setIsCreatingCode] = useState(false);
  const [cancelingUserId, setCancelingUserId] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    setIsCheckingAdmin(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
    } catch (error) {
      console.error('Error checking admin:', error);
      setIsAdmin(false);
    } finally {
      setIsCheckingAdmin(false);
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [profilesRes, codesRes, rolesRes, subsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('access_codes').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('*').order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('id, price_id, status, cancel_at_period_end'),
      ]);

      if (profilesRes.data) setProfiles(profilesRes.data);
      if (codesRes.data) setAccessCodes(codesRes.data);
      if (rolesRes.data) setUserRoles(rolesRes.data as UserRole[]);
      if (subsRes.data) setSubscriptions(subsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    setIsCreatingCode(true);
    try {
      const { error } = await supabase.from('access_codes').insert({
        code: newCode.trim().toUpperCase(),
        max_uses: newCodeMaxUses ? parseInt(newCodeMaxUses) : null,
        is_active: true,
      });

      if (error) {
        toast.error('Failed to create access code');
        console.error('Error:', error);
        return;
      }

      toast.success('Access code created!');
      setNewCode('');
      setNewCodeMaxUses('');
      fetchAllData();
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsCreatingCode(false);
    }
  };

  const toggleCodeStatus = async (codeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('access_codes')
        .update({ is_active: !currentStatus })
        .eq('id', codeId);

      if (error) {
        toast.error('Failed to update code');
        return;
      }

      toast.success(`Code ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchAllData();
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleCancelSubscription = async (userId: string, email: string | null) => {
    if (!confirm(`Cancel subscription and revoke access for ${email || userId}?`)) return;
    
    setCancelingUserId(userId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-cancel-subscription', {
        body: { target_user_id: userId },
      });

      if (error) {
        toast.error('Failed to cancel subscription');
        console.error('Cancel error:', error);
        return;
      }

      toast.success(data?.message || `Subscription canceled (${data?.canceled_count || 0} canceled)`);
      fetchAllData();
    } catch (error) {
      toast.error('Something went wrong');
      console.error('Cancel error:', error);
    } finally {
      setCancelingUserId(null);
    }
  };

  const filteredProfiles = profiles.filter(profile => 
    profile.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.promo_used?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (authLoading || isCheckingAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card variant="glass" className="max-w-md">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-destructive mx-auto mb-2" />
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to view this page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                Go Home
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage users, subscriptions, and access codes</p>
            </div>
            <Button variant="outline" onClick={fetchAllData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Revenue & Stats Cards */}
          {(() => {
            const activeSubs = subscriptions.filter(s => s.status === 'active');
            const canceledSubs = subscriptions.filter(s => s.status === 'canceled');
            const cancelingSubs = subscriptions.filter(s => s.cancel_at_period_end);
            const totalSubs = subscriptions.length;
            const cancelRate = totalSubs > 0 ? ((canceledSubs.length / totalSubs) * 100).toFixed(1) : '0';
            
            const totalMRR = activeSubs.reduce((sum, s) => {
              const plan = PLAN_PRICES[s.price_id];
              return sum + (plan?.price || 0);
            }, 0);

            const planBreakdown = Object.entries(PLAN_PRICES).map(([priceId, { name, price }]) => {
              const count = activeSubs.filter(s => s.price_id === priceId).length;
              return { name, count, revenue: count * price };
            });

            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <Card variant="glass">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/20">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{profiles.length}</p>
                          <p className="text-sm text-muted-foreground">Total Users</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card variant="glass">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-green-500/20">
                          <DollarSign className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">${totalMRR.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card variant="glass">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-blue-500/20">
                          <CreditCard className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{activeSubs.length}</p>
                          <p className="text-sm text-muted-foreground">Active Subs{cancelingSubs.length > 0 ? ` (${cancelingSubs.length} canceling)` : ''}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card variant="glass">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-red-500/20">
                          <TrendingUp className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{cancelRate}%</p>
                          <p className="text-sm text-muted-foreground">Cancel Rate ({canceledSubs.length}/{totalSubs})</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Per-Plan Revenue */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {planBreakdown.map(plan => (
                    <Card variant="glass" key={plan.name}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-accent/20">
                            <BarChart3 className="h-6 w-6 text-accent-foreground" />
                          </div>
                          <div>
                            <p className="text-lg font-bold">${plan.revenue.toFixed(2)}/mo</p>
                            <p className="text-sm text-muted-foreground">{plan.name} — {plan.count} subscriber{plan.count !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            );
          })()}

          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="codes">Access Codes</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <Card variant="glass">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>All Users</CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Access Type</TableHead>
                            <TableHead>Promo Code</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProfiles.map((profile) => (
                            <TableRow key={profile.id}>
                              <TableCell className="font-medium">{profile.email || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={profile.subscription_status === 'active' || profile.subscription_status === 'canceling' ? 'default' : 'secondary'}
                                  className={profile.subscription_status === 'active' 
                                    ? 'bg-green-500/20 text-green-500 border-green-500/30' 
                                    : profile.subscription_status === 'canceling'
                                    ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                                    : ''
                                  }
                                >
                                  {profile.subscription_status || 'inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell>{profile.access_type || '-'}</TableCell>
                              <TableCell>
                                {profile.promo_used ? (
                                  <Badge variant="outline">{profile.promo_used}</Badge>
                                ) : '-'}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDate(profile.created_at)}
                              </TableCell>
                              <TableCell>
                                {profile.subscription_status === 'active' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleCancelSubscription(profile.user_id, profile.email)}
                                    disabled={cancelingUserId === profile.user_id}
                                  >
                                    {cancelingUserId === profile.user_id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <XCircle className="h-4 w-4 mr-1" />
                                    )}
                                    Cancel
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredProfiles.length === 0 && (
                            <TableRow>
                               <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                No users found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="codes" className="space-y-4">
              {/* Create New Code */}
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create Access Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateCode} className="flex gap-4">
                    <Input
                      placeholder="Code (e.g., WELCOME2024)"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      className="flex-1 uppercase"
                    />
                    <Input
                      placeholder="Max uses (empty = unlimited)"
                      type="number"
                      value={newCodeMaxUses}
                      onChange={(e) => setNewCodeMaxUses(e.target.value)}
                      className="w-48"
                    />
                    <Button type="submit" disabled={isCreatingCode || !newCode.trim()}>
                      {isCreatingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Existing Codes */}
              <Card variant="glass">
                <CardHeader>
                  <CardTitle>All Access Codes</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Uses</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accessCodes.map((code) => (
                            <TableRow key={code.id}>
                              <TableCell className="font-mono font-medium">{code.code}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={code.is_active ? 'default' : 'secondary'}
                                  className={code.is_active 
                                    ? 'bg-green-500/20 text-green-500 border-green-500/30' 
                                    : ''
                                  }
                                >
                                  {code.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {code.current_uses} / {code.max_uses || '∞'}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDate(code.created_at)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleCodeStatus(code.id, code.is_active)}
                                >
                                  {code.is_active ? 'Deactivate' : 'Activate'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {accessCodes.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                No access codes found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
