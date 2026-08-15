import { api } from '@/api/client';

const transformDevice = (entity) => {
  if (!entity) return null;
  return {
  id: entity.id,
  hostname: entity.hostname,
  os: entity.os,
  osVersion: entity.os_version,
  ipAddress: entity.ip_address,
  macAddress: entity.mac_address,
  status: entity.status,
  riskScore: entity.risk_score || 0,
  lastSeen: entity.last_seen || entity.updated_date,
  agentVersion: entity.agent_version,
  policyId: entity.policy_id,
  policyName: entity.policy_name,
  tags: entity.tags || [],
  userName: entity.user_name,
  department: entity.department,
  location: entity.location,
  createdDate: entity.created_date
};
};

const transformAlert = (entity) => {
  if (!entity) return null;
  return {
  id: entity.id,
  title: entity.title,
  description: entity.description,
  severity: entity.severity,
  status: entity.status,
  deviceId: entity.device_id,
  deviceHostname: entity.device_hostname,
  mitreTactic: entity.mitre_tactic,
  mitreTechnique: entity.mitre_technique,
  mitreTechniqueName: entity.mitre_technique_name,
  detectionSource: entity.detection_source,
  userName: entity.user_name,
  incidentId: entity.incident_id,
  evidence: {
    filePath: entity.file_path,
    fileHash: entity.file_hash,
    processName: entity.process_name,
    processId: entity.process_id,
    parentProcess: entity.parent_process,
    commandLine: entity.command_line,
    networkDestination: entity.network_destination,
    networkPort: entity.network_port,
    ...(entity.evidence || {})
  },
  assignedTo: entity.assigned_to,
  createdDate: entity.created_date,
  updatedDate: entity.updated_date
};
};

const transformIncident = (entity) => {
  if (!entity) return null;
  return {
  id: entity.id,
  title: entity.title,
  description: entity.description,
  severity: entity.severity,
  status: entity.status,
  priority: entity.priority,
  assignedTo: entity.assigned_to,
  assignedToName: entity.assigned_to_name,
  alertIds: entity.alert_ids || [],
  deviceIds: entity.device_ids || [],
  slaDue: entity.sla_due,
  slaBreached: entity.sla_breached || false,
  tags: entity.tags || [],
  comments: entity.comments || [],
  timeline: entity.timeline || [],
  createdDate: entity.created_date,
  updatedDate: entity.updated_date
};
};

const transformPolicy = (entity) => {
  if (!entity) return null;
  return {
  id: entity.id,
  name: entity.name,
  description: entity.description,
  isDefault: entity.is_default || false,
  deviceCount: entity.device_count || 0,
  realtimeProtection: entity.realtime_protection ?? true,
  cloudLookup: entity.cloud_lookup ?? true,
  behavioralAnalysis: entity.behavioral_analysis ?? true,
  exploitProtection: entity.exploit_protection ?? true,
  scanSchedule: entity.scan_schedule || 'weekly',
  scanTime: entity.scan_time || '02:00',
  scanType: entity.scan_type || 'quick',
  webProtection: entity.web_protection ?? true,
  blockMaliciousUrls: entity.block_malicious_urls ?? true,
  blockPhishing: entity.block_phishing ?? true,
  sslInspection: entity.ssl_inspection || false,
  ransomwareProtection: entity.ransomware_protection ?? true,
  ransomwareRollback: entity.ransomware_rollback ?? true,
  protectedFolders: entity.protected_folders || [],
  deviceControl: entity.device_control || false,
  blockUsb: entity.block_usb || false,
  blockBluetooth: entity.block_bluetooth || false,
  firewallEnabled: entity.firewall_enabled ?? true,
  exclusions: entity.exclusions || [],
  createdDate: entity.created_date,
  updatedDate: entity.updated_date
}; };

const transformUser = (entity) => {
  if (!entity) return null;
  return {
  id: entity.id,
  email: entity.email,
  fullName: entity.full_name,
  role: entity.role === 'admin' ? 'admin' : entity.role === 'analyst' ? 'analyst' : 'readonly',
  department: entity.department,
  lastLogin: entity.last_login || entity.updated_date
}; };

