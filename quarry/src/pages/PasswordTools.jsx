import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { Key, Hash, Zap, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/api/client";

export default function PasswordTools() {
  const [hashInput, setHashInput] = useState('');
  const [hashType, setHashType] = useState('md5');
  const [hashOutput, setHashOutput] = useState('');
  const [wordlistLength, setWordlistLength] = useState(100);
  const [wordlistPattern, setWordlistPattern] = useState('complex');
  const [wordlistOutput, setWordlistOutput] = useState('');
  const [breachCheckInput, setBreachCheckInput] = useState('');
  const [breachResult, setBreachResult] = useState(null);
  const [checkingBreach, setCheckingBreach] = useState(false);

  const generateHash = async (text, type) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    let algorithm;
    switch(type) {
      case 'sha1': algorithm = 'SHA-1'; break;
      case 'sha256': algorithm = 'SHA-256'; break;
      case 'sha512': algorithm = 'SHA-512'; break;
      default: 
        // MD5 not supported in Web Crypto API - use external tool
        return 'MD5 not supported. Use SHA-1/SHA-256 or external tool.';
    }
    
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleGenerateHash = async () => {
    const hash = await generateHash(hashInput, hashType);
    setHashOutput(hash);
    toast.success('Hash generated');
  };

  const generateWordlist = () => {
    const patterns = {
      simple: ['password', 'admin', '123456', 'welcome', 'letmein'],
      complex: ['P@ssw0rd', 'Admin123!', 'Welcome2024', 'Spring2024!', 'Winter123!'],
      company: ['CompanyName2024', 'Office365!', 'Azure123', 'Corp2024', 'Enterprise!'],
      dates: ['January2024', 'Summer2024', 'Q12024', 'FY2024', 'Dec2023']
    };

    const base = patterns[wordlistPattern] || patterns.simple;
    const wordlist = [];
    
    for (let i = 0; i < Math.min(wordlistLength, 1000); i++) {
      const word = base[i % base.length];
      const variations = [
        word,
        word + i,
        word + '!',
        word.toLowerCase(),
        word.toUpperCase(),
        word + '@' + (2020 + (i % 10)),
        word.replace(/[aeiou]/gi, (m) => ({ a: '@', e: '3', i: '1', o: '0', u: 'U' })[m.toLowerCase()] || m)
      ];
      wordlist.push(variations[i % variations.length]);
    }
    
    setWordlistOutput(wordlist.join('\n'));
    toast.success(`Generated ${wordlist.length} passwords`);
  };

  const copyOutput = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadOutput = (text, filename) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    toast.success('Downloaded');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Password & Hash Tools"
        description="Password cracking utilities and hash generation"
      />

      <Tabs defaultValue="hash" className="space-y-4">
        <TabsList className="bg-black/40 border border-red-500/30">
          <TabsTrigger value="hash" className="data-[state=active]:bg-red-600">Hash Generator</TabsTrigger>
          <TabsTrigger value="wordlist" className="data-[state=active]:bg-red-600">Wordlist Generator</TabsTrigger>
          <TabsTrigger value="cracking" className="data-[state=active]:bg-red-600">Hash Cracking</TabsTrigger>
        </TabsList>

        <TabsContent value="hash">
          <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Hash className="w-5 h-5" />
                Generate Password Hash
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Input Text</label>
                <Input
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="Enter text to hash..."
                />
              </div>

              <div className="flex gap-2">
                {['md5', 'sha1', 'sha256', 'sha512'].map((type) => (
                  <Button
                    key={type}
                    variant={hashType === type ? 'default' : 'outline'}
                    onClick={() => setHashType(type)}
                    className={hashType === type ? 'bg-red-600' : 'border-slate-700 text-white'}
                    size="sm"
                  >
                    {type.toUpperCase()}
                  </Button>
                ))}
              </div>

              <Button onClick={handleGenerateHash} className="w-full bg-gradient-to-r from-red-600 to-red-700">
                <Zap className="w-4 h-4 mr-2" />
                Generate Hash
              </Button>

              {hashOutput && (
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Generated Hash</label>
                  <Textarea
                    value={hashOutput}
                    readOnly
                    className="font-mono text-sm bg-slate-900 border-slate-700 text-green-400"
                  />
                  <Button onClick={() => copyOutput(hashOutput)} variant="outline" className="w-full border-slate-700 text-white">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Hash
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wordlist">
          <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Key className="w-5 h-5" />
                Generate Custom Wordlist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Length</label>
                  <Input
                    type="number"
                    value={wordlistLength}
                    onChange={(e) => setWordlistLength(parseInt(e.target.value) || 100)}
                    className="bg-slate-900 border-slate-700 text-white"
                    max="1000"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Pattern</label>
                  <select
                    value={wordlistPattern}
                    onChange={(e) => setWordlistPattern(e.target.value)}
                    className="w-full h-9 px-3 rounded-md bg-slate-900 border border-slate-700 text-white text-sm"
                  >
                    <option value="simple">Simple</option>
                    <option value="complex">Complex</option>
                    <option value="company">Company</option>
                    <option value="dates">Dates</option>
                  </select>
                </div>
              </div>

              <Button onClick={generateWordlist} className="w-full bg-gradient-to-r from-red-600 to-red-700">
                <Zap className="w-4 h-4 mr-2" />
                Generate Wordlist
              </Button>

              {wordlistOutput && (
                <div className="space-y-2">
                  <Textarea
                    value={wordlistOutput}
                    readOnly
                    className="min-h-[300px] font-mono text-sm bg-slate-900 border-slate-700 text-green-400"
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => copyOutput(wordlistOutput)} variant="outline" className="flex-1 border-slate-700 text-white">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button onClick={() => downloadOutput(wordlistOutput, 'wordlist.txt')} variant="outline" className="flex-1 border-slate-700 text-white">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cracking">
          <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white">Hash Cracking & Breach Lookup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-300">Check if password appears in breaches (Have I Been Pwned)</p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Enter password to check (sent as SHA-1 hash only)"
                    value={breachCheckInput}
                    onChange={(e) => setBreachCheckInput(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                  <Button
                    onClick={async () => {
                      if (!breachCheckInput.trim()) { toast.error('Enter password'); return; }
                      setCheckingBreach(true);
                      setBreachResult(null);
                      try {
                        const data = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(breachCheckInput));
                        const hash = Array.from(new Uint8Array(data)).map(b => b.toString(16).padStart(2, '0')).join('');
                        const { data: res } = await api.functions.invoke('lookupHashBreach', { hash });
                        setBreachResult(res);
                        toast.success(res?.pwned ? 'Password found in breaches' : 'Password not in known breaches');
                      } catch (err) {
                        toast.error('Check failed: ' + (err?.message || 'Unknown error'));
                      } finally {
                        setCheckingBreach(false);
                      }
                    }}
                    disabled={checkingBreach}
                  >
                    {checkingBreach ? 'Checking...' : 'Check Breach'}
                  </Button>
                </div>
                {breachResult && (
                  <div className={`p-3 rounded ${breachResult.pwned ? 'bg-red-900/30 border border-red-500/50' : 'bg-green-900/30 border border-green-500/50'}`}>
                    <p className="font-medium">{breachResult.pwned ? '⚠️ Pwned' : '✓ Not in breaches'}</p>
                    <p className="text-sm text-slate-400">{breachResult.message}</p>
                    {breachResult.count > 0 && <p className="text-sm">Seen {breachResult.count} times in breaches</p>}
                  </div>
                )}
              </div>
              <div className="p-4 border border-amber-600/30 rounded-lg bg-amber-950/20">
                <p className="text-sm text-amber-400 mb-2">⚠️ Hash Cracking Tools</p>
                <div className="space-y-2 text-xs text-slate-300">
                  <p><strong>John the Ripper:</strong> john --wordlist=wordlist.txt hashes.txt</p>
                  <p><strong>Hashcat:</strong> hashcat -m 0 -a 0 hashes.txt wordlist.txt</p>
                  <p><strong>Hydra:</strong> hydra -L users.txt -P passwords.txt ssh://target</p>
                  <p><strong>Medusa:</strong> medusa -h target -U users.txt -P passwords.txt -M ssh</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-300">Common hash types:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <div>MD5: -m 0</div>
                  <div>SHA1: -m 100</div>
                  <div>SHA256: -m 1400</div>
                  <div>NTLM: -m 1000</div>
                  <div>bcrypt: -m 3200</div>
                  <div>MySQL: -m 300</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-slate-800/50 border-amber-600/30">
        <CardContent className="pt-4">
          <p className="text-xs text-amber-400">
            ⚠️ Use only for authorized security testing. Unauthorized password cracking is illegal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}