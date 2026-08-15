import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  RefreshCw, 
  Plus,
  MoreHorizontal,
  Eye,
  Clock,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIncidents, useUpdateIncidentStatus } from '@/components/hooks/useApi';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { DataTable } from '@/components/ui-custom/DataTable';
import { FilterBar } from '@/components/ui-custom/FilterBar';
import { SeverityBadge, StatusBadge, PriorityBadge } from '@/components/ui-custom/StatusBadge';
import { formatDistanceToNow, isPast } from 'date-fns';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Incidents() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: incidents, isLoading, refetch } = useIncidents(filters);
  const updateStatusMutation = useUpdateIncidentStatus();

  const handleStatusChange = async (incidentId, newStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: incidentId, status: newStatus });
      toast.success(`Incident status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update incident status');
    }
  };

  const columns = [
    {
      id: 'priority',
      header: 'Priority',
      accessorKey: 'priority',
      cell: ({ getValue }) => <PriorityBadge priority={getValue()} />
    },
    {
      id: 'title',
      header: 'Incident',
      accessorKey: 'title',
      cell: ({ row }) => (
        <div className="max-w-md">
          <p className="font-medium text-white">{row.original.title}</p>
          <p className="text-xs text-cyan-300/70 mt-0.5">
            {row.original.alertIds?.length || 0} alerts • {row.original.deviceIds?.length || 0} devices
          </p>
        </div>
      )
    },
    {
      id: 'severity',
      header: 'Severity',
      accessorKey: 'severity',
      cell: ({ getValue }) => <SeverityBadge severity={getValue()} />
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => <StatusBadge status={getValue()} />
    },
    {
      id: 'assignedTo',
      header: 'Assignee',
      accessorKey: 'assignedToName',
      cell: ({ row }) => {
        if (!row.original.assignedTo) {
          return <span className="text-cyan-300/40 text-sm">Unassigned</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                {row.original.assignedToName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-cyan-200">{row.original.assignedToName}</span>
          </div>
        );
      }
    },
    {
      id: 'sla',
      header: 'SLA',
      accessorKey: 'slaDue',
      cell: ({ row }) => {
        if (!row.original.slaDue) return <span className="text-slate-400">—</span>;
        
        const isBreached = row.original.slaBreached || isPast(new Date(row.original.slaDue));
        
        return (
          <div className={cn(
            "flex items-center gap-1.5 text-sm",
            isBreached ? "text-red-400" : "text-cyan-200"
          )}>
            {isBreached ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
            {isBreached ? 'Breached' : formatDistanceToNow(new Date(row.original.slaDue), { addSuffix: true })}
          </div>
        );
      }
    },
    {
      id: 'createdDate',
      header: 'Created',
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
            <DropdownMenuItem onClick={() => navigate(createPageUrl(`IncidentDetail?id=${encodeURIComponent(row.original.id)}`))}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {(row.original.status === 'open' || row.original.status === 'new') && (
              <DropdownMenuItem onClick={() => handleStatusChange(row.original.id, 'investigating')}>
                Start Investigation
              </DropdownMenuItem>
            )}
            {(row.original.status === 'investigating' || row.original.status === 'in_progress') && (
              <DropdownMenuItem onClick={() => handleStatusChange(row.original.id, 'contained')}>
                Mark Contained
              </DropdownMenuItem>
            )}
            {row.original.status !== 'closed' && (
              <DropdownMenuItem onClick={() => handleStatusChange(row.original.id, 'closed')}>
                Close Incident
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
          { value: 'open', label: 'Open' },
          { value: 'new', label: 'New' },
          { value: 'investigating', label: 'Investigating' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'contained', label: 'Contained' },
          { value: 'remediated', label: 'Remediated' },
          { value: 'closed', label: 'Closed' }
        ]
      },
      {
        key: 'severity',
        label: 'Severity',
        options: [
          { value: 'critical', label: 'Critical' },
          { value: 'high', label: 'High' },
          { value: 'medium', label: 'Medium' },
          { value: 'low', label: 'Low' }
        ]
      },
      {
        key: 'priority',
        label: 'Priority',
        options: [
          { value: 'p1', label: 'P1 - Critical' },
          { value: 'p2', label: 'P2 - High' },
          { value: 'p3', label: 'P3 - Medium' },
          { value: 'p4', label: 'P4 - Low' }
        ]
      }
    ]
  };

  const openCount = incidents?.filter(i => i.status !== 'closed').length || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incidents"
        description={`${openCount} open incidents`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => navigate(createPageUrl('IncidentDetail?action=create'))}>
               <Plus className="w-4 h-4 mr-2" />
               Create Incident
             </Button>
          </>
        }
      />

      <FilterBar
        filters={filterConfig}
        values={filters}
        onChange={setFilters}
        searchPlaceholder="Search incidents..."
      />

      <Card className="overflow-hidden bg-black/40 border-cyan-500/50 backdrop-blur-md shadow-[0_0_30px_rgba(0,186,255,0.2)]">
        <DataTable
          columns={columns}
          data={incidents || []}
          isLoading={isLoading}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(row) => navigate(createPageUrl(`IncidentDetail?id=${encodeURIComponent(row.id)}`))}
          pageSize={15}
          emptyMessage="No incidents found"
        />
      </Card>
    </div>
  );
}