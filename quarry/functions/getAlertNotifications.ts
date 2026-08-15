import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real implementation, these would come from a Notification entity
    // For now, we'll check for conditions that trigger notifications
    const alerts = await api.entities.Alert.list();
    const incidents = await api.entities.Incident.list();

    const notifications = [];

    // Check for critical incidents
    const criticalIncidents = incidents.filter(i => i.severity === 'critical' && i.status === 'open');
    if (criticalIncidents.length > 0) {
      notifications.push({
        id: 'notif-1',
        type: 'critical',
        severity: 'critical',
        title: 'Critical Incidents Detected',
        message: `${criticalIncidents.length} critical incident(s) require immediate attention`,
        timestamp: new Date().toISOString(),
        read: false
      });
    }

    // Check for high severity alerts
    const highAlerts = alerts.filter(a => a.severity === 'high' && a.status === 'new');
    if (highAlerts.length >= 5) {
      notifications.push({
        id: 'notif-2',
        type: 'security',
        severity: 'high',
        title: 'High Severity Alerts',
        message: `${highAlerts.length} high severity alerts detected in the last hour`,
        timestamp: new Date().toISOString(),
        read: false
      });
    }

    // Check for unusual activity
    const recentAlerts = alerts.slice(0, 10);
    const malwareAlerts = recentAlerts.filter(a => a.title?.toLowerCase().includes('malware'));
    if (malwareAlerts.length > 3) {
      notifications.push({
        id: 'notif-3',
        type: 'security',
        severity: 'high',
        title: 'Malware Activity Spike',
        message: 'Unusual increase in malware detections detected',
        timestamp: new Date().toISOString(),
        read: false
      });
    }

    return Response.json(notifications);
  } catch (error) {
    console.error('Notification fetch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});