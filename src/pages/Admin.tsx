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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Users, CreditCard, Ticket, Plus, Shield, RefreshCw, Search, XCircle, DollarSign, TrendingUp, BarChart3, Undo2, CalendarClock, ChevronDown, ChevronRight, ShieldOff } from 'lucide-react';
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
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  price_id: string | null;
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

interface AdminStats {
  totalUsers: number;
  mrr: number;
  projectedMrr: number;
  totalActive: number;
  scheduledCancels: number;
  cancelRate: string;
  newSubsSinceMarch4: number;
  plans: { name: string; count: number; revenue: number; scheduledCancels: number; cancelRate: string }[];
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const [newCode, setNewCode] = useState('');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState('');
  const [isCreatingCode, setIsCreatingCode] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user) checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) fetchAllData();
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
      setIsAdmin(!error && !!data);
    } catch {
      setIsAdmin(false);
    } finally {
      setIsCheckingAdmin(false);
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    setStatsError(null);
    try {
      const [profilesRes, codesRes, rolesRes, statsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('access_codes').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('*').order('created_at', { ascending: false }),
        supabase.functions.invoke('admin-stats'),
      ]);

      if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
      if (codesRes.data) setAccessCodes(codesRes.data);
      if (rolesRes.data) setUserRoles(rolesRes.data as UserRole[]);

      if (statsRes.error) {
        setStats(null);
        setStatsError(statsRes.error.message || 'Could not load revenue stats');
      } else if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setStatsError('Failed to load revenue stats');
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
      if (error) { toast.error('Failed to create access code'); return; }
      toast.success('Access code created!');
      setNewCode('');
      setNewCodeMaxUses('');
      fetchAllData();
    } catch { toast.error('Something went wrong'); }
    finally { setIsCreatingCode(false); }
  };

  const toggleCodeStatus = async (codeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('access_codes').update({ is_active: !currentStatus }).eq('id', codeId);
      if (error) { toast.error('Failed to update code'); return; }
      toast.success(`Code ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchAllData();
    } catch { toast.error('Something went wrong'); }
  };

  const handleCancelSubscription = async (userId: string, email: string | null, customerId?: string | null) => {
    if (!confirm(`Schedule cancellation for ${email || userId}? They'll keep access until period end.`)) return;
    setActionUserId(userId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-cancel-subscription', {
        body: { target_user_id: userId, customer_id: customerId || undefined },
      });

      // supabase.functions.invoke puts non-2xx body into error or data depending on version
      // Try to extract useful info from either
      const result = data || (error as any);

      // Parse error if it's a string (edge function non-2xx response)
      let parsed = result;
      if (typeof result === 'string') {
        try { parsed = JSON.parse(result); } catch { parsed = null; }
      }
      if (error && typeof (error as any)?.context?.body === 'string') {
        try { parsed = JSON.parse((error as any).context.body); } catch {}
      }

      // Handle no-link / not-found cases
      if (parsed?.success === false || (error && !parsed?.success)) {
        const msg = parsed?.error || 'No Stripe subscription linked. Use Revoke to remove access manually.';
        toast.error(msg);
        if (parsed?.stripe_customer_id) {
          setProfiles(prev => prev.map(p => p.user_id === userId ? {
            ...p, stripe_customer_id: parsed.stripe_customer_id,
          } : p));
        }
        return;
      }

      if (error && !parsed) { toast.error('Failed to cancel subscription'); return; }

      setProfiles(prev => prev.map(p => p.user_id === userId ? {
        ...p,
        cancel_at_period_end: true,
        current_period_end: parsed?.current_period_end || p.current_period_end,
        subscription_status: parsed?.subscription_status || p.subscription_status,
        stripe_subscription_id: parsed?.stripe_subscription_id || p.stripe_subscription_id,
        stripe_customer_id: parsed?.stripe_customer_id || p.stripe_customer_id,
      } : p));

      toast.success(parsed?.message || 'Subscription scheduled for cancellation');
    } catch { toast.error('Something went wrong'); }
    finally { setActionUserId(null); }
  };

  const handleUndoCancel = async (userId: string, email: string | null) => {
    if (!confirm(`Undo cancellation for ${email || userId}?`)) return;
    setActionUserId(userId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-undo-cancel-subscription', {
        body: { target_user_id: userId },
      });
      if (error) { toast.error('Failed to undo cancellation'); return; }

      setProfiles(prev => prev.map(p => p.user_id === userId ? {
        ...p,
        cancel_at_period_end: false,
        current_period_end: data?.current_period_end || p.current_period_end,
        subscription_status: data?.subscription_status || p.subscription_status,
      } : p));

      toast.success(data?.message || 'Cancellation undone');
    } catch { toast.error('Something went wrong'); }
    finally { setActionUserId(null); }
  };

  const handleRevokeAccess = async (userId: string, email: string | null) => {
    if (!confirm(`Manually revoke access for ${email || userId}? This user has no linked Stripe subscription.`)) return;
    setActionUserId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          has_access: false,
          subscription_status: 'canceled',
          access_type: null,
          cancel_at_period_end: false,
        })
        .eq('user_id', userId);

      if (error) { toast.error('Failed to revoke access'); return; }

      setProfiles(prev => prev.map(p => p.user_id === userId ? {
        ...p,
        has_access: false,
        subscription_status: 'canceled',
        access_type: null,
        cancel_at_period_end: false,
      } : p));

      toast.success('Access revoked');
    } catch { toast.error('Something went wrong'); }
    finally { setActionUserId(null); }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredProfiles = profiles.filter(profile => 
    profile.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.promo_used?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string, includeTime = false) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    if (includeTime) {
      options.hour = 'numeric';
      options.minute = '2-digit';
      options.hour12 = true;
    }
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const hasStripeLink = (profile: Profile) => !!profile.stripe_subscription_id;

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
              <CardDescription>You don't have permission to view this page.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>Go Home</Button>
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

          {statsError && (
            <Card variant="glass" className="mb-4 border-destructive/40">
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">Stats error: {statsError}</p>
              </CardContent>
            </Card>
          )}

          {stats && (
            <>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                <Card variant="glass">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/20">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.totalUsers}</p>
                        <p className="text-sm text-muted-foreground">Total Users</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card variant="glass">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/20">
                        <DollarSign className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">${stats.mrr.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Current MRR</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card variant="glass">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-accent/20">
                        <TrendingUp className="h-6 w-6 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">${stats.projectedMrr.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Projected MRR</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card variant="glass">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/20">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.totalActive}</p>
                        <p className="text-sm text-muted-foreground">Active Subs ({stats.scheduledCancels} canceling)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card variant="glass">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/20">
                        <TrendingUp className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.newSubsSinceMarch4}</p>
                        <p className="text-sm text-muted-foreground">New Subs (Mar 4+)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card variant="glass">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-destructive/20">
                        <CalendarClock className="h-6 w-6 text-destructive" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.cancelRate}%</p>
                        <p className="text-sm text-muted-foreground">Cancel Rate ({stats.scheduledCancels}/{stats.totalActive})</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {stats.plans.map(plan => {
                  const planKey = plan.name.toLowerCase();
                  const planEmails = profiles
                    .filter(p => p.access_type === planKey && p.has_access && p.subscription_status === 'active')
                    .map(p => p.email || 'No email')
                    .sort();
                  const isExpanded = expandedRows.has(`plan-${planKey}`);
                  return (
                    <Card
                      variant="glass"
                      key={plan.name}
                      className="cursor-pointer transition-all hover:ring-1 hover:ring-primary/30"
                      onClick={() => {
                        const newExpanded = new Set(expandedRows);
                        if (isExpanded) newExpanded.delete(`plan-${planKey}`);
                        else newExpanded.add(`plan-${planKey}`);
                        setExpandedRows(newExpanded);
                      }}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-accent/20">
                            <BarChart3 className="h-6 w-6 text-accent-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="text-lg font-bold">${plan.revenue.toFixed(2)}/mo</p>
                            <p className="text-sm text-muted-foreground">{plan.name} — {plan.count} subscriber{plan.count !== 1 ? 's' : ''}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {plan.scheduledCancels} scheduled cancel{plan.scheduledCancels !== 1 ? 's' : ''} ({plan.cancelRate}%)
                            </p>
                          </div>
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        {isExpanded && (
                          <div className="mt-4 pt-3 border-t border-border space-y-1 max-h-48 overflow-y-auto">
                            {planEmails.length > 0 ? planEmails.map((email, i) => (
                              <p key={i} className="text-xs text-muted-foreground font-mono">{email}</p>
                            )) : (
                              <p className="text-xs text-muted-foreground italic">No users on this plan</p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="free">Free Users</TabsTrigger>
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
                            <TableHead className="w-8"></TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Customer ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Access Type</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProfiles.map((profile) => {
                            const isExpanded = expandedRows.has(profile.id);
                            const isActive = profile.subscription_status === 'active';
                            const canCancel = isActive && !profile.cancel_at_period_end;
                            const canUndo = isActive && profile.cancel_at_period_end;
                            const noStripeLink = !hasStripeLink(profile);
                            const hasAccess = profile.has_access || isActive;

                            return (
                              <>
                                <TableRow key={profile.id}>
                                  <TableCell className="w-8 px-2">
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleRow(profile.id)}>
                                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </Button>
                                  </TableCell>
                                  <TableCell className="font-medium">{profile.email || 'N/A'}</TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {profile.stripe_customer_id || <span className="text-muted-foreground italic">—</span>}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-1">
                                      <Badge 
                                        variant={isActive ? 'default' : 'secondary'}
                                        className={isActive 
                                          ? 'bg-green-500/20 text-green-500 border-green-500/30' 
                                          : profile.subscription_status === 'canceled'
                                          ? 'bg-red-500/20 text-red-500 border-red-500/30'
                                          : ''
                                        }
                                      >
                                        {profile.subscription_status || 'inactive'}
                                      </Badge>
                                      {profile.cancel_at_period_end && profile.current_period_end && (
                                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30 text-xs">
                                          Cancels {formatDate(profile.current_period_end)}
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>{profile.access_type || '-'}</TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {formatDate(profile.created_at, true)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      {canCancel && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-destructive hover:text-destructive"
                                          onClick={() => handleCancelSubscription(profile.user_id, profile.email, profile.stripe_customer_id)}
                                          disabled={actionUserId === profile.user_id}
                                        >
                                          {actionUserId === profile.user_id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <XCircle className="h-4 w-4 mr-1" />
                                          )}
                                          Cancel
                                        </Button>
                                      )}
                                      {canUndo && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-primary hover:text-primary"
                                          onClick={() => handleUndoCancel(profile.user_id, profile.email)}
                                          disabled={actionUserId === profile.user_id}
                                        >
                                          {actionUserId === profile.user_id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Undo2 className="h-4 w-4 mr-1" />
                                          )}
                                          Undo
                                        </Button>
                                      )}
                                      {hasAccess && noStripeLink && !isActive && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-destructive hover:text-destructive"
                                          onClick={() => handleRevokeAccess(profile.user_id, profile.email)}
                                          disabled={actionUserId === profile.user_id}
                                        >
                                          {actionUserId === profile.user_id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <ShieldOff className="h-4 w-4 mr-1" />
                                          )}
                                          Revoke
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                                {isExpanded && (
                                  <TableRow key={`${profile.id}-debug`}>
                                    <TableCell colSpan={7} className="bg-muted/30 px-8 py-3">
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                        <div>
                                          <p className="text-muted-foreground font-medium">Stripe Customer ID</p>
                                          <p className="font-mono">{profile.stripe_customer_id || <span className="text-muted-foreground italic">Not linked</span>}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground font-medium">Stripe Subscription ID</p>
                                          <p className="font-mono">{profile.stripe_subscription_id || <span className="text-muted-foreground italic">Not linked</span>}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground font-medium">Cancel At Period End</p>
                                          <p>{profile.cancel_at_period_end ? 'Yes' : 'No'}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground font-medium">Current Period End</p>
                                          <p>{profile.current_period_end ? formatDate(profile.current_period_end) : <span className="text-muted-foreground italic">N/A</span>}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground font-medium">Price ID</p>
                                          <p className="font-mono">{profile.price_id || <span className="text-muted-foreground italic">N/A</span>}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground font-medium">Has Access</p>
                                          <p>{profile.has_access ? 'Yes' : 'No'}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground font-medium">User ID</p>
                                          <p className="font-mono truncate">{profile.user_id}</p>
                                        </div>
                                        {noStripeLink && hasAccess && (
                                          <div className="col-span-full">
                                            <p className="text-yellow-500 font-medium">⚠ This user has no Stripe subscription linked.</p>
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </>
                            );
                          })}
                          {filteredProfiles.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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

            <TabsContent value="free" className="space-y-4">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Signed Up But Never Paid</CardTitle>
                  <CardDescription>Users who created an account but have no active subscription or promo access.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (() => {
                    const freeUsers = profiles.filter(p =>
                      !p.has_access &&
                      (!p.subscription_status || p.subscription_status === 'inactive') &&
                      !p.promo_used &&
                      !p.stripe_customer_id
                    );
                    return (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Email</TableHead>
                              <TableHead>Signed Up</TableHead>
                              <TableHead>User ID</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {freeUsers.map((profile) => (
                              <TableRow key={profile.id}>
                                <TableCell className="font-medium">{profile.email || 'N/A'}</TableCell>
                                <TableCell className="text-muted-foreground">{formatDate(profile.created_at, true)}</TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">{profile.user_id}</TableCell>
                              </TableRow>
                            ))}
                            {freeUsers.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                  All users have subscriptions or promo access
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                        <div className="px-4 py-2 border-t text-sm text-muted-foreground">
                          {freeUsers.length} free user{freeUsers.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="codes" className="space-y-4">
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
                                  className={code.is_active ? 'bg-green-500/20 text-green-500 border-green-500/30' : ''}
                                >
                                  {code.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell>{code.current_uses} / {code.max_uses || '∞'}</TableCell>
                              <TableCell className="text-muted-foreground">{formatDate(code.created_at)}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => toggleCodeStatus(code.id, code.is_active)}>
                                  {code.is_active ? 'Deactivate' : 'Activate'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {accessCodes.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No access codes found</TableCell>
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
