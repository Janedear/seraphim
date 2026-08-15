import { useEffect, useState, useCallback } from 'react';
import { api } from '@/api/client';
import { logger } from '@/lib/monitoring';

export function useAgentCustomization(userEmail) {
  const [customization, setCustomization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCustomization = useCallback(async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await api.entities.AgentCustomization.filter({
        agent_email: userEmail,
      });

      if (result.length > 0) {
        setCustomization(result[0]);
      } else {
        // Create default customization if none exists
        const defaults = {
          agent_email: userEmail,
          theme_mode: 'auto',
          card_opacity: 0.2,
          text_contrast: 'normal',
          background_type: 'default',
          background_opacity: 0.2,
          background_blur: 0,
        };
        const created = await api.entities.AgentCustomization.create(defaults);
        setCustomization(created);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load customization:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    loadCustomization();
  }, [loadCustomization]);

  const updateCustomization = useCallback(
    async (updates) => {
      if (!customization?.id) return;

      try {
        const updated = await api.entities.AgentCustomization.update(
          customization.id,
          {
            ...updates,
            last_updated: new Date().toISOString(),
          }
        );
        setCustomization(updated);
        return updated;
      } catch (err) {
        logger.error('Failed to update customization:', err);
        setError(err.message);
        throw err;
      }
    },
    [customization?.id]
  );

  const resetCustomization = useCallback(async () => {
    if (!customization?.id) return;

    try {
      const defaults = {
        theme_mode: 'auto',
        primary_accent_color: undefined,
        secondary_accent_color: undefined,
        card_opacity: 0.2,
        text_contrast: 'normal',
        background_type: 'default',
        background_file_url: undefined,
        background_opacity: 0.2,
        background_blur: 0,
        background_overlay_color: undefined,
        dashboard_layout: [],
      };
      const reset = await updateCustomization(defaults);
      return reset;
    } catch (err) {
      logger.error('Failed to reset customization:', err);
      throw err;
    }
  }, [customization?.id, updateCustomization]);

  return {
    customization,
    loading,
    error,
    updateCustomization,
    resetCustomization,
  };
}