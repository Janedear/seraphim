import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  Target,
  Crosshair,
  Shield,
  Key,
  Mail,
  User,
  Phone,
  Globe,
  Hash } from
"lucide-react";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { toast } from "sonner";
import { api } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

const fieldIcons = {
  email: Mail,
  username: User,
  password: Key,
  name: User,
  phone: Phone,
  ip: Globe,
  discordid: Hash,
  uuid: Hash,
  domain: Globe,
  steamid: Hash
};

export default function BreachRecon() {
  const { user } = useAuth();
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [form, setForm] = useState({
    term: '',
    fields: ['email'],
    wildcard: false,
    case_sensitive: false
  });

  const handleSearch = async () => {
    if (!form.term.trim()) {
      toast.error('Enter a search term');
      return;
    }

    if (form.fields.length === 0) {
      toast.error('Select at least one field');
      return;
    }

    setSearching(true);
    setResults(null);

    try {
      const result = await api.functions.invoke('searchBreaches', {
        term: form.term,
        fields: form.fields,
        wildcard: form.wildcard,
        case_sensitive: form.case_sensitive
      });
      const data = result?.data ?? result;

      setResults(data);

      // Add to search history
      setSearchHistory((prev) => [{
        term: form.term,
        fields: form.fields,
        count: data?.count ?? 0,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 10));

      if (data?.success && (data?.count ?? 0) > 0) {
        toast.success(`💀 ${data.count} breach record(s) compromised`);
      } else if (data?.success && (data?.count ?? 0) === 0) {
        toast.info('🔍 Target not in breach databases');
      }
    } catch (error) {
      toast.error('Search failed: ' + error.message);
      setResults({ success: false, error: error.message });
    } finally {
      setSearching(false);
    }
  };

  const toggleField = (field) => {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.includes(field) ?
      prev.fields.filter((f) => f !== field) :
      [...prev.fields, field]
    }));
  };

  const quickSearch = (historyItem) => {
    setForm({
      ...form,
      term: historyItem.term,
      fields: historyItem.fields
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="BREACH INTELLIGENCE RECON"
        description="Credential harvesting and target enumeration through global breach databases" />


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Search Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Banner */}
          <Card className="bg-black/40 border-red-500/50 shadow-[0_0_40px_rgba(255,50,50,0.2)] backdrop-blur-md">
            <CardContent className="pt-6 p-6 opacity-55">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-red-500/20 border border-red-500/50 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-xl">
                  <Database className="w-7 h-7 text-red-400 drop-shadow-lg" />
                </div>
                <div>
                  <p className="font-bold text-base mb-2 text-red-300 tracking-tight uppercase text-[13px] tracking-[0.1em]">
                    BreachVIP Database Access
                  </p>
                  <p className="text-sm text-slate-100 leading-relaxed font-light">
                    Query compromised credentials across multiple breach sources. Use wildcard operators (* and ?) for pattern matching.
                    Rate limited to 15 requests per minute. Results capped at 10,000 records per query.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Interface */}
          <Card className="bg-black/40 border-red-500/50 shadow-[0_0_30px_rgba(255,50,50,0.2)] backdrop-blur-md">
            <CardHeader className="p-6 opacity-50 flex flex-col space-y-1.5">
              <CardTitle className="text-lg font-bold tracking-tight uppercase text-[15px] tracking-[0.08em] text-red-300">
                Target Query Interface
              </CardTitle>
              <CardDescription className="text-slate-200 font-medium">
                Multi-field breach reconnaissance and credential intelligence gathering
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <div>
                <Label className="text-slate-300 mb-2 block font-semibold">Search Term</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={form.wildcard ? "e.g., *@target.com, admin*, user?" : "e.g., target@company.com, username123"}
                    value={form.term}
                    onChange={(e) => setForm({ ...form, term: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="bg-black/60 border-red-500/40 text-white placeholder:text-slate-500 flex-1 focus:border-red-500/60" />

                  <Button
                    onClick={handleSearch}
                    disabled={searching}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 shadow-lg">

                    <Search className="w-4 h-4 mr-2" />
                    {searching ? 'Searching...' : 'Execute'}
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-xs text-slate-400">
                    Wildcards: <code className="bg-slate-800 px-1 py-0.5 rounded">*</code> (zero or more), 
                    <code className="bg-slate-800 px-1 py-0.5 rounded ml-1">?</code> (one char)
                  </p>
                </div>
              </div>

              {/* Field Selection */}
              <div>
                <Label className="text-slate-300 mb-3 block font-semibold">Search Fields ({form.fields.length} selected)</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {Object.keys(fieldIcons).map((field) => {
                    const Icon = fieldIcons[field];
                    return (
                      <Button
                        key={field}
                        size="sm"
                        onClick={() => toggleField(field)}
                        className={cn(
                          "transition-all",
                          form.fields.includes(field) ?
                          "bg-red-500/30 text-red-200 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]" :
                          "bg-slate-800/50 text-slate-400 border-slate-600 hover:border-red-500/40 hover:text-red-300"
                        )}>

                        <Icon className="w-3 h-3 mr-1" />
                        {field}
                      </Button>);

                  })}
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                  <input
                    type="checkbox"
                    id="wildcard"
                    checked={form.wildcard}
                    onChange={(e) => setForm({ ...form, wildcard: e.target.checked })}
                    className="w-4 h-4 rounded bg-black/60 border-red-500/50" />

                  <Label htmlFor="wildcard" className="text-slate-300 cursor-pointer font-medium">
                    Wildcard Matching
                  </Label>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                  <input
                    type="checkbox"
                    id="case_sensitive"
                    checked={form.case_sensitive}
                    onChange={(e) => setForm({ ...form, case_sensitive: e.target.checked })}
                    className="w-4 h-4 rounded bg-black/60 border-red-500/50" />

                  <Label htmlFor="case_sensitive" className="text-slate-300 cursor-pointer font-medium">
                    Case Sensitive
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {results &&
          <Card className={cn(
            "backdrop-blur-md border-2",
            results.success && results.count > 0 ?
            "bg-red-950/40 border-red-500/60 shadow-[0_0_50px_rgba(239,68,68,0.4)]" :
            "bg-slate-950/40 border-slate-600/50 shadow-[0_0_30px_rgba(100,116,139,0.2)]"
          )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                    {results.success && results.count > 0 ?
                  <>
                        <Target className="w-6 h-6 text-red-400" />
                        Target Compromised: {results.count} Record{results.count !== 1 ? 's' : ''}
                      </> :
                  results.success ?
                  <>
                        <CheckCircle2 className="w-6 h-6 text-slate-400" />
                        No Intelligence Found
                      </> :

                  <>
                        <AlertTriangle className="w-6 h-6 text-amber-400" />
                        Query Error
                      </>
                  }
                  </CardTitle>
                  <Badge className={cn(
                  "px-3 py-1 text-sm font-bold",
                  results.success && results.count > 0 ?
                  "bg-red-500/30 text-red-300 border border-red-500/50" :
                  "bg-slate-500/30 text-slate-300 border border-slate-500/50"
                )}>
                    {results.success ?
                  results.count > 0 ? 'EXPLOITABLE' : 'NOT FOUND' :
                  'FAILED'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                {results.error ?
              <div className="p-4 bg-red-900/30 rounded-lg border border-red-500/50">
                    <p className="text-red-300 font-mono text-sm">{results.error}</p>
                  </div> :
              results.results?.map((result, idx) =>
              <div key={idx} className="p-4 bg-slate-900/70 rounded-lg border border-red-500/30 hover:border-red-500/60 transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Crosshair className="w-4 h-4 text-red-400" />
                          <p className="font-bold text-white">Source: {result.source || 'Unknown Breach'}</p>
                        </div>
                        <p className="text-xs text-slate-400">Category: {result.categories || 'General Breach'}</p>
                      </div>
                      <Badge variant="outline" className="text-red-400 border-red-500/50 font-mono">
                        #{String(idx + 1).padStart(3, '0')}
                      </Badge>
                    </div>
                    {result.data &&
                <div className="mt-3 p-3 bg-black/60 rounded border border-red-900/40">
                        <p className="text-xs font-bold text-red-400 mb-2 uppercase tracking-wider">Compromised Data</p>
                        <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-all">
                    {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                }
                  </div>
              ) || null}
                
                {results.success && results.count === 0 &&
              <div className="p-6 bg-slate-900/40 rounded-lg border border-slate-600/40 text-center">
                    <Shield className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-300 font-semibold mb-2">
                      Target Not Found in Breach Databases
                    </p>
                    <p className="text-sm text-slate-400">
                      Consider alternative reconnaissance vectors: OSINT, social engineering, or network scanning.
                    </p>
                  </div>
              }
              </CardContent>
            </Card>
          }
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="bg-black/40 border-red-500/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-red-300 uppercase tracking-wider">
                Session Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-400 text-sm">Queries</span>
                <span className="text-white font-bold">{searchHistory.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-400 text-sm">Compromised</span>
                <span className="text-red-400 font-bold">
                  {searchHistory.reduce((acc, h) => acc + h.count, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-400 text-sm">Rate Limit</span>
                <span className="text-amber-400 font-bold text-xs">15/min</span>
              </div>
            </CardContent>
          </Card>

          {/* Search History */}
          {searchHistory.length > 0 &&
          <Card className="bg-black/40 border-red-500/50 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-red-300 uppercase tracking-wider">
                  Recent Queries
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                {searchHistory.map((item, idx) =>
              <button
                key={idx}
                onClick={() => quickSearch(item)}
                className="w-full p-3 bg-slate-900/50 hover:bg-slate-900/70 rounded-lg border border-slate-700 hover:border-red-500/40 transition-all text-left group">

                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-mono text-white truncate group-hover:text-red-300 transition-colors">
                        {item.term}
                      </p>
                      <Badge variant="outline" className={cn(
                    "text-xs",
                    item.count > 0 ? "text-red-400 border-red-500/50" : "text-slate-400"
                  )}>
                        {item.count}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">
                        {item.fields.join(', ')}
                      </p>
                      <p className="text-xs text-slate-500">{item.timestamp}</p>
                    </div>
                  </button>
              )}
              </CardContent>
            </Card>
          }

          {/* Quick Guide */}
          <Card className="bg-black/40 border-red-500/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-red-300 uppercase tracking-wider">
                Tactical Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              <div>
                <p className="font-semibold text-white mb-1">Domain Enumeration</p>
                <p className="text-xs text-slate-400">*@target.com with email field</p>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Username Patterns</p>
                <p className="text-xs text-slate-400">admin*, root*, user? with username field</p>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Multi-Field Intel</p>
                <p className="text-xs text-slate-400">Select multiple fields for broader coverage</p>
              </div>
              <div className="pt-2 border-t border-red-900/30">
                <p className="text-xs text-amber-400 font-semibold">⚠️ OPSEC Notice</p>
                <p className="text-xs text-slate-400 mt-1">
                  15 queries/min rate limit. Use precise patterns to maximize intelligence yield.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);

}