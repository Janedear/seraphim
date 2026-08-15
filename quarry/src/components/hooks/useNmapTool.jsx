import { useState, useCallback } from 'react';
import { api } from '@/api/client';
import { toast } from 'sonner';

export const useNmapTool = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);

  const executeScan = useCallback(async (target, profile = 'basic') => {
    if (!target || target.trim() === '') {
      setScanError('Target is required');
      return null;
    }

    setIsScanning(true);
    setScanError(null);
    setScanResult(null);

    try {
      const response = await api.functions.invoke('nmapScan', {
        target: target.trim(),
        profile,
        timeout: 300,
      });

      if (response.data?.success === false) {
        throw new Error(response.data?.error || 'Scan failed');
      }

      const result = response.data;
      setScanResult(result);
      setScanHistory((prev) => [result, ...prev.slice(0, 9)]);
      toast.success(`Scan completed for ${target}`);

      return result;
    } catch (error) {
      const message = error?.response?.data?.error || error.message || 'Scan failed';
      setScanError(message);
      toast.error(message);
      return null;
    } finally {
      setIsScanning(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setScanResult(null);
    setScanError(null);
  }, []);

  const clearHistory = useCallback(() => {
    setScanHistory([]);
  }, []);

  return {
    executeScan,
    isScanning,
    scanResult,
    scanError,
    scanHistory,
    clearResult,
    clearHistory,
  };
};