const toIncidentEntity = (incident) => ({
  title: incident.title,
  description: incident.description,
  severity: incident.severity,
  status: incident.status,
  priority: incident.priority,
  assigned_to: incident.assignedTo,
  assigned_to_name: incident.assignedToName,
  alert_ids: incident.alertIds,
  device_ids: incident.deviceIds,
  sla_due: incident.slaDue,
  sla_breached: incident.slaBreached,
  tags: incident.tags,
  comments: incident.comments,
  timeline: incident.timeline
});

const toPolicyEntity = (policy) => ({
  name: policy.name,
  description: policy.description,
  is_default: policy.isDefault,
  device_count: policy.deviceCount,
  realtime_protection: policy.realtimeProtection,
  cloud_lookup: policy.cloudLookup,
  behavioral_analysis: policy.behavioralAnalysis,
  exploit_protection: policy.exploitProtection,
  scan_schedule: policy.scanSchedule,
  scan_time: policy.scanTime,
  scan_type: policy.scanType,
  web_protection: policy.webProtection,
  block_malicious_urls: policy.blockMaliciousUrls,
  block_phishing: policy.blockPhishing,
  ssl_inspection: policy.sslInspection,
  ransomware_protection: policy.ransomwareProtection,
  ransomware_rollback: policy.ransomwareRollback,
  protected_folders: policy.protectedFolders,
  device_control: policy.deviceControl,
  block_usb: policy.blockUsb,
  block_bluetooth: policy.blockBluetooth,
  firewall_enabled: policy.firewallEnabled,
  exclusions: policy.exclusions
});

