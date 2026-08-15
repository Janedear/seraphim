import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Loader2, Network, Trash2, Copy, Check } from 'lucide-react';
import { useNmapTool } from '@/components/hooks/useNmapTool';
import { cn } from '@/lib/utils';

const SCAN_PROFILES = [
  { value: 'basic', label: 'Basic (Common ports)', description: 'Scans ports 80, 443, 22' },
  {
    value: 'standard',
    label: 'Standard (Service detection)',
    description: 'Service version & default scripts',
  },
  {
    value: 'deep',
    label: 'Deep (OS & vulnerabilities)',
    description: 'OS detection + vulnerability scripts',
  },
  {
    value: 'aggressive',
    label: 'Aggressive (Full scan)',
    description: 'Comprehensive with timing -T4',
  },
];

export default function NmapScanner({ team = 'blue' }) {
  const [target, setTarget] = useState('');
  const [profile, setProfile] = useState('basic');
  const [copied, setCopied] = useState(false);
  const { executeScan, isScanning, scanResult, scanError, scanHistory, clearResult, clearHistory } =
    useNmapTool();

  const handleScan = async () => {
    await executeScan(target, profile);
  };

  const handleCopyResult = () => {
    if (scanResult?.data) {
      navigator.clipboard.writeText(JSON.stringify(scanResult.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const accentColor = team === 'blue' ? 'cyan' : 'red';
  const borderClass = accentColor === 'cyan' ? 'border-cyan-500/50' : 'border-red-500/50';
  const bgClass = accentColor === 'cyan' ? 'bg-cyan-500/20' : 'bg-red-500/20';
  const textClass = accentColor === 'cyan' ? 'text-cyan-400' : 'text-red-400';
  const accentBg = accentColor === 'cyan' ? 'bg-cyan-500/20' : 'bg-red-500/20';

  return (
    <div className="space-y-6">
      {/* Scanner Input Card */}
      <Card className={cn('bg-black/40 backdrop-blur-md', borderClass)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Network className={`w-5 h-5 ${textClass}`} />
            Nmap Network Scanner
          </CardTitle>
          <CardDescription className="text-slate-400">
            Execute network reconnaissance scans with configurable profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target" className="text-slate-300">
              Target (IP, hostname, or CIDR range)
            </Label>
            <Input
              id="target"
              placeholder="e.g., 192.168.1.0/24, example.com, 8.8.8.8"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              disabled={isScanning}
              className="border-slate-700 bg-slate-900/50"
              onKeyDown={(e) => e.key === 'Enter' && !isScanning && handleScan()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile" className="text-slate-300">
              Scan Profile
            </Label>
            <Select value={profile} onValueChange={setProfile} disabled={isScanning}>
              <SelectTrigger className="border-slate-700 bg-slate-900/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {SCAN_PROFILES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <div>
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="text-xs text-slate-400">{p.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {scanError && (
            <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-300">Scan Error</p>
                <p className="text-xs text-red-200 mt-1">{scanError}</p>
              </div>
            </div>
          )}

          <Button
            onClick={handleScan}
            disabled={isScanning || !target.trim()}
            className={cn(
              'w-full font-semibold',
              accentColor === 'cyan'
                ? 'bg-cyan-600 hover:bg-cyan-700'
                : 'bg-red-600 hover:bg-red-700'
            )}
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
        </CardContent>
      </Card>

      {/* Scan Result Card */}
      {scanResult && (
        <Card className={cn('bg-black/40 backdrop-blur-md', borderClass)}>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-white">Scan Results</CardTitle>
              <CardDescription className="text-slate-400">
                {scanResult.profile_name} • {scanResult.target}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCopyResult} className="gap-2">
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {scanResult.data ? (
              <div className="space-y-3">
                {scanResult.data.ports && scanResult.data.ports.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200 mb-2">Open Ports</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {scanResult.data.ports.map((port, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg"
                        >
                          <p className={`text-sm font-mono font-bold ${textClass}`}>
                            {port.port}/{port.protocol}
                          </p>
                          <p className="text-xs text-slate-400">{port.service || 'unknown'}</p>
                          {port.version && (
                            <p className="text-xs text-slate-500 mt-1">{port.version}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg text-center">
                    <p className="text-sm text-slate-400">No open ports detected</p>
                  </div>
                )}

                {scanResult.data.os && (
                  <div className={cn('p-3 rounded-lg border', accentBg, borderClass)}>
                    <p className="text-xs font-semibold text-slate-400 mb-1">OS Detection</p>
                    <p className="text-sm text-slate-200">{scanResult.data.os}</p>
                  </div>
                )}

                {scanResult.data.hostnames && scanResult.data.hostnames.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-2">Hostnames</p>
                    <div className="flex flex-wrap gap-2">
                      {scanResult.data.hostnames.map((hostname, idx) => (
                        <span key={idx} className="px-2 py-1 bg-slate-800 text-xs rounded text-slate-300">
                          {hostname}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-slate-500 border-t border-slate-700 pt-3">
                  <p>Scan completed: {new Date(scanResult.started_at).toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-8 bg-slate-800" />
                <Skeleton className="h-8 bg-slate-800" />
              </div>
            )}

            <Button variant="outline" size="sm" onClick={clearResult} className="w-full">
              Clear Results
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card className={cn('bg-black/40 backdrop-blur-md', borderClass)}>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-white text-base">Scan History</CardTitle>
              <CardDescription className="text-slate-400">Recent scans ({scanHistory.length})</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {scanHistory.map((scan, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-800/30 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors cursor-pointer"
                  onClick={() => {
                    setScanResult(scan);
                    setTarget(scan.target);
                    setProfile(scan.profile);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-200">{scan.target}</p>
                      <p className="text-xs text-slate-500">{scan.profile_name}</p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(scan.started_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}