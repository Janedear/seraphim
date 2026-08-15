import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Monitor, 
  RefreshCw, 
  Download,
  MoreHorizontal,
  Search,
  Wifi,
  WifiOff
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDevices, useExportDevices, useDeviceAction } from '@/components/hooks/useApi';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { DataTable } from '@/components/ui-custom/DataTable';
import { FilterBar } from '@/components/ui-custom/FilterBar';
import { StatusBadge, OsBadge, RiskScoreBadge } from '@/components/ui-custom/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Devices() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: devices, isLoading, refetch } = useDevices(filters);
  const exportMutation = useExportDevices();
  const deviceActionMutation = useDeviceAction();

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
      a.download = result.filename || `devices_${Date.now()}.${format}`;
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
      id: 'hostname',
      header: 'Device',
      accessorKey: 'hostname',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            row.original.status === 'online' ? "bg-emerald-50" :
            row.original.status === 'compromised' ? "bg-red-50" :
            row.original.status === 'isolated' ? "bg-purple-50" : "bg-slate-100"
          )}>
            <Monitor className={cn(
              "w-5 h-5",
              row.original.status === 'online' ? "text-emerald-600" :
              row.original.status === 'compromised' ? "text-red-600" :
              row.original.status === 'isolated' ? "text-purple-600" : "text-slate-400"
            )} />
          </div>
          <div>
            <p className="font-medium text-white">{row.original.hostname}</p>
            <p className="text-xs text-cyan-300/70">{row.original.ipAddress}</p>
          </div>
        </div>
      )
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => <StatusBadge status={getValue()} />
    },
    {
      id: 'os',
      header: 'OS',
      accessorKey: 'os',
      cell: ({ getValue }) => <OsBadge os={getValue()} />
    },
    {
      id: 'riskScore',
      header: 'Risk Score',
      accessorKey: 'riskScore',
      cell: ({ getValue }) => <RiskScoreBadge score={getValue()} />
    },
    {
      id: 'policy',
      header: 'Policy',
      accessorKey: 'policyName',
      cell: ({ getValue }) => (
        <span className="text-sm text-cyan-200">{getValue() || 'None'}</span>
      )
    },
    {
      id: 'lastSeen',
      header: 'Last Seen',
      accessorKey: 'lastSeen',
      cell: ({ getValue }) => {
        const value = getValue();
        if (!value) return <span className="text-cyan-300/40">Never</span>;
        return (
          <span className="text-sm text-cyan-200">
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
            <DropdownMenuItem onClick={() => navigate(createPageUrl(`DeviceDetail?id=${encodeURIComponent(row.original.id)}`))}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(createPageUrl(`DeviceDetail?id=${encodeURIComponent(row.original.id)}`))}>
              <Search className="w-4 h-4 mr-2" />
              Run Scan
            </DropdownMenuItem>
            {row.original.status === 'isolated' ? (
               <DropdownMenuItem
                 onClick={async () => {
                   try {
                     await deviceActionMutation.mutateAsync({ deviceId: row.original.id, action: 'unisolate' });
                     toast.success('Device removed from isolation');
                     refetch();
                   } catch (e) {
                     toast.error(e?.message || 'Failed to remove isolation');
                   }
                 }}
                 disabled={deviceActionMutation.isPending}
               >
                 <Wifi className="w-4 h-4 mr-2" />
                 Remove Isolation
               </DropdownMenuItem>
             ) : (
               <DropdownMenuItem
                 className="text-amber-600"
                 onClick={async () => {
                   try {
                     await deviceActionMutation.mutateAsync({ deviceId: row.original.id, action: 'isolate' });
                     toast.success('Device isolated');
                     refetch();
                   } catch (e) {
                     toast.error(e?.message || 'Failed to isolate device');
                   }
                 }}
                 disabled={deviceActionMutation.isPending}
               >
                 <WifiOff className="w-4 h-4 mr-2" />
                 Isolate Device
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
        key: 'status',
        label: 'Status',
        options: [
          { value: 'online', label: 'Online' },
          { value: 'offline', label: 'Offline' },
          { value: 'isolated', label: 'Isolated' },
          { value: 'compromised', label: 'Compromised' }
        ]
      },
      {
        key: 'os',
        label: 'OS',
        options: [
          { value: 'windows', label: 'Windows' },
          { value: 'macos', label: 'macOS' },
          { value: 'linux', label: 'Linux' }
        ]
      }
    ]
  };

  return (
    <div className="relative space-y-6">
      <PageHeader
        title="Devices"
        description={`${devices?.length || 0} endpoints monitored`}
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
        searchPlaceholder="Search devices..."
      />

      <Card className="overflow-hidden bg-black/40 border-cyan-500/50 backdrop-blur-md shadow-[0_0_30px_rgba(0,186,255,0.2)]">
        <DataTable
          columns={columns}
          data={devices || []}
          isLoading={isLoading}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(row) => navigate(createPageUrl(`DeviceDetail?id=${encodeURIComponent(row.id)}`))}
          pageSize={15}
          emptyMessage="No devices found"
        />
      </Card>
    </div>
  );
}