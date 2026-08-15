import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileWarning,
  AlertTriangle,
  Monitor,
  User,
  MessageSquare,
  Activity,
  ArrowLeft,
  Send,
  ChevronRight,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { 
  useIncident, 
  useUpdateIncidentStatus, 
  useAssignIncident, 
  useAddIncidentComment,
  useUsers,
  useAlerts 
} from '@/components/hooks/useApi';
import { SeverityBadge, StatusBadge, PriorityBadge } from '@/components/ui-custom/StatusBadge';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from '@/lib/AuthContext';

const TimelineItem = ({ event }) => (
  <div className="flex gap-3 pb-4 last:pb-0">
    <div className="flex flex-col items-center">
      <div className="w-2 h-2 bg-slate-300 rounded-full mt-2" />
      <div className="flex-1 w-px bg-slate-200 mt-2" />
    </div>
    <div className="flex-1 pb-4">
      <p className="text-sm font-medium text-slate-900">{event.action}</p>
      <p className="text-xs text-slate-500 mt-0.5">
        {event.actor} • {format(new Date(event.timestamp), 'MMM d, HH:mm')}
      </p>
      {event.details && (
        <p className="text-sm text-slate-600 mt-1">{event.details}</p>
      )}
    </div>
  </div>
);

const CommentItem = ({ comment }) => (
  <div className="flex gap-3 p-4 bg-slate-50 rounded-lg">
    <Avatar className="w-8 h-8">
      <AvatarFallback className="text-xs bg-slate-200">
        {comment.author?.charAt(0) || 'U'}
      </AvatarFallback>
    </Avatar>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-slate-900">{comment.author}</p>
        <span className="text-xs text-slate-500">
          {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
        </span>
      </div>
      <p className="text-sm text-slate-600 mt-1">{comment.content}</p>
    </div>
  </div>
);

export default function IncidentDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const incidentId = urlParams.get('id');

  const { user } = useAuth();
  const { data: incident, isLoading } = useIncident(incidentId);
  const { data: users } = useUsers();
  const { data: allAlerts } = useAlerts({});
  
  const updateStatusMutation = useUpdateIncidentStatus();
  const assignMutation = useAssignIncident();
  const addCommentMutation = useAddIncidentComment();

  const [activeTab, setActiveTab] = useState('overview');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [newComment, setNewComment] = useState('');

  const handleStatusChange = async (newStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: incidentId, status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAssign = async () => {
    const assignee = users?.find(u => u.email === selectedAssignee);
    try {
      await assignMutation.mutateAsync({
        id: incidentId,
        assigneeEmail: selectedAssignee,
        assigneeName: assignee?.fullName || selectedAssignee
      });
      toast.success('Incident assigned');
      setShowAssignDialog(false);
    } catch (error) {
      toast.error('Failed to assign incident');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      await addCommentMutation.mutateAsync({
        id: incidentId,
        content: newComment,
        author: user?.fullName || 'Unknown'
      });
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileWarning className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-medium text-slate-900">Incident not found</h2>
        <Link to={createPageUrl('Incidents')}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Incidents
          </Button>
        </Link>
      </div>
    );
  }

  const relatedAlerts = allAlerts?.filter(a => incident.alertIds?.includes(a.id)) || [];
  const isBreached = incident.slaBreached || (incident.slaDue && isPast(new Date(incident.slaDue)));

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'investigating', label: 'Investigating' },
    { value: 'contained', label: 'Contained' },
    { value: 'remediated', label: 'Remediated' },
    { value: 'closed', label: 'Closed' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link to={createPageUrl('Incidents')}>
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <PriorityBadge priority={incident.priority} />
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">{incident.title}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Created {format(new Date(incident.createdDate), 'MMM d, yyyy HH:mm')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={incident.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowAssignDialog(true)}>
            <User className="w-4 h-4 mr-2" />
            Assign
          </Button>
        </div>
      </div>

      {/* SLA Warning */}
      {isBreached && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="py-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-700 font-medium">
              SLA has been breached
            </span>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="alerts">Related Alerts ({relatedAlerts.length})</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="comments">Comments ({incident.comments?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              {incident.description && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">{incident.description}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <p className="text-2xl font-semibold text-slate-900">{relatedAlerts.length}</p>
                    <p className="text-xs text-slate-500">Alerts</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <p className="text-2xl font-semibold text-slate-900">{incident.deviceIds?.length || 0}</p>
                    <p className="text-xs text-slate-500">Devices</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <p className="text-2xl font-semibold text-slate-900">{incident.timeline?.length || 0}</p>
                    <p className="text-xs text-slate-500">Events</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <p className="text-2xl font-semibold text-slate-900">{incident.comments?.length || 0}</p>
                    <p className="text-xs text-slate-500">Comments</p>
                  </div>
                </CardContent>
              </Card>

              {incident.tags?.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {incident.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="alerts" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {relatedAlerts.length === 0 ? (
                    <div className="py-12 text-center">
                      <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No alerts linked to this incident</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {relatedAlerts.map(alert => (
                        <Link
                          key={alert.id}
                          to={createPageUrl(`AlertDetail?id=${alert.id}`)}
                          className="block p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <SeverityBadge severity={alert.severity} />
                                <StatusBadge status={alert.status} />
                              </div>
                              <p className="font-medium text-slate-900 mt-2">{alert.title}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {alert.deviceHostname} • {format(new Date(alert.createdDate), 'MMM d, HH:mm')}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {incident.timeline?.length === 0 ? (
                    <div className="py-12 text-center">
                      <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No timeline events yet</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {incident.timeline?.map(event => (
                        <TimelineItem key={event.id} event={event} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {/* Add comment */}
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-slate-200">
                        {user?.fullName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[60px]"
                      />
                      <Button 
                        size="icon" 
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || addCommentMutation.isPending}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Comments list */}
                  {incident.comments?.length === 0 ? (
                    <div className="py-8 text-center">
                      <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No comments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {incident.comments?.map(comment => (
                        <CommentItem key={comment.id} comment={comment} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-500">Assignee</p>
                {incident.assignedTo ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs bg-slate-200">
                        {incident.assignedToName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{incident.assignedToName}</span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 mt-1">Unassigned</p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500">SLA Due</p>
                <p className={cn(
                  "text-sm font-medium mt-1",
                  isBreached ? "text-red-600" : "text-slate-900"
                )}>
                  {incident.slaDue 
                    ? format(new Date(incident.slaDue), 'MMM d, yyyy HH:mm')
                    : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Last Updated</p>
                <p className="text-sm font-medium text-slate-900 mt-1">
                  {incident.updatedDate 
                    ? formatDistanceToNow(new Date(incident.updatedDate), { addSuffix: true })
                    : 'Never'}
                </p>
              </div>
            </CardContent>
          </Card>

          {incident.deviceIds?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Affected Devices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {incident.deviceIds.slice(0, 5).map(deviceId => (
                    <Link
                      key={deviceId}
                      to={createPageUrl(`DeviceDetail?id=${deviceId}`)}
                      className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Monitor className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-700 flex-1">{deviceId}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Link>
                  ))}
                  {incident.deviceIds.length > 5 && (
                    <p className="text-xs text-slate-500 text-center">
                      +{incident.deviceIds.length - 5} more devices
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Incident</DialogTitle>
            <DialogDescription>
              Select a team member to assign this incident to
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                {users?.map(u => (
                  <SelectItem key={u.email} value={u.email}>
                    {u.fullName} ({u.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={!selectedAssignee || assignMutation.isPending}
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}