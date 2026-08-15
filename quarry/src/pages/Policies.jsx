import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield,
  Plus,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Monitor,
  Check,
  RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePolicies, useCreatePolicy, useDeletePolicy } from '@/components/hooks/useApi';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PolicyCard = ({ policy, onClick, onDuplicate, onDelete, isDeleting }) => {
  const protectionFeatures = [
    { key: 'realtimeProtection', label: 'Real-time Protection', enabled: policy.realtimeProtection },
    { key: 'behavioralAnalysis', label: 'Behavioral Analysis', enabled: policy.behavioralAnalysis },
    { key: 'ransomwareProtection', label: 'Ransomware Protection', enabled: policy.ransomwareProtection },
    { key: 'webProtection', label: 'Web Protection', enabled: policy.webProtection }
  ];

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:border-cyan-400/50 transition-all hover:shadow-md bg-black/40 backdrop-blur-md border-cyan-500/30",
        policy.isDefault && "ring-2 ring-cyan-500 ring-offset-2 shadow-[0_0_30px_rgba(0,186,255,0.3)]"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center border shadow-md",
              policy.isDefault ? "bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_20px_rgba(0,186,255,0.3)]" : "bg-slate-800 border-cyan-500/20"
            )}>
              <Shield className={cn(
                "w-5 h-5",
                policy.isDefault ? "text-cyan-400" : "text-slate-400"
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-white">{policy.name}</h3>
                {policy.isDefault && (
                  <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 text-xs border border-cyan-500/50">
                    Default
                  </Badge>
                )}
              </div>
              <p className="text-xs text-cyan-200/70 mt-0.5">{policy.description || 'No description'}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Policy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onDuplicate?.(policy);
              }}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!policy.isDefault && (
                <DropdownMenuItem className="text-red-600" onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(policy);
                }} disabled={isDeleting}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Monitor className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-cyan-200">{policy.deviceCount} devices</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {protectionFeatures.map(feature => (
            <div 
              key={feature.key}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs",
                feature.enabled 
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" 
                  : "bg-slate-800/50 text-slate-500 border border-slate-700/30"
              )}
            >
              {feature.enabled ? (
                <Check className="w-3 h-3" />
              ) : (
                <span className="w-3 h-3" />
              )}
              {feature.label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const PolicySkeleton = () => (
  <Card className="animate-pulse">
    <CardHeader className="pb-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48 mt-1" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </CardContent>
  </Card>
);

export default function Policies() {
  const navigate = useNavigate();
  const { data: policies, isLoading, refetch } = usePolicies();
  const createPolicyMutation = useCreatePolicy();
  const deletePolicyMutation = useDeletePolicy();

  const handleDuplicate = async (policy) => {
    try {
      const { id, deviceCount, createdDate, updatedDate, ...rest } = policy;
      const newPolicy = await createPolicyMutation.mutateAsync({
        ...rest,
        name: `${policy.name} (Copy)`,
        isDefault: false,
      });
      toast.success('Policy duplicated');
      navigate(createPageUrl(`PolicyEditor?id=${newPolicy.id}`));
    } catch (e) {
      toast.error(e?.message || 'Failed to duplicate policy');
    }
  };

  const handleDelete = async (policy) => {
    if (!confirm(`Delete policy "${policy.name}"? Devices using it will be unassigned.`)) return;
    try {
      await deletePolicyMutation.mutateAsync(policy.id);
      toast.success('Policy deleted');
      refetch();
    } catch (e) {
      toast.error(e?.message || 'Failed to delete policy');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Policies"
        description="Manage endpoint protection policies"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => navigate(createPageUrl('PolicyEditor'))}>
              <Plus className="w-4 h-4 mr-2" />
              Create Policy
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <PolicySkeleton />
            <PolicySkeleton />
            <PolicySkeleton />
          </>
        ) : policies?.length === 0 ? (
          <Card className="col-span-full bg-black/40 border-cyan-500/30">
            <CardContent className="py-16 text-center">
              <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white">No policies yet</h3>
              <p className="text-sm text-slate-400 mt-1 mb-4">
                Create your first policy to start protecting endpoints
              </p>
              <Button onClick={() => navigate(createPageUrl('PolicyEditor'))}>
                <Plus className="w-4 h-4 mr-2" />
                Create Policy
              </Button>
            </CardContent>
          </Card>
        ) : (
          policies?.map(policy => (
            <PolicyCard 
              key={policy.id} 
              policy={policy} 
              onClick={() => navigate(createPageUrl(`PolicyEditor?id=${policy.id}`))}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              isDeleting={deletePolicyMutation.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}