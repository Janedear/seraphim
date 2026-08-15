import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { Search, ExternalLink, Copy, Sparkles, Target, FileType, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function GoogleDorking() {
  const [target, setTarget] = useState('');
  const [customDork, setCustomDork] = useState('');
  const [smartMode, setSmartMode] = useState(true);
  const [keywords, setKeywords] = useState('');
  const [fileTypes, setFileTypes] = useState([]);
  const [exclusions, setExclusions] = useState('');
  const [generatedDork, setGeneratedDork] = useState('');

  const dorkCategories = {
    files: [
      { name: 'PDF Files', dork: 'site:{target} filetype:pdf' },
      { name: 'Excel Files', dork: 'site:{target} filetype:xlsx OR filetype:xls' },
      { name: 'Word Docs', dork: 'site:{target} filetype:doc OR filetype:docx' },
      { name: 'SQL Files', dork: 'site:{target} filetype:sql' },
      { name: 'Config Files', dork: 'site:{target} filetype:conf OR filetype:config' },
      { name: 'Log Files', dork: 'site:{target} filetype:log' },
      { name: 'Backup Files', dork: 'site:{target} filetype:bak OR filetype:backup' },
      { name: 'Database Files', dork: 'site:{target} filetype:mdb OR filetype:db' }
    ],
    sensitive: [
      { name: 'Passwords', dork: 'site:{target} intext:"password" OR intext:"passwd"' },
      { name: 'API Keys', dork: 'site:{target} intext:"api_key" OR intext:"apikey"' },
      { name: 'Credentials', dork: 'site:{target} intext:"username" AND intext:"password"' },
      { name: 'Private Keys', dork: 'site:{target} "BEGIN RSA PRIVATE KEY" OR "BEGIN PRIVATE KEY"' },
      { name: 'Database Creds', dork: 'site:{target} intext:"db_password" OR intext:"database_password"' },
      { name: 'AWS Keys', dork: 'site:{target} "AKIA" OR "aws_secret_access_key"' },
      { name: 'Connection Strings', dork: 'site:{target} "connectionString" OR "jdbc:"' },
      { name: 'Auth Tokens', dork: 'site:{target} intext:"token" OR intext:"bearer"' }
    ],
    vulnerabilities: [
      { name: 'Directory Listing', dork: 'site:{target} intitle:"index of"' },
      { name: 'phpMyAdmin', dork: 'site:{target} inurl:phpmyadmin' },
      { name: 'Admin Panels', dork: 'site:{target} inurl:admin OR inurl:administrator' },
      { name: 'Login Pages', dork: 'site:{target} inurl:login OR intitle:"login"' },
      { name: 'Error Messages', dork: 'site:{target} "error" OR "warning" OR "fatal"' },
      { name: 'SQL Errors', dork: 'site:{target} "sql syntax" OR "mysql_fetch"' },
      { name: 'Git Exposed', dork: 'site:{target} inurl:.git' },
      { name: 'Env Files', dork: 'site:{target} inurl:.env OR filetype:env' }
    ],
    information: [
      { name: 'Email Addresses', dork: 'site:{target} "@{target}"' },
      { name: 'Employee Names', dork: 'site:linkedin.com "{target}"' },
      { name: 'Subdomains', dork: 'site:*.{target}' },
      { name: 'Social Media', dork: 'site:twitter.com OR site:facebook.com "{target}"' },
      { name: 'Documents', dork: 'site:{target} filetype:pdf OR filetype:doc OR filetype:ppt' },
      { name: 'Contact Info', dork: 'site:{target} "contact" OR "phone" OR "email"' },
      { name: 'Job Postings', dork: 'site:{target} "careers" OR "jobs" OR "hiring"' },
      { name: 'Press Releases', dork: 'site:{target} "press release" OR "news"' }
    ],
    technology: [
      { name: 'WordPress', dork: 'site:{target} inurl:wp-content OR inurl:wp-admin' },
      { name: 'Joomla', dork: 'site:{target} inurl:administrator "Joomla"' },
      { name: 'Drupal', dork: 'site:{target} "Powered by Drupal"' },
      { name: 'Jenkins', dork: 'site:{target} inurl:jenkins' },
      { name: 'Apache', dork: 'site:{target} "Apache Server Status"' },
      { name: 'Nginx', dork: 'site:{target} "nginx" intitle:"index of"' },
      { name: 'Docker', dork: 'site:{target} inurl:docker OR "docker"' },
      { name: 'Kubernetes', dork: 'site:{target} inurl:kubernetes OR "k8s"' }
    ],
    advanced: [
      { name: 'Open Redirects', dork: 'site:{target} inurl:redirect OR inurl:url=' },
      { name: 'File Upload', dork: 'site:{target} inurl:upload' },
      { name: 'Webcams', dork: 'site:{target} inurl:view/index.shtml' },
      { name: 'Network Devices', dork: 'site:{target} "Server: gSOAP" OR "Server: Virata-EmWeb"' },
      { name: 'PHP Info', dork: 'site:{target} "phpinfo()" OR intitle:"phpinfo"' },
      { name: 'Backup Files', dork: 'site:{target} inurl:backup OR filetype:bak' },
      { name: 'Test Pages', dork: 'site:{target} inurl:test OR intitle:"test page"' },
      { name: 'Staging Env', dork: 'site:staging.{target} OR site:dev.{target}' }
    ]
  };

  const commonFileTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'sql', 'log', 'bak', 'env', 'conf', 'config'];

  const generateSmartDork = () => {
    if (!target && !keywords && fileTypes.length === 0) {
      toast.error('Please provide at least a target domain or keywords');
      return;
    }

    let dorkParts = [];

    // Add target domain if provided
    if (target) {
      dorkParts.push(`site:${target}`);
    }

    // Add keywords
    if (keywords) {
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k);
      if (keywordList.length > 0) {
        const keywordQuery = keywordList.map(k => {
          // Auto-detect if it's a phrase vs single word
          if (k.includes(' ')) {
            return `"${k}"`;
          }
          return k;
        }).join(' OR ');
        dorkParts.push(`(${keywordQuery})`);
      }
    }

    // Add file types
    if (fileTypes.length > 0) {
      const fileTypeQuery = fileTypes.map(ft => `filetype:${ft}`).join(' OR ');
      dorkParts.push(`(${fileTypeQuery})`);
    }

    // Add exclusions
    if (exclusions) {
      const exclusionList = exclusions.split(',').map(e => e.trim()).filter(e => e);
      exclusionList.forEach(excl => {
        dorkParts.push(`-${excl}`);
      });
    }

    const finalDork = dorkParts.join(' ');
    setGeneratedDork(finalDork);
    toast.success('Smart dork generated');
  };

  useEffect(() => {
    if (smartMode && (target || keywords || fileTypes.length > 0)) {
      generateSmartDork();
    }
  }, [target, keywords, fileTypes, exclusions, smartMode]);

  const executeSearch = (dork) => {
    const query = dork.replace(/{target}/g, target);
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

  const copyDork = (dork) => {
    const query = dork.replace(/{target}/g, target);
    navigator.clipboard.writeText(query);
    toast.success('Copied to clipboard');
  };

  const toggleFileType = (type) => {
    setFileTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Google Dorking Intelligence"
        description="Advanced search operators with smart query generation for CTF and OSINT reconnaissance"
      />

      {/* Smart Dork Generator */}
      <Card className="bg-black/20 backdrop-blur-md border-red-500/40 shadow-[0_0_30px_rgba(255,50,50,0.2)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-400" />
              Smart Dork Generator
            </CardTitle>
            <Badge className={cn(
              "px-3 py-1",
              smartMode ? "bg-red-500/30 text-red-300 border-red-500/50" : "bg-slate-500/30 text-slate-300"
            )}>
              {smartMode ? 'Auto-Generate ON' : 'Manual Mode'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Target Domain */}
          <div className="space-y-2">
            <label className="text-sm text-slate-300 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Target Domain (optional)
            </label>
            <Input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="bg-slate-900/60 border-slate-700 text-white"
              placeholder="example.com or leave blank for global search"
            />
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <label className="text-sm text-slate-300 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Keywords (comma-separated)
            </label>
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="bg-slate-900/60 border-slate-700 text-white"
              placeholder="password, api_key, secret"
            />
            <p className="text-xs text-slate-500">Tip: Phrases with spaces are auto-quoted</p>
          </div>

          {/* File Types */}
          <div className="space-y-2">
            <label className="text-sm text-slate-300 flex items-center gap-2">
              <FileType className="w-4 h-4" />
              File Types (select multiple)
            </label>
            <div className="flex flex-wrap gap-2">
              {commonFileTypes.map(type => (
                <Button
                  key={type}
                  size="sm"
                  variant="outline"
                  onClick={() => toggleFileType(type)}
                  className={cn(
                    "transition-all",
                    fileTypes.includes(type)
                      ? "bg-red-500/30 text-red-200 border-red-500/50"
                      : "bg-slate-800/50 text-slate-400 border-slate-700"
                  )}
                >
                  .{type}
                </Button>
              ))}
            </div>
          </div>

          {/* Exclusions */}
          <div className="space-y-2">
            <label className="text-sm text-slate-300 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Exclusions (comma-separated)
            </label>
            <Input
              value={exclusions}
              onChange={(e) => setExclusions(e.target.value)}
              className="bg-slate-900/60 border-slate-700 text-white"
              placeholder="site:twitter.com, login, test"
            />
          </div>

          {/* Generated Dork */}
          {generatedDork && (
            <div className="space-y-2 pt-2 border-t border-slate-700">
              <label className="text-sm text-green-400 font-semibold">Generated Dork Query</label>
              <Textarea
                value={generatedDork}
                readOnly
                className="font-mono text-sm bg-slate-900 border-green-500/30 text-green-400 min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => executeSearch(generatedDork)}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Execute Search
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedDork);
                    toast.success('Copied');
                  }}
                  variant="outline"
                  className="border-slate-700 text-white"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Custom Dork Override */}
          <div className="space-y-2 pt-2 border-t border-slate-700">
            <label className="text-sm text-slate-300">Custom Dork Override</label>
            <div className="flex gap-2">
              <Input
                value={customDork}
                onChange={(e) => setCustomDork(e.target.value)}
                className="bg-slate-900/60 border-slate-700 text-white"
                placeholder="site:example.com filetype:pdf"
              />
              <Button
                onClick={() => customDork && window.open(`https://www.google.com/search?q=${encodeURIComponent(customDork)}`, '_blank')}
                className="bg-gradient-to-r from-red-600 to-red-700"
              >
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="files" className="space-y-4">
        <TabsList className="bg-black/60 border border-red-500/30 flex-wrap h-auto">
          <TabsTrigger value="files" className="data-[state=active]:bg-red-600">Files</TabsTrigger>
          <TabsTrigger value="sensitive" className="data-[state=active]:bg-red-600">Sensitive Data</TabsTrigger>
          <TabsTrigger value="vulnerabilities" className="data-[state=active]:bg-red-600">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="information" className="data-[state=active]:bg-red-600">Information</TabsTrigger>
          <TabsTrigger value="technology" className="data-[state=active]:bg-red-600">Technology</TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-red-600">Advanced</TabsTrigger>
        </TabsList>

        {Object.keys(dorkCategories).map((category) => (
          <TabsContent key={category} value={category}>
            <Card className="bg-black/20 backdrop-blur-md border-red-500/30">
              <CardHeader>
                <CardTitle className="text-white capitalize">{category} Dorks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dorkCategories[category].map((item, i) => (
                    <div key={i} className="p-3 bg-slate-900/60 rounded border border-slate-700 hover:border-red-500/50 transition-colors group">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-200">{item.name}</p>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyDork(item.dork)}
                            className="h-6 w-6 p-0 hover:bg-slate-800"
                          >
                            <Copy className="w-3 h-3 text-slate-400" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => executeSearch(item.dork)}
                            disabled={!target}
                            className="h-6 w-6 p-0 hover:bg-slate-800"
                          >
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-green-400 font-mono break-all">{item.dork}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="bg-black/20 backdrop-blur-md border-red-500/30">
        <CardHeader>
          <CardTitle className="text-white text-sm">Google Dork Operators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-2 bg-slate-900/60 rounded">
              <span className="text-red-400">site:</span>
              <span className="text-slate-300"> - Search within specific site</span>
            </div>
            <div className="p-2 bg-slate-900/60 rounded">
              <span className="text-red-400">filetype:</span>
              <span className="text-slate-300"> - Search specific file types</span>
            </div>
            <div className="p-2 bg-slate-900/60 rounded">
              <span className="text-red-400">inurl:</span>
              <span className="text-slate-300"> - Search in URL</span>
            </div>
            <div className="p-2 bg-slate-900/60 rounded">
              <span className="text-red-400">intitle:</span>
              <span className="text-slate-300"> - Search in page title</span>
            </div>
            <div className="p-2 bg-slate-900/60 rounded">
              <span className="text-red-400">intext:</span>
              <span className="text-slate-300"> - Search in page content</span>
            </div>
            <div className="p-2 bg-slate-900/60 rounded">
              <span className="text-red-400">cache:</span>
              <span className="text-slate-300"> - View cached version</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/60 border-amber-600/30">
        <CardContent className="pt-4">
          <p className="text-xs text-amber-400">
            ⚠️ Use Google Dorking responsibly and only on targets you're authorized to test. Respect privacy and legal boundaries.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}