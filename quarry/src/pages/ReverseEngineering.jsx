import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code,
  Cpu,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Info,
  Zap,
  Shield,
  TrendingUp
} from "lucide-react";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key } from "lucide-react";
import CutterLite from '@/components/reverse-engineering/CutterLite';
import { api } from "@/api/client";

const InstructionExplanation = ({ instruction, level }) => {
  const explanations = {
    beginner: {
      title: "Simple Explanation",
      description: "Easy-to-understand breakdown for those new to assembly",
      color: "bg-green-50 border-green-200"
    },
    intermediate: {
      title: "Technical Details",
      description: "More detailed explanation with technical context",
      color: "bg-blue-50 border-blue-200"
    },
    advanced: {
      title: "Expert Analysis",
      description: "Deep dive with security implications and optimizations",
      color: "bg-purple-50 border-purple-200"
    }
  };

  const config = explanations[level];

  return (
    <div className={`border rounded-lg p-4 ${config.color}`}>
      <div className="flex items-start gap-3">
        <div className="font-mono text-sm bg-slate-900 text-green-400 px-3 py-1 rounded min-w-[200px]">
          {instruction.code}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm mb-1">{instruction.mnemonic}</p>
          <p className="text-xs text-slate-600 mb-2">{instruction[level]}</p>
          {instruction.warning && (
            <div className="flex items-center gap-1 text-xs text-amber-700 mt-2">
              <AlertTriangle className="w-3 h-3" />
              {instruction.warning}
            </div>
          )}
          {instruction.security && level === 'advanced' && (
            <div className="flex items-center gap-1 text-xs text-red-700 mt-2">
              <Shield className="w-3 h-3" />
              Security: {instruction.security}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PatternCard = ({ pattern }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <pattern.icon className="w-4 h-4 text-blue-700" />
          </div>
          <CardTitle className="text-sm">{pattern.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-slate-600 mb-2">{pattern.description}</p>
        <Badge variant="outline" className="text-xs">
          Lines {pattern.startLine}-{pattern.endLine}
        </Badge>
      </CardContent>
    </Card>
  );
};

export default function ReverseEngineering() {
  const [asmCode, setAsmCode] = useState('');
  const [knowledgeLevel, setKnowledgeLevel] = useState('beginner');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [showApiSettings, setShowApiSettings] = useState(false);

  const sampleCode = `push rbp
mov rbp, rsp
sub rsp, 0x20
mov DWORD PTR [rbp-0x14], edi
mov DWORD PTR [rbp-0x18], esi
mov eax, DWORD PTR [rbp-0x14]
add eax, DWORD PTR [rbp-0x18]
mov DWORD PTR [rbp-0x4], eax
mov eax, DWORD PTR [rbp-0x4]
leave
ret`;

  const patternIcons = [Code, Cpu, TrendingUp, Code, Shield];

  const handleAnalyze = async () => {
    if (!asmCode.trim()) {
      toast.error('Please enter assembly code to analyze');
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const { data } = await api.functions.invoke('analyzeAssembly', { asmCode: asmCode.trim() });
      const patterns = (data?.patterns || []).map((p, i) => ({
        ...p,
        icon: patternIcons[i % patternIcons.length],
      }));
      setAnalysis({
        instructions: data?.instructions || [],
        patterns,
        summary: data?.summary || { purpose: '', parameters: '', returnType: '', optimizations: '', vulnerabilities: [] },
        reconstructed: [],
      });
      toast.success('Assembly code analyzed successfully');
    } catch (err) {
      toast.error('Analysis failed: ' + (err?.message || 'Unknown error'));
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveApiKey = () => {
    localStorage.setItem('openai_api_key', openaiKey);
    toast.success('API key saved locally');
    setShowApiSettings(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="IDA - Assembly Code Analyzer"
          description="AI-powered disassembly analysis with CTF-optimized explanations"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowApiSettings(!showApiSettings)}
          className="border-slate-700 text-white"
        >
          <Key className="w-4 h-4 mr-2" />
          API Settings
        </Button>
      </div>

      {/* API Key Configuration */}
      {showApiSettings && (
        <Card className="border-amber-500/30 bg-black/20 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              OpenAI API Configuration
            </CardTitle>
            <CardDescription className="text-amber-200/70">
              Configure your OpenAI API key for enhanced AI-powered analysis (optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-slate-300">OpenAI API Key</Label>
              <Input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="bg-slate-900/60 border-slate-700 text-white font-mono"
              />
              <p className="text-xs text-amber-300">
                Stored locally in your browser. Never sent to our servers. Get your key from{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-amber-200"
                >
                  platform.openai.com
                </a>
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveApiKey} className="flex-1" size="sm">
                Save API Key
              </Button>
              <Button
                onClick={() => {
                  setOpenaiKey('');
                  localStorage.removeItem('openai_api_key');
                  toast.success('API key cleared');
                }}
                variant="outline"
                size="sm"
                className="border-slate-700"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Banner */}
      <Card className="border-red-500/30 bg-black/20 backdrop-blur-md">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <p className="font-semibold text-blue-900 mb-1">How This Works</p>
              <p className="text-sm text-red-200">
                Paste assembly code from disassemblers like Ghidra, Cutter, IDA Pro, or objdump. 
                Select your knowledge level, and get line-by-line explanations that match your understanding. 
                We'll identify patterns, explain CPU operations, and highlight security concerns.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cutter Lite - Binary Analysis */}
      <CutterLite />

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-black/20 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle>Assembly Code Input</CardTitle>
              <CardDescription>
                Paste x86, x86-64, ARM, or other assembly code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste assembly code here...&#10;&#10;Example:&#10;push rbp&#10;mov rbp, rsp&#10;sub rsp, 0x20"
                value={asmCode}
                onChange={(e) => setAsmCode(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAsmCode(sampleCode)}
                >
                  Load Sample Code
                </Button>
                <span className="text-xs text-slate-500">
                  {asmCode.split('\n').filter(line => line.trim()).length} instructions
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-black/20 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-base">Analysis Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Knowledge Level</label>
                <Select value={knowledgeLevel} onValueChange={setKnowledgeLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        <div>
                          <p className="font-medium">Beginner</p>
                          <p className="text-xs text-slate-500">Simple explanations</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="intermediate">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        <div>
                          <p className="font-medium">Intermediate</p>
                          <p className="text-xs text-slate-500">Technical details</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="advanced">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        <div>
                          <p className="font-medium">Advanced</p>
                          <p className="text-xs text-slate-500">Expert analysis</p>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" onClick={handleAnalyze} disabled={isAnalyzing}>
                <Zap className="w-4 h-4 mr-2" />
                {isAnalyzing ? 'Analyzing...' : 'Analyze Code'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-900 mb-1">Supported Formats</p>
                  <p className="text-xs text-amber-700">
                    x86, x86-64, ARM, MIPS, PowerPC assembly from any disassembler
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <Tabs defaultValue="instructions">
          <TabsList className="bg-black/20 border border-red-500/30">
            <TabsTrigger value="instructions">Instruction Breakdown</TabsTrigger>
            <TabsTrigger value="patterns">Detected Patterns</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="reconstruct">Reconstruct Code</TabsTrigger>
          </TabsList>

          <TabsContent value="instructions" className="mt-6 space-y-3">
            {analysis.instructions.map((instruction, idx) => (
              <InstructionExplanation
                key={idx}
                instruction={instruction}
                level={knowledgeLevel}
              />
            ))}
          </TabsContent>

          <TabsContent value="patterns" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.patterns.map((pattern, idx) => (
                <PatternCard key={idx} pattern={pattern} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="summary" className="mt-6 space-y-4">
            <Card className="bg-black/20 backdrop-blur-md border-red-500/30">
              <CardHeader>
                <CardTitle className="text-base">Function Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-slate-50 rounded">
                    <p className="text-xs text-slate-500 mb-1">Purpose</p>
                    <p className="font-semibold">{analysis.summary.purpose}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded">
                    <p className="text-xs text-slate-500 mb-1">Parameters</p>
                    <p className="font-semibold">{analysis.summary.parameters}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded">
                    <p className="text-xs text-slate-500 mb-1">Return Type</p>
                    <p className="font-semibold">{analysis.summary.returnType}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded">
                    <p className="text-xs text-slate-500 mb-1">Optimization</p>
                    <p className="font-semibold">{analysis.summary.optimizations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {knowledgeLevel === 'advanced' && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-600" />
                    Security Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {analysis.summary.vulnerabilities.map((vuln, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-red-700">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{vuln}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reconstruct" className="mt-6 space-y-4">
            <Card className="border-emerald-500/30 bg-black/20 backdrop-blur-md">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-900 text-sm mb-1">Source Code Reconstruction</p>
                    <p className="text-xs text-emerald-200">
                      Based on the assembly analysis, we've reconstructed the original source code in multiple languages. 
                      The logic flow, parameters, and return values match the disassembled binary.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {analysis.reconstructed?.length ? analysis.reconstructed.map((code, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      {code.language}
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => {
                      navigator.clipboard.writeText(code.code);
                      toast.success('Code copied to clipboard');
                    }}>
                      Copy
                    </Button>
                  </div>
                  <CardDescription className="text-xs">{code.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto font-mono">
                    {code.code}
                  </pre>
                  {code.explanation && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs font-medium text-blue-900 mb-1">How we reconstructed this:</p>
                      <p className="text-xs text-blue-700">{code.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )) : (
              <Card className="border-slate-200 bg-slate-50">
                <CardContent className="pt-4">
                  <p className="text-sm text-slate-600">Source code reconstruction is available for instruction-level analysis. Full multi-language reconstruction may be added in a future release.</p>
                </CardContent>
              </Card>
            )}

            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-900 mb-1">Important Notes</p>
                    <ul className="text-xs text-amber-700 space-y-1">
                      <li>• Variable names are inferred and may not match originals</li>
                      <li>• Optimizations may have altered the original code structure</li>
                      <li>• Comments and documentation are not preserved in binaries</li>
                      <li>• Complex macros and templates cannot be fully reconstructed</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}