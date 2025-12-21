import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Shield, Ban, AlertTriangle, Trash2, Search, Filter, Globe,
  User, Mail, Clock, MapPin, Activity, Eye, Lock, Unlock, XCircle
} from "lucide-react";

// TypeScript Interfaces
interface BlacklistEntry {
  id: string;
  type: "ip" | "email" | "username" | "email_range";
  value: string;
  reason: string;
  bannedBy: string;
  bannedAt: string;
  expiresAt?: string;
  isPermanent: boolean;
  isActive: boolean;
  notes?: string;
  platform: string;
}

interface IPLog {
  id: string;
  ip: string;
  userId?: string;
  username?: string;
  action: string;
  endpoint: string;
  userAgent: string;
  country?: string;
  city?: string;
  timestamp: string;
  isBlocked: boolean;
  requestCount: number;
}

interface UserActivity {
  id: string;
  userId: string;
  username: string;
  email: string;
  ip: string;
  action: string;
  details: string;
  timestamp: string;
  sessionId: string;
  platform: string;
}

interface LoginHistory {
  id: string;
  userId: string;
  username: string;
  email: string;
  ip: string;
  country?: string;
  city?: string;
  device: string;
  browser: string;
  loginTime: string;
  logoutTime?: string;
  sessionDuration?: number;
  isSuccessful: boolean;
  failureReason?: string;
  platform: string;
}

