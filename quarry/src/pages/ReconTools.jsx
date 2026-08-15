import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { Globe, Search, Zap, Copy, Server } from "lucide-react";
import { toast } from "sonner";
import NmapScanButton from '@/components/network/NmapScanButton';
import { api } from '@/api/client';

export default function ReconTools() {
  const [domain, setDomain] = useState('');
  const [ip, setIp] = useState('');
  const [results, setResults] = useState('');
  const [loading, setLoading] = useState(false);

  const performLookup = async (type) => {
    const target = domain?.trim() || ip?.trim();
    if (!target) {
      toast.error('Enter a domain or IP');
      return;
    }
    setLoading(true);
    setResults('');
    try {
      const result = await api.functions.invoke('reconLookup', { type, target });
      const data = result?.data ?? result;
      if (data?.success && data?.data) {
        const header = type === 'whois' ? `WHOIS Information for ${target}\n\n` :
          type === 'dns' ? `DNS Records for ${target}\n\n` :
          type === 'subdomain' ? `Subdomain Enumeration for ${target}\n\n` :
          `SSL Certificate Information for ${target}\n\n`;
        setResults(header + data.data);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} lookup completed`);
      } else {
        setResults(data?.error || 'Lookup failed');
        toast.error(data?.error || 'Lookup failed');
      }
    } catch (err) {
      setResults(`Error: ${err?.message || 'Request failed'}`);
      toast.error(err?.message || 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const performWhois = () => performLookup('whois');
  const performDNS = () => performLookup('dns');
  const performSubdomainEnum = () => performLookup('subdomain');
  const performSSL = () => performLookup('ssl');

  const copy = () => {
    navigator.clipboard.writeText(results);
    toast.success('Copied to clipboard');
  };

  const handleNmapComplete = (result) => {
    if (!result) return;
    const target = result.target || domain || ip || 'target';
    setResults(`
Nmap Scan Results for ${target}
Profile: ${result.profile_name || 'basic'}
Scan ID: ${result.scan_id || 'N/A'}

${JSON.stringify(result.data ?? result, null, 2)}
    `);
    toast.success(`Nmap scan completed for ${target}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reconnaissance Tools"
        description="OSINT and information gathering utilities"
      />

      <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Target Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Domain Name</label>
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                placeholder="example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">IP Address</label>
              <Input
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                placeholder="93.184.216.34"
              />
            </div>
          </div>
          <NmapScanButton
            target={ip || domain}
            onScanComplete={handleNmapComplete}
            variant="outline"
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="whois" className="space-y-4">
        <TabsList className="bg-black/40 border border-red-500/30">
          <TabsTrigger value="whois" className="data-[state=active]:bg-red-600">WHOIS</TabsTrigger>
          <TabsTrigger value="dns" className="data-[state=active]:bg-red-600">DNS Lookup</TabsTrigger>
          <TabsTrigger value="subdomain" className="data-[state=active]:bg-red-600">Subdomains</TabsTrigger>
          <TabsTrigger value="ssl" className="data-[state=active]:bg-red-600">SSL/TLS</TabsTrigger>
          <TabsTrigger value="tools" className="data-[state=active]:bg-red-600">CLI Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="whois">
          <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white">WHOIS Lookup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={performWhois}
                disabled={!domain || loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700"
              >
                {loading ? <Search className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                Perform WHOIS Lookup
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dns">
          <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white">DNS Records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={performDNS}
                disabled={!domain || loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700"
              >
                {loading ? <Search className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                Lookup DNS Records
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subdomain">
          <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white">Subdomain Enumeration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={performSubdomainEnum}
                disabled={!domain || loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700"
              >
                {loading ? <Search className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                Enumerate Subdomains
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ssl">
          <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white">SSL/TLS Certificate Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={performSSL}
                disabled={!domain || loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700"
              >
                {loading ? <Search className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                Analyze SSL Certificate
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools">
          <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Server className="w-5 h-5" />
                CLI Reconnaissance Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-xs">
                <p className="text-slate-300 font-semibold mb-2">DNS Enumeration:</p>
                <div className="p-2 bg-slate-900 rounded font-mono text-green-400">dig example.com ANY</div>
                <div className="p-2 bg-slate-900 rounded font-mono text-green-400">nslookup example.com</div>
                <div className="p-2 bg-slate-900 rounded font-mono text-green-400">host -a example.com</div>
                
                <p className="text-slate-300 font-semibold mt-4 mb-2">Subdomain Discovery:</p>
                <div className="p-2 bg-slate-900 rounded font-mono text-green-400">amass enum -d example.com</div>
                <div className="p-2 bg-slate-900 rounded font-mono text-green-400">subfinder -d example.com</div>
                <div className="p-2 bg-slate-900 rounded font-mono text-green-400">assetfinder --subs-only example.com</div>
                
                <p className="text-slate-300 font-semibold mt-4 mb-2">WHOIS Lookup:</p>
                <div className="p-2 bg-slate-900 rounded font-mono text-green-400">whois example.com</div>
                
                <p className="text-slate-300 font-semibold mt-4 mb-2">Certificate Transparency:</p>
                <div className="p-2 bg-slate-900 rounded font-mono text-green-400">curl "https://crt.sh/?q=example.com&output=json"</div>
                
                <p className="text-slate-300 font-semibold mt-4 mb-2">Reverse IP Lookup:</p>
                <div className="p-2 bg-slate-900 rounded font-mono text-green-400">nmap --script hostmap-crtsh example.com</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {results && (
        <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Results</CardTitle>
            <Button onClick={copy} variant="outline" size="sm" className="border-slate-700 text-white">
              <Copy className="w-3 h-3 mr-2" />
              Copy
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea
              value={results}
              readOnly
              className="min-h-[400px] font-mono text-sm bg-slate-900 border-slate-700 text-green-400"
            />
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800/50 border-amber-600/30">
        <CardContent className="pt-4">
          <p className="text-xs text-amber-400">
            ⚠️ Only perform reconnaissance on targets you're authorized to investigate. Respect privacy laws and boundaries.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}