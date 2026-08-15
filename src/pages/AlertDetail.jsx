import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  AlertTriangle,
  Monitor,
  FileCode,
  Network,
  Terminal,
  ExternalLink,
  Plus,
  Link as LinkIcon,
  CheckCircle,
  Clock,
  ArrowLeft,
  Shield,
  Copy
} from "lucide-react";
import { useAlert, useUpdateAlertStatus, useCreateIncidentFromAlert, useAddAlertToIncident, useIncidents } from '@/components/hooks/useApi';
import { SeverityBadge, StatusBadge } from '@/components/ui-custom/StatusBadge';
import { format } from 'date-fns';
import { toast } from "sonner";

const EvidenceItem = ({ label, value, copyable = false }) => {
  if (!value) return null;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success('Copied to clipboard');
  };
  
  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <code className="text-sm font-mono text-slate-800 bg-slate-50 px-2 py-1 rounded flex-1 break-all">
          {value}
        </code>
        {copyable && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
            <Copy className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default function AlertDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const alertId = urlParams.get('id');
  const initialAction = urlParams.get('action');
  const navigate = useNavigate();

  const { data: alert, isLoading } = useAlert(alertId);
  const { data: incidents } = useIncidents({});
  const updateStatusMutation = useUpdateAlertStatus();
  const createIncidentMutation = useCreateIncidentFromAlert();
  const addToIncidentMutation = useAddAlertToIncident();

  const [activeTab, setActiveTab] = useState('evidence');
  const [showCreateIncident, setShowCreateIncident] = useState(initialAction === 'create-incident');
  const [showAddToIncident, setShowAddToIncident] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    title: '',
    description: '',
    severity: 'medium',
    priority: 'p3'
  });
  const [selectedIncidentId, setSelectedIncidentId] = useState('');

  React.useEffect(() => {
    if (alert && !incidentForm.title) {
      setIncidentForm(prev => ({
        ...prev,
        title: `Incident: ${alert.title}`,
        description: alert.description || '',
        severity: alert.severity === 'informational' ? 'low' : alert.severity
      }));
    }
  }, [alert]);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: alertId, status: newStatus });
      toast.success(`Alert status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update alert status');
    }
  };

  const handleCreateIncident = async () => {
    try {
      const incident = await createIncidentMutation.mutateAsync({
        alertId,
        incidentData: incidentForm
      });
      toast.success('Incident created successfully');
      setShowCreateIncident(false);
      navigate(createPageUrl(`IncidentDetail?id=${incident.id}`));
    } catch (error) {
      toast.error('Failed to create incident');
    }
  };

  const handleAddToIncident = async () => {
    try {
      await addToIncidentMutation.mutateAsync({
        alertId,
        incidentId: selectedIncidentId
      });
      toast.success('Alert added to incident');
      setShowAddToIncident(false);
    } catch (error) {
      toast.error('Failed to add alert to incident');
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

  if (!alert) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-medium text-slate-900">Alert not found</h2>
        <Link to={createPageUrl('Alerts')}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Alerts
          </Button>
        </Link>
      </div>
    );
  }

  const openIncidents = incidents?.filter(i => i.status !== 'closed') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link to={createPageUrl('Alerts')}>
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <SeverityBadge severity={alert.severity} />
              <StatusBadge status={alert.status} />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">{alert.title}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {format(new Date(alert.createdDate), 'MMM d, yyyy HH:mm:ss')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {alert.status === 'new' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleStatusChange('in_progress')}
            >
              <Clock className="w-4 h-4 mr-2" />
              Mark In Progress
            </Button>
          )}
          {alert.status !== 'resolved' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleStatusChange('resolved')}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Resolve
            </Button>
          )}
          {!alert.incidentId && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddToIncident(true)}
                disabled={openIncidents.length === 0}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Add to Incident
              </Button>
              <Button 
                size="sm"
                onClick={() => setShowCreateIncident(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Incident
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Linked Incident Banner */}
      {alert.incidentId && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                This alert is linked to an incident
              </span>
            </div>
            <Link to={createPageUrl(`IncidentDetail?id=${alert.incidentId}`)}>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                View Incident
                <ExternalLink className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="mitre">MITRE ATT&CK</TabsTrigger>
            </TabsList>

            <TabsContent value="evidence" className="mt-4 space-y-4">
              {/* Process Evidence */}
              {(alert.evidence?.processName || alert.evidence?.commandLine) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      Process Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EvidenceItem label="Process Name" value={alert.evidence?.processName} />
                    <EvidenceItem label="Process ID" value={alert.evidence?.processId?.toString()} />
                    <EvidenceItem label="Parent Process" value={alert.evidence?.parentProcess} />
                    <EvidenceItem label="Command Line" value={alert.evidence?.commandLine} copyable />
                  </CardContent>
                </Card>
              )}

              {/* File Evidence */}
              {(alert.evidence?.filePath || alert.evidence?.fileHash) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileCode className="w-4 h-4" />
                      File Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EvidenceItem label="File Path" value={alert.evidence?.filePath} copyable />
                    <EvidenceItem label="File Hash (SHA256)" value={alert.evidence?.fileHash} copyable />
                  </CardContent>
                </Card>
              )}

              {/* Network Evidence */}
              {(alert.evidence?.networkDestination || alert.evidence?.networkPort) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Network className="w-4 h-4" />
                      Network Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EvidenceItem label="Destination IP" value={alert.evidence?.networkDestination} copyable />
                    <EvidenceItem label="Port" value={alert.evidence?.networkPort?.toString()} />
                  </CardContent>
                </Card>
              )}

              {/* Description */}
              {alert.description && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">{alert.description}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="mitre" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {alert.mitreTactic ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-5 h-5 text-slate-600" />
                          <span className="font-medium text-slate-900">Tactic</span>
                        </div>
                        <p className="text-slate-700">{alert.mitreTactic}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-slate-900">Technique</span>
                        </div>
                        <p className="text-slate-700">
                          {alert.mitreTechnique} - {alert.mitreTechniqueName}
                        </p>
                      </div>
                      <a
                        href={`https://attack.mitre.org/techniques/${alert.mitreTechnique?.replace('.', '/')}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        View on MITRE ATT&CK
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No MITRE ATT&CK mapping available</p>
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
              <CardTitle className="text-base">Alert Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-500">Detection Source</p>
                <p className="text-sm font-medium text-slate-900 capitalize">
                  {alert.detectionSource?.replace(/_/g, ' ') || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">User</p>
                <p className="text-sm font-medium text-slate-900">
                  {alert.userName || 'N/A'}
                </p>
              </div>
              {alert.assignedTo && (
                <div>
                  <p className="text-xs text-slate-500">Assigned To</p>
                  <p className="text-sm font-medium text-slate-900">{alert.assignedTo}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {alert.deviceId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Affected Device</CardTitle>
              </CardHeader>
              <CardContent>
                <Link 
                  to={createPageUrl(`DeviceDetail?id=${alert.deviceId}`)}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                    <Monitor className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{alert.deviceHostname}</p>
                    <p className="text-xs text-slate-500">View device details</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Incident Dialog */}
      <Dialog open={showCreateIncident} onOpenChange={setShowCreateIncident}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Incident</DialogTitle>
            <DialogDescription>
              Create a new incident from this alert
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Title</label>
              <Input
                value={incidentForm.title}
                onChange={(e) => setIncidentForm(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Description</label>
              <Textarea
                value={incidentForm.description}
                onChange={(e) => setIncidentForm(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Severity</label>
                <Select
                  value={incidentForm.severity}
                  onValueChange={(value) => setIncidentForm(prev => ({ ...prev, severity: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Priority</label>
                <Select
                  value={incidentForm.priority}
                  onValueChange={(value) => setIncidentForm(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="p1">P1 - Critical</SelectItem>
                    <SelectItem value="p2">P2 - High</SelectItem>
                    <SelectItem value="p3">P3 - Medium</SelectItem>
                    <SelectItem value="p4">P4 - Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateIncident(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateIncident}
              disabled={createIncidentMutation.isPending}
            >
              {createIncidentMutation.isPending ? 'Creating...' : 'Create Incident'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Incident Dialog */}
      <Dialog open={showAddToIncident} onOpenChange={setShowAddToIncident}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Incident</DialogTitle>
            <DialogDescription>
              Link this alert to an existing incident
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedIncidentId} onValueChange={setSelectedIncidentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an incident" />
              </SelectTrigger>
              <SelectContent>
                {openIncidents.map((incident) => (
                  <SelectItem key={incident.id} value={incident.id}>
                    {incident.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddToIncident(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddToIncident}
              disabled={!selectedIncidentId || addToIncidentMutation.isPending}
            >
              {addToIncidentMutation.isPending ? 'Adding...' : 'Add to Incident'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}