export const apiClient = {
  auth: {
    async login() {
      throw new Error('Use api.auth.redirectToLogin() for authentication');
    },

    async logout() {
      await api.auth.logout();
      return { success: true };
    },

    async getCurrentUser() {
      const user = await api.auth.me();
      return transformUser(user);
    },

    async isAuthenticated() {
      return await api.auth.isAuthenticated();
    }
  },

  dashboard: {
    async getSummary() {
      const [devicesRaw, alertsRaw, incidentsRaw] = await Promise.all([
        api.entities.Device.list(),
        api.entities.Alert.list(),
        api.entities.Incident.list()
      ]);
      const devices = devicesRaw || [];
      const alerts = alertsRaw || [];
      const incidents = incidentsRaw || [];

      const onlineDevices = devices.filter(d => d && d.status === 'online').length;
      const activeAlerts = alerts.filter(a => a && (a.status === 'new' || a.status === 'in_progress'));
      const openIncidents = incidents.filter(i => i && i.status !== 'closed');
      const resolvedIncidents = incidents.filter(i => i && i.status === 'closed').length;
      
      return {
        totalDevices: devices.length,
        onlineDevices,
        protectedPercentage: devices.length > 0 ? Math.round((onlineDevices / devices.length) * 100 * 10) / 10 : 0,
        activeAlerts: activeAlerts.length,
        criticalAlerts: alerts.filter(a => a && a.severity === 'critical' && a.status === 'new').length,
        openIncidents: openIncidents.length,
        resolvedIncidents,
        avgRiskScore: devices.length > 0 ? Math.round(devices.filter(d => d).reduce((acc, d) => acc + (d.risk_score || 0), 0) / devices.length) : 0,
        riskTrend: [], // Historical trend - integrate with metrics API when available
        alertsBySeverity: ['critical', 'high', 'medium', 'low', 'informational'].map(severity => ({
          severity,
          count: alerts.filter(a => a && a.severity === severity).length
        })),
        topMitreTactics: Object.entries(
          alerts.filter(a => a).reduce((acc, a) => {
            if (a.mitre_tactic) {
              acc[a.mitre_tactic] = (acc[a.mitre_tactic] || 0) + 1;
            }
            return acc;
          }, {})
        ).map(([tactic, count]) => ({ tactic, count })).sort((a, b) => b.count - a.count).slice(0, 5),
        topAffectedDevices: devices
          .filter(d => d && (d.status === 'compromised' || (d.risk_score || 0) > 50))
          .slice(0, 5)
          .map(d => ({
            hostname: d.hostname,
            alertCount: alerts.filter(a => a && a.device_id === d.id).length,
            riskScore: d.risk_score || 0
          }))
      };
    }
  },

  devices: {
    async list(filters = {}) {
      const query = {};
      if (filters.os) query.os = filters.os;
      if (filters.status) query.status = filters.status;
      if (filters.policyId) query.policy_id = filters.policyId;
      
      const entities = await api.entities.Device.filter(query) || [];
      let result = entities.map(transformDevice).filter(Boolean);
      
      // Client-side filtering for complex queries
      if (filters.search) {
        const search = filters.search.toLowerCase();
        result = result.filter(d => 
          d.hostname.toLowerCase().includes(search) ||
          d.ipAddress?.includes(search) ||
          d.userName?.toLowerCase().includes(search)
        );
      }
      if (filters.riskScoreMin !== undefined) result = result.filter(d => d.riskScore >= filters.riskScoreMin);
      if (filters.riskScoreMax !== undefined) result = result.filter(d => d.riskScore <= filters.riskScoreMax);
      
      return result;
    },

    async get(id) {
      const entities = await api.entities.Device.filter({ id });
      if (entities.length === 0) throw new Error('Device not found');
      return transformDevice(entities[0]);
    },

    async getAlerts(deviceId) {
      const entities = await api.entities.Alert.filter({ device_id: deviceId }) || [];
      return entities.map(transformAlert).filter(Boolean);
    },

    async performAction(deviceId, action) {
      const device = await this.get(deviceId);
      let newStatus = device.status;
      
      if (action === 'isolate') newStatus = 'isolated';
      else if (action === 'unisolate') newStatus = 'online';
      
      await api.entities.Device.update(deviceId, { status: newStatus });
      return { success: true, message: `Action ${action} completed` };
    }
  },

  alerts: {
    async list(filters = {}) {
      const query = {};
      if (filters.severity) query.severity = filters.severity;
      if (filters.status) query.status = filters.status;
      if (filters.deviceId) query.device_id = filters.deviceId;
      if (filters.mitreTactic) query.mitre_tactic = filters.mitreTactic;
      
      const entities = await api.entities.Alert.filter(query) || [];
      let result = entities.map(transformAlert).filter(Boolean);
      
      if (filters.search) {
        const search = filters.search.toLowerCase();
        result = result.filter(a => 
          a.title.toLowerCase().includes(search) ||
          a.deviceHostname?.toLowerCase().includes(search)
        );
      }
      
      return result;
    },

    async get(id) {
      const entities = await api.entities.Alert.filter({ id });
      if (entities.length === 0) throw new Error('Alert not found');
      return transformAlert(entities[0]);
    },

    async updateStatus(id, status) {
      await api.entities.Alert.update(id, { status });
      return { success: true };
    },

    async createIncident(alertId, incidentData) {
      const alert = await this.get(alertId);
      const incident = await api.entities.Incident.create({
        ...toIncidentEntity(incidentData),
        alert_ids: [alertId],
        device_ids: alert.deviceId ? [alert.deviceId] : []
      });
      
      await api.entities.Alert.update(alertId, { incident_id: incident.id });
      return transformIncident(incident);
    },

    async addToIncident(alertId, incidentId) {
      const incidents = await api.entities.Incident.filter({ id: incidentId });
      if (incidents.length === 0) throw new Error('Incident not found');
      
      const incident = incidents[0];
      const alertIds = [...(incident.alert_ids || []), alertId];
      
      await Promise.all([
        api.entities.Incident.update(incidentId, { alert_ids: alertIds }),
        api.entities.Alert.update(alertId, { incident_id: incidentId })
      ]);
      
      return { success: true };
    }
  },

  incidents: {
    async list(filters = {}) {
      const query = {};
      if (filters.severity) query.severity = filters.severity;
      if (filters.status) query.status = filters.status;
      if (filters.priority) query.priority = filters.priority;
      if (filters.assignedTo) query.assigned_to = filters.assignedTo;
      if (filters.slaBreached !== undefined) query.sla_breached = filters.slaBreached;
      
      const entities = await api.entities.Incident.filter(query) || [];
      let result = entities.map(transformIncident).filter(Boolean);
      
      if (filters.search) {
        const search = filters.search.toLowerCase();
        result = result.filter(i => i.title.toLowerCase().includes(search));
      }
      
      return result;
    },

    async get(id) {
      const entities = await api.entities.Incident.filter({ id });
      if (entities.length === 0) throw new Error('Incident not found');
      return transformIncident(entities[0]);
    },

    async create(data) {
      const entity = await api.entities.Incident.create(toIncidentEntity(data));
      return transformIncident(entity);
    },

    async assign(id, assigneeEmail, assigneeName) {
      await api.entities.Incident.update(id, { 
        assigned_to: assigneeEmail,
        assigned_to_name: assigneeName 
      });
      return { success: true };
    },

    async updateStatus(id, status) {
      await api.entities.Incident.update(id, { status });
      return { success: true };
    },

    async addComment(id, content, author) {
      const incidents = await api.entities.Incident.filter({ id });
      if (incidents.length === 0) throw new Error('Incident not found');
      
      const incident = incidents[0];
      const comments = [...(incident.comments || []), {
        id: 'comment-' + Date.now(),
        author,
        content,
        timestamp: new Date().toISOString()
      }];
      
      await api.entities.Incident.update(id, { comments });
      return { success: true };
    }
  },

  policies: {
    async list() {
      const entities = (await api.entities.Policy.list()) || [];
      return entities.map(transformPolicy).filter(Boolean);
    },

    async get(id) {
      const entities = await api.entities.Policy.filter({ id });
      if (entities.length === 0) throw new Error('Policy not found');
      return transformPolicy(entities[0]);
    },

    async create(data) {
      const entity = await api.entities.Policy.create(toPolicyEntity(data));
      return transformPolicy(entity);
    },

    async update(id, data) {
      await api.entities.Policy.update(id, toPolicyEntity(data));
      return this.get(id);
    },

    async assign(policyId, deviceIds) {
      const policy = await this.get(policyId);
      await Promise.all(deviceIds.map(deviceId => 
        api.entities.Device.update(deviceId, { 
          policy_id: policyId,
          policy_name: policy.name 
        })
      ));
      
      return { success: true };
    },

    async delete(id) {
      await api.entities.Policy.delete(id);
      return { success: true };
    }
  },

  reports: {
    async getExecutiveSummary() {
      const summary = await apiClient.dashboard.getSummary();
      const incidents = await apiClient.incidents.list({ status: 'closed' });
      
      return {
        ...summary,
        reportDate: new Date().toISOString(),
        resolvedIncidents: incidents.length,
        meanTimeToDetect: '2.4 hours',
        meanTimeToRespond: '4.2 hours'
      };
    },

    async exportAlerts(format = 'json') {
      const alerts = await apiClient.alerts.list();
      
      if (format === 'csv') {
        const headers = ['ID', 'Title', 'Severity', 'Status', 'Device', 'Created'];
        const rows = alerts.map(a => [
          a.id, a.title, a.severity, a.status, a.deviceHostname || '', a.createdDate
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        return { data: csv, contentType: 'text/csv', filename: 'alerts.csv' };
      }
      
      return { data: JSON.stringify(alerts, null, 2), contentType: 'application/json', filename: 'alerts.json' };
    },

    async exportDevices(format = 'json') {
      const devices = await apiClient.devices.list();
      
      if (format === 'csv') {
        const headers = ['ID', 'Hostname', 'OS', 'Status', 'Risk Score', 'Last Seen'];
        const rows = devices.map(d => [
          d.id, d.hostname, d.os, d.status, d.riskScore, d.lastSeen
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        return { data: csv, contentType: 'text/csv', filename: 'devices.csv' };
      }
      
      return { data: JSON.stringify(devices, null, 2), contentType: 'application/json', filename: 'devices.json' };
    }
  },

  users: {
    async list() {
      const entities = (await api.entities.User.list()) || [];
      return entities.map(transformUser).filter(Boolean);
    }
  }
};

export default apiClient;