export default function BlacklistManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BlacklistEntry | null>(null);

  // Form state for adding new blacklist entry
  const [newEntry, setNewEntry] = useState({
    type: "ip" as "ip" | "email" | "username" | "email_range",
    value: "",
    reason: "",
    isPermanent: true,
    expiresAt: "",
    notes: "",
  });

  // Fetch blacklist entries
  const { data: blacklistEntries = [], isLoading: isLoadingBlacklist } = useQuery<BlacklistEntry[]>({
    queryKey: ["/api/blacklist"],
  });

  // Fetch IP logs
  const { data: ipLogs = [], isLoading: isLoadingIPLogs } = useQuery<IPLog[]>({
    queryKey: ["/api/ip-logs"],
  });

  // Fetch user activity
  const { data: userActivity = [], isLoading: isLoadingActivity } = useQuery<UserActivity[]>({
    queryKey: ["/api/user-activity"],
  });

  // Fetch login history
  const { data: loginHistory = [], isLoading: isLoadingLogins } = useQuery<LoginHistory[]>({
    queryKey: ["/api/login-history"],
  });

  // Add blacklist entry mutation
  const addBlacklistMutation = useMutation({
    mutationFn: async (data: typeof newEntry) => {
      return apiRequest("/api/blacklist", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blacklist"] });
      toast({
        title: "Entry Added",
        description: "Blacklist entry has been added successfully",
      });
      setIsAddDialogOpen(false);
      setNewEntry({
        type: "ip",
        value: "",
        reason: "",
        isPermanent: true,
        expiresAt: "",
        notes: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add blacklist entry",
        variant: "destructive",
      });
    },
  });

  // Remove blacklist entry mutation
  const removeBlacklistMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/blacklist/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blacklist"] });
      toast({
        title: "Entry Removed",
        description: "Blacklist entry has been removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove blacklist entry",
        variant: "destructive",
      });
    },
  });

  // Block IP mutation
  const blockIPMutation = useMutation({
    mutationFn: async (ip: string) => {
      return apiRequest("/api/blacklist", "POST", {
        type: "ip",
        value: ip,
        reason: "Blocked from IP logs",
        isPermanent: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blacklist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ip-logs"] });
      toast({
        title: "IP Blocked",
        description: "IP address has been blocked successfully",
      });
    },
  });

  // Statistics
  const stats = {
    totalBlocked: blacklistEntries.length,
    blockedIPs: blacklistEntries.filter(e => e.type === "ip").length,
    blockedEmails: blacklistEntries.filter(e => e.type === "email").length,
    blockedUsers: blacklistEntries.filter(e => e.type === "username").length,
    uniqueIPs: new Set(ipLogs.map(log => log.ip)).size,
    totalRequests: ipLogs.reduce((sum, log) => sum + log.requestCount, 0),
    blockedAttempts: ipLogs.filter(log => log.isBlocked).length,
    recentLogins: loginHistory.filter(l => l.isSuccessful).length,
  };

  // Filtered blacklist entries
  const filteredEntries = blacklistEntries.filter(entry => {
    const matchesSearch = entry.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || entry.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen cyber-bg p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold cyber-text-glow flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-500" />
              Blacklist & IP Tracking Management
            </h1>
            <p className="text-gray-400 mt-2">
              Ban users, block IPs, track activity, and monitor login sessions
            </p>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-red-500 hover:bg-red-600"
          >
            <Ban className="w-4 h-4 mr-2" />
            Add Ban
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="cyber-card border-red-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Blocked</p>
                  <p className="text-2xl font-bold text-red-400">{stats.totalBlocked}</p>
                </div>
                <Ban className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-card border-orange-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Blocked IPs</p>
                  <p className="text-2xl font-bold text-orange-400">{stats.blockedIPs}</p>
                </div>
                <Globe className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-card border-yellow-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Unique IPs</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.uniqueIPs}</p>
                </div>
                <MapPin className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-card border-green-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Recent Logins</p>
                  <p className="text-2xl font-bold text-green-400">{stats.recentLogins}</p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="blacklist" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="blacklist">
              <Ban className="w-4 h-4 mr-2" />
              Blacklist
            </TabsTrigger>
            <TabsTrigger value="ip-logs">
              <Globe className="w-4 h-4 mr-2" />
              IP Logs
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="w-4 h-4 mr-2" />
              User Activity
            </TabsTrigger>
            <TabsTrigger value="logins">
              <Clock className="w-4 h-4 mr-2" />
              Login History
            </TabsTrigger>
          </TabsList>

          {/* Blacklist Tab */}
          <TabsContent value="blacklist" className="space-y-4">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ban className="w-5 h-5 text-red-500" />
                  Banned IPs, Emails & Usernames
                </CardTitle>
                <CardDescription>
                  Manage blocked IP addresses, email addresses, email ranges, and usernames
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filter */}
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by IP, email, username, or reason..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 cyber-input"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48 cyber-input">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="ip">IP Address</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="email_range">Email Range</SelectItem>
                      <SelectItem value="username">Username</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Blacklist Table */}
                <div className="border border-cyan-500/30 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-cyan-500/10">
                        <TableHead>ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Banned At</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                            {searchQuery || filterType !== "all"
                              ? "No matching entries found"
                              : "No blacklist entries yet"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEntries.map((entry) => (
                          <TableRow key={entry.id} className="hover:bg-cyan-500/5">
                            <TableCell className="font-mono text-xs">{entry.id.slice(0, 8)}</TableCell>
                            <TableCell>
                              <Badge variant={
                                entry.type === "ip" ? "destructive" :
                                entry.type === "email" ? "secondary" :
                                entry.type === "username" ? "outline" : "default"
                              }>
                                {entry.type === "ip" && <Globe className="w-3 h-3 mr-1" />}
                                {entry.type === "email" && <Mail className="w-3 h-3 mr-1" />}
                                {entry.type === "username" && <User className="w-3 h-3 mr-1" />}
                                {entry.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">{entry.value}</TableCell>
                            <TableCell className="max-w-xs truncate">{entry.reason}</TableCell>
                            <TableCell className="text-sm text-gray-400">
                              {new Date(entry.bannedAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {entry.isPermanent ? (
                                <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                  <Lock className="w-3 h-3" />
                                  Permanent
                                </Badge>
                              ) : (
                                <span className="text-sm text-gray-400">
                                  {entry.expiresAt ? new Date(entry.expiresAt).toLocaleDateString() : "N/A"}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {entry.platform}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeBlacklistMutation.mutate(entry.id)}
                                disabled={removeBlacklistMutation.isPending}
                                className="text-red-500 hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="text-sm text-gray-400 text-center">
                  Showing {filteredEntries.length} out of {blacklistEntries.length} entries
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* IP Logs Tab */}
          <TabsContent value="ip-logs" className="space-y-4">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-500" />
                  IP Address Tracking & Logs
                </CardTitle>
                <CardDescription>
                  Monitor all IP addresses accessing the platform with geolocation and activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border border-cyan-500/30 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-cyan-500/10">
                        <TableHead>IP Address</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>User Agent</TableHead>
                        <TableHead>Requests</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ipLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                            No IP logs available
                          </TableCell>
                        </TableRow>
                      ) : (
                        ipLogs.slice(0, 50).map((log) => (
                          <TableRow key={log.id} className={log.isBlocked ? "bg-red-500/10" : "hover:bg-cyan-500/5"}>
                            <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                            <TableCell>{log.username || "Anonymous"}</TableCell>
                            <TableCell className="text-sm text-gray-400">
                              {log.country && log.city ? `${log.city}, ${log.country}` : "Unknown"}
                            </TableCell>
                            <TableCell className="text-sm">{log.action}</TableCell>
                            <TableCell className="text-xs text-gray-400 max-w-xs truncate">
                              {log.userAgent}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.requestCount}</Badge>
                            </TableCell>
                            <TableCell>
                              {log.isBlocked ? (
                                <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                  <XCircle className="w-3 h-3" />
                                  Blocked
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                  <Unlock className="w-3 h-3" />
                                  Active
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {!log.isBlocked && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => blockIPMutation.mutate(log.ip)}
                                  disabled={blockIPMutation.isPending}
                                  className="text-red-500 hover:text-red-400"
                                >
                                  <Ban className="w-4 h-4 mr-1" />
                                  Block
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-500" />
                  User Activity Monitoring
                </CardTitle>
                <CardDescription>
                  Real-time tracking of all user actions during their session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border border-cyan-500/30 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-cyan-500/10">
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Session</TableHead>
                        <TableHead>Platform</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userActivity.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                            No user activity logs available
                          </TableCell>
                        </TableRow>
                      ) : (
                        userActivity.slice(0, 50).map((activity) => (
                          <TableRow key={activity.id} className="hover:bg-cyan-500/5">
                            <TableCell className="text-sm text-gray-400">
                              {new Date(activity.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-cyan-400" />
                                <div>
                                  <div className="font-medium">{activity.username}</div>
                                  <div className="text-xs text-gray-400">{activity.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{activity.ip}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{activity.action}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-400 max-w-xs truncate">
                              {activity.details}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{activity.sessionId.slice(0, 8)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">{activity.platform}</Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Login History Tab */}
          <TabsContent value="logins" className="space-y-4">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-500" />
                  Login History & Sessions
                </CardTitle>
                <CardDescription>
                  Track all login attempts, successful sessions, and session durations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border border-cyan-500/30 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-cyan-500/10">
                        <TableHead>Login Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>IP & Location</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Platform</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loginHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                            No login history available
                          </TableCell>
                        </TableRow>
                      ) : (
                        loginHistory.slice(0, 50).map((login) => (
                          <TableRow
                            key={login.id}
                            className={!login.isSuccessful ? "bg-red-500/10" : "hover:bg-cyan-500/5"}
                          >
                            <TableCell className="text-sm">
                              {new Date(login.loginTime).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{login.username}</div>
                                <div className="text-xs text-gray-400">{login.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-mono text-xs">{login.ip}</div>
                                {login.country && login.city && (
                                  <div className="text-xs text-gray-400">{login.city}, {login.country}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div>{login.device}</div>
                              <div className="text-xs text-gray-400">{login.browser}</div>
                            </TableCell>
                            <TableCell>
                              {login.sessionDuration ? (
                                <Badge variant="outline">
                                  {Math.floor(login.sessionDuration / 60)}m
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-sm">Active</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {login.isSuccessful ? (
                                <Badge variant="secondary" className="flex items-center gap-1 w-fit bg-green-500/20 text-green-400">
                                  <Eye className="w-3 h-3" />
                                  Success
                                </Badge>
                              ) : (
                                <div>
                                  <Badge variant="destructive" className="flex items-center gap-1 w-fit mb-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Failed
                                  </Badge>
                                  {login.failureReason && (
                                    <div className="text-xs text-gray-400">{login.failureReason}</div>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{login.platform}</Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Blacklist Entry Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-500" />
                Add Blacklist Entry
              </DialogTitle>
              <DialogDescription>
                Ban an IP address, email, email range, or username
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newEntry.type}
                  onValueChange={(value: any) => setNewEntry({...newEntry, type: value})}
                >
                  <SelectTrigger className="cyber-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ip">IP Address</SelectItem>
                    <SelectItem value="email">Email Address</SelectItem>
                    <SelectItem value="email_range">Email Range (@domain.com)</SelectItem>
                    <SelectItem value="username">Username</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  placeholder={
                    newEntry.type === "ip" ? "192.168.1.1" :
                    newEntry.type === "email" ? "user@example.com" :
                    newEntry.type === "email_range" ? "@spammer.com" :
                    "username123"
                  }
                  value={newEntry.value}
                  onChange={(e) => setNewEntry({...newEntry, value: e.target.value})}
                  className="cyber-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Input
                  placeholder="Reason for ban (e.g., spam, abuse, fraud)"
                  value={newEntry.reason}
                  onChange={(e) => setNewEntry({...newEntry, reason: e.target.value})}
                  className="cyber-input"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="permanent"
                  checked={newEntry.isPermanent}
                  onChange={(e) => setNewEntry({...newEntry, isPermanent: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="permanent" className="cursor-pointer">
                  Permanent Ban
                </Label>
              </div>

              {!newEntry.isPermanent && (
                <div className="space-y-2">
                  <Label>Expires At</Label>
                  <Input
                    type="datetime-local"
                    value={newEntry.expiresAt}
                    onChange={(e) => setNewEntry({...newEntry, expiresAt: e.target.value})}
                    className="cyber-input"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Additional notes about this ban..."
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                  className="cyber-input"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => addBlacklistMutation.mutate(newEntry)}
                disabled={!newEntry.value || !newEntry.reason || addBlacklistMutation.isPending}
                className="bg-red-500 hover:bg-red-600"
              >
                <Ban className="w-4 h-4 mr-2" />
                Add Ban
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
