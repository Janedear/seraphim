import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';

export const queryKeys = {
  dashboard: ['dashboard'],
  dashboardSummary: ['dashboard', 'summary'],
  devices: (filters) => ['devices', filters],
  device: (id) => ['devices', id],
  deviceAlerts: (id) => ['devices', id, 'alerts'],
  alerts: (filters) => ['alerts', filters],
  alert: (id) => ['alerts', id],
  incidents: (filters) => ['incidents', filters],
  incident: (id) => ['incidents', id],
  policies: ['policies'],
  policy: (id) => ['policies', id],
  users: ['users'],
  currentUser: ['currentUser'],
};

export const useDashboardSummary = () =>
  useQuery({
    queryKey: queryKeys.dashboardSummary,
    queryFn: () => apiClient.dashboard.getSummary(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

export const useDevices = (filters = {}) =>
  useQuery({
    queryKey: queryKeys.devices(filters),
    queryFn: () => apiClient.devices.list(filters),
    staleTime: 10_000,
  });

export const useDevice = (id) =>
  useQuery({
    queryKey: queryKeys.device(id),
    queryFn: () => apiClient.devices.get(id),
    enabled: !!id,
  });

export const useDeviceAlerts = (deviceId) =>
  useQuery({
    queryKey: queryKeys.deviceAlerts(deviceId),
    queryFn: () => apiClient.devices.getAlerts(deviceId),
    enabled: !!deviceId,
  });

export const useDeviceAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, action }) => apiClient.devices.performAction(deviceId, action),
    onSuccess: (_, { deviceId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.device(deviceId) });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
};

export const useAlerts = (filters = {}) =>
  useQuery({
    queryKey: queryKeys.alerts(filters),
    queryFn: () => apiClient.alerts.list(filters),
    staleTime: 10_000,
  });

export const useAlert = (id) =>
  useQuery({
    queryKey: queryKeys.alert(id),
    queryFn: () => apiClient.alerts.get(id),
    enabled: !!id,
  });

export const useUpdateAlertStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => apiClient.alerts.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alert(id) });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
    },
  });
};

export const useCreateIncidentFromAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, incidentData }) => apiClient.alerts.createIncident(alertId, incidentData),
    onSuccess: (_, { alertId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alert(alertId) });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
};

export const useAddAlertToIncident = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, incidentId }) => apiClient.alerts.addToIncident(alertId, incidentId),
    onSuccess: (_, { alertId, incidentId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alert(alertId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.incident(incidentId) });
    },
  });
};

export const useIncidents = (filters = {}) =>
  useQuery({
    queryKey: queryKeys.incidents(filters),
    queryFn: () => apiClient.incidents.list(filters),
    staleTime: 10_000,
  });

export const useIncident = (id) =>
  useQuery({
    queryKey: queryKeys.incident(id),
    queryFn: () => apiClient.incidents.get(id),
    enabled: !!id,
  });

export const useCreateIncident = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiClient.incidents.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
    },
  });
};

export const useAssignIncident = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assigneeEmail, assigneeName }) =>
      apiClient.incidents.assign(id, assigneeEmail, assigneeName),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incident(id) });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
};

export const useUpdateIncidentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => apiClient.incidents.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incident(id) });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
    },
  });
};

export const useAddIncidentComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content, author }) => apiClient.incidents.addComment(id, content, author),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incident(id) });
    },
  });
};

export const usePolicies = () =>
  useQuery({
    queryKey: queryKeys.policies,
    queryFn: () => apiClient.policies.list(),
    staleTime: 60_000,
  });

export const usePolicy = (id) =>
  useQuery({
    queryKey: queryKeys.policy(id),
    queryFn: () => apiClient.policies.get(id),
    enabled: !!id,
  });

export const useCreatePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiClient.policies.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.policies });
    },
  });
};

export const useUpdatePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => apiClient.policies.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.policy(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.policies });
    },
  });
};

export const useAssignPolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, deviceIds }) => apiClient.policies.assign(policyId, deviceIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.policies });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
};

export const useDeletePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.policies.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.policies });
    },
  });
};

export const useExecutiveSummary = () =>
  useQuery({
    queryKey: ['reports', 'executive-summary'],
    queryFn: () => apiClient.reports.getExecutiveSummary(),
    staleTime: 60_000,
  });

export const useExportAlerts = () =>
  useMutation({
    mutationFn: (format) => apiClient.reports.exportAlerts(format),
  });

export const useExportDevices = () =>
  useMutation({
    mutationFn: (format) => apiClient.reports.exportDevices(format),
  });

export const useUsers = () =>
  useQuery({
    queryKey: queryKeys.users,
    queryFn: () => apiClient.users.list(),
    staleTime: 60_000,
  });
