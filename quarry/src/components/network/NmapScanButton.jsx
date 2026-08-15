import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Network } from 'lucide-react';
import { useNmapTool } from '@/components/hooks/useNmapTool';
import { toast } from 'sonner';

const SCAN_PROFILES = [
  { value: 'basic', label: 'Basic' },
  { value: 'standard', label: 'Standard' },
  { value: 'deep', label: 'Deep' },
  { value: 'aggressive', label: 'Aggressive' },
];

export default function NmapScanButton({ target, onScanComplete, variant = 'default' }) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState('basic');
  const { executeScan, isScanning } = useNmapTool();

  const handleScan = async () => {
    if (!target || target.trim() === '') {
      toast.error('Target is required');
      return;
    }

    const result = await executeScan(target.trim(), profile);
    if (result) {
      setOpen(false);
      onScanComplete?.(result);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm" className="gap-2">
          <Network className="w-4 h-4" />
          Nmap Scan
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Network Scan</DialogTitle>
          <DialogDescription className="text-slate-400">
            Scan {target || 'target'} with Nmap
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-300 font-medium">Scan Profile</label>
            <Select value={profile} onValueChange={setProfile} disabled={isScanning}>
              <SelectTrigger className="border-slate-700 bg-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {SCAN_PROFILES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleScan}
            disabled={isScanning}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              'Execute Scan'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}