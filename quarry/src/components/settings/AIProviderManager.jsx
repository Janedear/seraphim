import React, { useState } from 'react';
import { api } from '@/api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import AIProviderForm from './AIProviderForm';

export default function AIProviderManager({ providers = [], user }) {
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.AIProvider.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiProviders'] });
      setShowForm(false);
      toast.success('AI provider created');
    },
    onError: () => toast.error('Failed to create AI provider'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.AIProvider.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiProviders'] });
      setEditingProvider(null);
      toast.success('AI provider updated');
    },
    onError: () => toast.error('Failed to update AI provider'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.AIProvider.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiProviders'] });
      toast.success('AI provider deleted');
    },
    onError: () => toast.error('Failed to delete AI provider'),
  });

  const handleSubmit = (data) => {
    if (editingProvider) {
      updateMutation.mutate({ id: editingProvider.id, data });
    } else {
      createMutation.mutate({ ...data, assigned_agent: user?.email });
    }
  };

  return (
    <div className="space-y-6">
      {!showForm && !editingProvider && (
        <Button onClick={() => setShowForm(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Add AI Provider
        </Button>
      )}

      {(showForm || editingProvider) && (
        <AIProviderForm
          provider={editingProvider}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingProvider(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <div className="grid gap-4">
        {providers.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6 text-center text-slate-400">
              No AI providers configured yet. Add one to get started.
            </CardContent>
          </Card>
        ) : (
          providers.map((provider) => (
            <Card key={provider.id} className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white">{provider.name}</CardTitle>
                    <CardDescription className="text-slate-400 mt-2">
                      {provider.provider_type} • {provider.model_id}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingProvider(provider)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(provider.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">API Base URL</p>
                    <p className="text-white font-mono text-xs truncate">{provider.api_base_url}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">API Key Reference</p>
                    <p className="text-white font-mono text-xs">{provider.api_key_ref}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Temperature</p>
                    <p className="text-white">{provider.temperature}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Max Tokens</p>
                    <p className="text-white">{provider.max_tokens}</p>
                  </div>
                </div>
                {provider.description && (
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Description</p>
                    <p className="text-white text-sm">{provider.description}</p>
                  </div>
                )}
                {provider.use_cases?.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Use Cases</p>
                    <div className="flex flex-wrap gap-2">
                      {provider.use_cases.map((useCase) => (
                        <span key={useCase} className="px-2 py-1 bg-blue-900/50 text-blue-300 text-xs rounded">
                          {useCase}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <Switch
                    checked={provider.enabled}
                    onCheckedChange={(enabled) =>
                      updateMutation.mutate({ id: provider.id, data: { enabled } })
                    }
                  />
                  <p className="text-sm text-slate-400">
                    {provider.enabled ? 'Enabled' : 'Disabled'}
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