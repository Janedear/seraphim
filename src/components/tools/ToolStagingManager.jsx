import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ToolStagingManager({ team = 'blue' }) {
  const [updatingTool, setUpdatingTool] = useState(null);

  const { data: tools, isLoading, refetch } = useQuery({
    queryKey: ['tool-configs'],
    queryFn: () => api.entities.ToolConfig.list(),
    initialData: [],
  });

  const handleToggleTool = async (toolId, currentEnabled) => {
    setUpdatingTool(toolId);
    try {
      await api.entities.ToolConfig.update(toolId, {
        enabled: !currentEnabled,
      });
      await refetch();
      toast.success(`Tool ${!currentEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update tool');
    } finally {
      setUpdatingTool(null);
    }
  };

  const accentColor = team === 'blue' ? 'cyan' : 'red';
  const borderClass = accentColor === 'cyan' ? 'border-cyan-500/50' : 'border-red-500/50';
  const textClass = accentColor === 'cyan' ? 'text-cyan-400' : 'text-red-400';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Tool Configuration</h3>
        <Badge variant="outline" className="border-slate-600 text-slate-400">
          {tools.length} tools
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : tools.length === 0 ? (
        <Card className={cn('bg-black/40 backdrop-blur-md', borderClass)}>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-400 text-center">No tools configured yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {tools.map((tool) => (
            <Card key={tool.id} className={cn('bg-black/40 backdrop-blur-md', borderClass)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{tool.display_name}</h4>
                      <Badge className={tool.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                        {tool.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{tool.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Mode</p>
                        <p className="text-xs text-slate-300">{tool.execution_mode}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Category</p>
                        <p className="text-xs text-slate-300 capitalize">{tool.category}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Timeout</p>
                        <p className="text-xs text-slate-300">{tool.timeout_seconds}s</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Rate Limit</p>
                        <p className="text-xs text-slate-300">
                          {tool.rate_limit_per_minute || '∞'}/min
                        </p>
                      </div>
                    </div>

                    {tool.api_base_url && (
                      <div className="mt-2 p-2 bg-slate-800/50 rounded border border-slate-700">
                        <p className="text-xs text-slate-500 font-mono">
                          {tool.api_base_url}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={tool.enabled}
                      onCheckedChange={() => handleToggleTool(tool.id, tool.enabled)}
                      disabled={updatingTool === tool.id}
                    />
                    {updatingTool === tool.id && (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}