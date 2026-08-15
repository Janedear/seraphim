import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw, 
  Download,
  MoreHorizontal,
  Plus,
  Eye,
  CheckCircle,
  XCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAlerts, useUpdateAlertStatus, useExportAlerts, useIncidents } from '@/components/hooks/useApi';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { DataTable } from '@/components/ui-custom/DataTable';
import { FilterBar } from '@/components/ui-custom/FilterBar';
import { SeverityBadge, StatusBadge } from '@/components/ui-custom/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { toast } from "sonner";
import { MITRE_TACTICS } from '@/components/api/types';

export default function Alerts() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: alerts, isLoading, refetch } = useAlerts(filters);
  const { data: incidents } = useIncidents({});
  const updateStatusMutation = useUpdateAlertStatus();
  const exportMutation = useExportAlerts();

  const handleStatusChange = async (alertId, newStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: alertId, status: newStatus });
      toast.success(`Alert status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update alert status');
    }
  };

  const handleExport = async (format) => {
    try {
      const result = await exportMutation.mutateAsync(format);
      if (!result || !result.data) {
        toast.error('Export failed - no data returned');
        return;
      }
      const blob = new Blob([result.data], { type: result.contentType || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename || `alerts_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Export downloaded successfully');
    } catch (error) {
      toast.error(`Export failed: ${error.message}`);
    }
  };

  const columns = [
    {
      id: 'severity',
      header: 'Severity',
      accessorKey: 'severity',
      cell: ({ getValue }) => <SeverityBadge severity={getValue()} />
    },
    {
      id: 'title',
      header: 'Alert',
      accessorKey: 'title',
      cell: ({ row }) => (
        <div className="max-w-md">
          <p className="font-medium text-white truncate">{row.original.title}</p>
          {row.original.mitreTactic && (
            <p className="text-xs text-cyan-300/70 mt-0.5">
              {row.original.mitreTactic} • {row.original.mitreTechnique}
            </p>
          )}
        </div>
      )
    },
    {
      id: 'device',
      header: 'Device',
      accessorKey: 'deviceHostname',
      cell: ({ getValue }) => (
        <span className="text-sm text-cyan-200">{getValue() || 'N/A'}</span>
      )
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => <StatusBadge status={getValue()} />
    },
    {
      id: 'createdDate',
      header: 'Time',
      accessorKey: 'createdDate',
      cell: ({ getValue }) => {
        const value = getValue();
        if (!value) return <span className="text-cyan-300/40">—</span>;
        return (
          <span className="text-sm text-cyan-300/60">
            {formatDistanceToNow(new Date(value), { addSuffix: true })}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: '',
      accessorKey: 'id',
      sortable: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(createPageUrl(`AlertDetail?id=${encodeURIComponent(row.original.id)}`))}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.original.status !== 'resolved' && (
              <DropdownMenuItem onClick={() => handleStatusChange(row.original.id, 'resolved')}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Resolved
              </DropdownMenuItem>
            )}
            {row.original.status !== 'false_positive' && (
              <DropdownMenuItem onClick={() => handleStatusChange(row.original.id, 'false_positive')}>
                <XCircle className="w-4 h-4 mr-2" />
                Mark False Positive
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {!row.original.incidentId && (
              <DropdownMenuItem onClick={() => navigate(createPageUrl(`AlertDetail?id=${encodeURIComponent(row.original.id)}&action=create-incident`))}>
                <Plus className="w-4 h-4 mr-2" />
                Create Incident
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const filterConfig = {
    search: true,
    dropdowns: [
      {
        key: 'severity',
        label: 'Severity',
        options: [
          { value: 'critical', label: 'Critical' },
          { value: 'high', label: 'High' },
          { value: 'medium', label: 'Medium' },
          { value: 'low', label: 'Low' },
          { value: 'informational', label: 'Informational' }
        ]
      },
      {
        key: 'status',
        label: 'Status',
        options: [
          { value: 'new', label: 'New' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'resolved', label: 'Resolved' },
          { value: 'false_positive', label: 'False Positive' }
        ]
      },
      {
        key: 'mitreTactic',
        label: 'MITRE Tactic',
        options: MITRE_TACTICS.map(t => ({ value: t, label: t }))
      }
    ]
  };

  const newAlertsCount = alerts?.filter(a => a.status === 'new').length || 0;

  return (
    <div className="relative space-y-6">
      <PageHeader
        title="Alerts"
        description={`${newAlertsCount} new alerts requiring attention`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <FilterBar
        filters={filterConfig}
        values={filters}
        onChange={setFilters}
        searchPlaceholder="Search alerts..."
      />

      <Card className="overflow-hidden bg-black/40 border-cyan-500/50 backdrop-blur-md shadow-[0_0_30px_rgba(0,186,255,0.2)]">
        <DataTable
          columns={columns}
          data={alerts || []}
          isLoading={isLoading}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(row) => navigate(createPageUrl(`AlertDetail?id=${encodeURIComponent(row.id)}`))}
          pageSize={15}
          emptyMessage="No alerts found"
        />
      </Card>
    </div>
  );
}