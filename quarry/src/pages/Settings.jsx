import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Settings as SettingsIcon, Palette, Image as ImageIcon, Layout as LayoutIcon, Plug } from 'lucide-react';
import PageHeader from '@/components/ui-custom/PageHeader';
import AIProviderManager from '@/components/settings/AIProviderManager';
import MCPAccessManager from '@/components/settings/MCPAccessManager';
import ThemeCustomizer from '@/components/settings/ThemeCustomizer';
import BackgroundCustomizer from '@/components/settings/BackgroundCustomizer';
import DashboardLayoutCustomizer from '@/components/settings/DashboardLayoutCustomizer';
import { useAgentCustomization } from '@/components/hooks/useAgentCustomization';
import { useIntegrationOnboarding } from '@/components/hooks/useIntegrationOnboarding';
import { toast } from 'sonner';
import { logger } from '@/lib/monitoring';

export default function Settings() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await api.auth.me();
        setUser(currentUser);
      } catch (error) {
        logger.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  const { data: aiProviders = [] } = useQuery({
    queryKey: ['aiProviders'],
    queryFn: () => api.entities.AIProvider.list(),
  });

  const { data: mcpRules = [] } = useQuery({
    queryKey: ['mcpRules'],
    queryFn: () => api.entities.MCPAccessRule.list(),
  });

  const { customization, loading: custLoading, updateCustomization, resetCustomization } = useAgentCustomization(user?.email);
  const { resetOnboarding } = useIntegrationOnboarding();

  const handleCustomizationUpdate = async (updates) => {
    try {
      await updateCustomization(updates);
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const handleResetCustomization = async () => {
    try {
      await resetCustomization();
      toast.success('Settings reset to defaults');
    } catch (error) {
      toast.error('Failed to reset settings');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <PageHeader
          title="Settings & Configuration"
          description="Manage AI providers, theme customization, and account preferences"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Settings' }
          ]}
        />

        <Tabs defaultValue="ai-providers" className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-slate-900 border border-slate-800">
            <TabsTrigger value="ai-providers" className="gap-2">
              <SettingsIcon className="w-4 h-4" />
              AI Providers
            </TabsTrigger>
            <TabsTrigger value="mcp-access" className="gap-2">
              <SettingsIcon className="w-4 h-4" />
              MCP Access
            </TabsTrigger>
            <TabsTrigger value="theme" className="gap-2">
              <Palette className="w-4 h-4" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="background" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Background
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutIcon className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Plug className="w-4 h-4" />
              Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai-providers" className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400">
                Configure AI providers and model endpoints. API keys are staged securely and never exposed in the UI.
              </p>
            </div>
            <AIProviderManager providers={aiProviders} user={user} />
          </TabsContent>

          <TabsContent value="mcp-access" className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400">
                Define which MCP endpoints and tool categories each AI provider can access. Permissions are granular and can be modified without redeploying.
              </p>
            </div>
            <MCPAccessManager rules={mcpRules} providers={aiProviders} user={user} />
          </TabsContent>

          <TabsContent value="theme" className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400">
                Customize your dashboard theme with custom colors, opacity, and contrast settings. These are applied only to your account.
              </p>
            </div>
            {!custLoading && customization && (
              <ThemeCustomizer
                customization={customization}
                onUpdate={handleCustomizationUpdate}
                isLoading={custLoading}
              />
            )}
          </TabsContent>

          <TabsContent value="background" className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400">
                Upload custom background images or videos. You can adjust opacity, blur, and overlay colors to ensure readability.
              </p>
            </div>
            {!custLoading && customization && (
              <BackgroundCustomizer
                customization={customization}
                onUpdate={handleCustomizationUpdate}
                isLoading={custLoading}
              />
            )}
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400">
                Customize your dashboard by showing/hiding widgets and arranging them in your preferred order.
              </p>
            </div>
            {!custLoading && customization && (
              <DashboardLayoutCustomizer
                customization={customization}
                onUpdate={handleCustomizationUpdate}
                isLoading={custLoading}
              />
            )}
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400">
                Configure API keys and Seraphim data entities for Malware Sandbox, OSINT, Attack Simulations, and more.
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/IntegrationSetup">
                <Button variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10">
                  Open Integration Setup Guide
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
                onClick={() => {
                  resetOnboarding();
                  toast.success('Setup tour will show on next page load');
                  window.location.reload();
                }}
              >
                Restart Setup Tour
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {!custLoading && customization && (
          <div className="flex gap-3 pt-6 border-t border-slate-800">
            <Button
              onClick={handleResetCustomization}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:text-white"
            >
              Reset All Customizations
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}