import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { Terminal } from "lucide-react";
import NmapScanner from '@/components/network/NmapScanner';

export default function NetworkScanner() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Network Scanner"
        description="Port scanning and network reconnaissance via nmap.online API"
      />

      <NmapScanner team="red" />

      <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
        <CardHeader>
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            Common Nmap Commands (Reference)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-slate-300 font-mono">
          <div className="p-2 bg-slate-900 rounded">nmap -p- -T4 target.com <span className="text-slate-500"># Full port scan</span></div>
          <div className="p-2 bg-slate-900 rounded">nmap -sS -sV target.com <span className="text-slate-500"># Stealth SYN scan with version detection</span></div>
          <div className="p-2 bg-slate-900 rounded">nmap -O target.com <span className="text-slate-500"># OS detection</span></div>
          <div className="p-2 bg-slate-900 rounded">nmap --script vuln target.com <span className="text-slate-500"># Vulnerability scan</span></div>
          <div className="p-2 bg-slate-900 rounded">nmap -sU --top-ports 20 target.com <span className="text-slate-500"># UDP scan</span></div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-amber-600/30">
        <CardContent className="pt-4">
          <p className="text-xs text-amber-400">
            ⚠️ Only scan networks and systems you have permission to test. Unauthorized scanning is illegal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}