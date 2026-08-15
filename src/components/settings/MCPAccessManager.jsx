import React, { useState } from 'react';
import { api } from '@/api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import MCPAccessForm from './MCPAccessForm';

export default function MCPAccessManager({ rules = [], providers = [], user }) {
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.MCPAccessRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcpRules'] });
      setShowForm(false);
      toast.success('MCP access rule created');
    },
    onError: () => toast.error('Failed to create MCP access rule'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.MCPAccessRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcpRules'] });
      setEditingRule(null);
      toast.success('MCP access rule updated');
    },
    onError: () => toast.error('Failed to update MCP access rule'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.MCPAccessRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcpRules'] });
      toast.success('MCP access rule deleted');
    },
    onError: () => toast.error('Failed to delete MCP access rule'),
  });

  const handleSubmit = (data) => {
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data });
    } else {
      createMutation.mutate({ ...data, created_by: user?.email });
    }
  };

  const getProviderName = (providerId) => {
    return providers.find((p) => p.id === providerId)?.name || providerId;
  };

  return (
    <div className="space-y-6">
      {!showForm && !editingRule && (
        <Button onClick={() => setShowForm(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Add MCP Access Rule
        </Button>
      )}

      {(showForm || editingRule) && (
        <MCPAccessForm
          rule={editingRule}
          providers={providers}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingRule(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <div className="grid gap-4">
        {rules.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6 text-center text-slate-400">
              No MCP access rules configured yet. Add one to grant tool access to AI providers.
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id} className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white">{getProviderName(rule.ai_provider_id)}</CardTitle>
                    <CardDescription className="text-slate-400 mt-2">
                      {rule.tool_category}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingRule(rule)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(rule.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm mb-2">
                    {rule.allow_all_endpoints ? 'All Endpoints Allowed' : 'Specific Endpoints'}
                  </p>
                  {!rule.allow_all_endpoints && rule.allowed_endpoints?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {rule.allowed_endpoints.map((endpoint) => (
                        <span key={endpoint} className="px-2 py-1 bg-emerald-900/50 text-emerald-300 text-xs rounded">
                          {endpoint}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {rule.rate_limit > 0 && (
                  <div>
                    <p className="text-slate-400 text-sm">Rate Limit</p>
                    <p className="text-white">{rule.rate_limit} calls/min</p>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <div className={`h-2 w-2 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                  <p className="text-sm text-slate-400">
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}