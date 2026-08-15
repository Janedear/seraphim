import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';

export default function MCPAccessForm({ rule, providers = [], onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    ai_provider_id: '',
    tool_category: 'analysis',
    allowed_endpoints: [],
    allow_all_endpoints: false,
    rate_limit: 0,
    enabled: true,
  });

  const [endpointInput, setEndpointInput] = useState('');

  useEffect(() => {
    if (rule) {
      setFormData({
        ai_provider_id: rule.ai_provider_id || '',
        tool_category: rule.tool_category || 'analysis',
        allowed_endpoints: rule.allowed_endpoints || [],
        allow_all_endpoints: rule.allow_all_endpoints || false,
        rate_limit: rule.rate_limit || 0,
        enabled: rule.enabled !== false,
      });
    }
  }, [rule]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addEndpoint = () => {
    if (endpointInput.trim() && !formData.allowed_endpoints.includes(endpointInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        allowed_endpoints: [...prev.allowed_endpoints, endpointInput.trim()],
      }));
      setEndpointInput('');
    }
  };

  const removeEndpoint = (endpoint) => {
    setFormData((prev) => ({
      ...prev,
      allowed_endpoints: prev.allowed_endpoints.filter((e) => e !== endpoint),
    }));
  };

  const toolCategories = ['recon', 'exploitation', 'analysis', 'reporting', 'automation', 'integration'];

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">
              {rule ? 'Edit MCP Access Rule' : 'Add New MCP Access Rule'}
            </CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              Configure which tools and endpoints an AI provider can access
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-slate-400">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-200">AI Provider *</Label>
              <Select value={formData.ai_provider_id} onValueChange={(value) => setFormData({ ...formData, ai_provider_id: value })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Tool Category *</Label>
              <Select value={formData.tool_category} onValueChange={(value) => setFormData({ ...formData, tool_category: value })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {toolCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.allow_all_endpoints}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, allow_all_endpoints: checked })
                }
              />
              <Label className="text-slate-200">Allow all endpoints in this category</Label>
            </div>
          </div>

          {!formData.allow_all_endpoints && (
            <div className="space-y-3">
              <Label className="text-slate-200">Allowed Endpoints</Label>
              <div className="flex gap-2">
                <Input
                  value={endpointInput}
                  onChange={(e) => setEndpointInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEndpoint())}
                  placeholder="e.g., searchBreaches"
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Button type="button" onClick={addEndpoint} className="bg-slate-700 hover:bg-slate-600">
                  Add
                </Button>
              </div>
              {formData.allowed_endpoints.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.allowed_endpoints.map((endpoint) => (
                    <div key={endpoint} className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded">
                      <span className="text-sm text-white">{endpoint}</span>
                      <button
                        type="button"
                        onClick={() => removeEndpoint(endpoint)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-slate-200">Rate Limit (calls/min, 0 = unlimited)</Label>
            <Input
              type="number"
              min="0"
              value={formData.rate_limit}
              onChange={(e) => setFormData({ ...formData, rate_limit: parseInt(e.target.value) || 0 })}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
            <Label className="text-slate-200">Enabled</Label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="border-slate-700">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}