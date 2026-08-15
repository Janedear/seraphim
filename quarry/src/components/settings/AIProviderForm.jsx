import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

export default function AIProviderForm({ provider, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    provider_type: 'openai',
    model_id: '',
    api_base_url: '',
    api_key_ref: '',
    temperature: 0.7,
    max_tokens: 2000,
    description: '',
    use_cases: [],
  });

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name || '',
        provider_type: provider.provider_type || 'openai',
        model_id: provider.model_id || '',
        api_base_url: provider.api_base_url || '',
        api_key_ref: provider.api_key_ref || '',
        temperature: provider.temperature || 0.7,
        max_tokens: provider.max_tokens || 2000,
        description: provider.description || '',
        use_cases: provider.use_cases || [],
      });
    }
  }, [provider]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const toggleUseCase = (useCase) => {
    setFormData((prev) => ({
      ...prev,
      use_cases: prev.use_cases.includes(useCase)
        ? prev.use_cases.filter((u) => u !== useCase)
        : [...prev.use_cases, useCase],
    }));
  };

  const useCaseOptions = ['chat', 'analysis', 'reporting', 'code_generation', 'content_creation'];

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">
              {provider ? 'Edit AI Provider' : 'Add New AI Provider'}
            </CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              Configure a new LLM provider or update existing settings
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
              <Label className="text-slate-200">Provider Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., GPT-4 Analysis"
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Provider Type *</Label>
              <Select value={formData.provider_type} onValueChange={(value) => setFormData({ ...formData, provider_type: value })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Model ID *</Label>
              <Input
                value={formData.model_id}
                onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
                placeholder="e.g., gpt-4-turbo"
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">API Key Reference *</Label>
              <Input
                value={formData.api_key_ref}
                onChange={(e) => setFormData({ ...formData, api_key_ref: e.target.value })}
                placeholder="e.g., OPENAI_API_KEY"
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">API Base URL *</Label>
            <Input
              value={formData.api_base_url}
              onChange={(e) => setFormData({ ...formData, api_base_url: e.target.value })}
              placeholder="https://api.openai.com/v1"
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Temperature</Label>
              <Input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Max Tokens</Label>
              <Input
                type="number"
                min="1"
                value={formData.max_tokens}
                onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Purpose and notes for this AI configuration"
              className="bg-slate-800 border-slate-700 text-white"
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-slate-200">Use Cases</Label>
            <div className="grid grid-cols-2 gap-3">
              {useCaseOptions.map((useCase) => (
                <label key={useCase} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.use_cases.includes(useCase)}
                    onChange={() => toggleUseCase(useCase)}
                    className="rounded border-slate-600 bg-slate-800"
                  />
                  <span className="text-sm text-slate-300 capitalize">{useCase.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? 'Saving...' : provider ? 'Update Provider' : 'Create Provider'}
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