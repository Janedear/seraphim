import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileText,
  Zap,
  Shield,
  Scan,
  Plus,
  X,
  Database,
  Search
} from "lucide-react";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { toast } from "sonner";
import { api } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/components/hooks/useOnboarding";
import OnboardingOverlay from "@/components/onboarding/OnboardingOverlay";
import { aiDetectionOnboardingSteps } from "@/components/onboarding/aidetectionSteps";
import { HelpCircle } from "lucide-react";

const DetectionResult = ({ result }) => {
  const getConfidenceColor = (score) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-green-600';
  };

  const getConfidenceBg = (score) => {
    if (score >= 80) return 'bg-red-100';
    if (score >= 50) return 'bg-amber-100';
    return 'bg-green-100';
  };

  return (
    <Card className={cn(
      "border-2 backdrop-blur-sm shadow-2xl",
      result.isAI 
        ? 'border-red-500/50 bg-red-950/30 shadow-red-500/20' 
        : 'border-green-500/50 bg-green-950/30 shadow-green-500/20'
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-white">Analysis Results</CardTitle>
          <Badge className={cn(
            "px-3 py-1 text-sm font-bold",
            result.isAI 
              ? 'bg-red-500/30 text-red-300 border border-red-500/50' 
              : 'bg-green-500/30 text-green-300 border border-green-500/50'
          )}>
            {result.isAI ? '🤖 AI Generated' : '👤 Human Created'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-300">AI Confidence Score</span>
            <span className={cn(
              "text-3xl font-bold drop-shadow-lg",
              result.confidence >= 80 ? 'text-red-400' :
              result.confidence >= 50 ? 'text-amber-400' : 'text-green-400'
            )}>
              {result.confidence}%
            </span>
          </div>
          <Progress value={result.confidence} className="h-4 bg-slate-800" />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-bold text-white">Detection Signals</p>
          {result.signals.map((signal, idx) => (
            <div key={idx} className="flex items-start gap-3 text-sm p-4 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-amber-500/50 transition-colors">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white mb-1">{signal.indicator}</p>
                <p className="text-sm text-slate-400 leading-relaxed">{signal.explanation}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
            <p className="text-slate-400 mb-2 text-sm font-semibold">Model Used</p>
            <p className="font-bold text-white">{result.model}</p>
          </div>
          <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
            <p className="text-slate-400 mb-2 text-sm font-semibold">Processing Time</p>
            <p className="font-bold text-white">{result.processingTime}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AIDetection() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('aidetection_tab') || 'ai-detection');
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [vulnResults, setVulnResults] = useState(null);
  const [deviceForm, setDeviceForm] = useState(() => {
    try {
      const saved = sessionStorage.getItem('aidetection_deviceForm');
      return saved ? JSON.parse(saved) : {
        deviceType: '',
        version: '',
        apps: [],
        extensions: [],
        newApp: '',
        newExtension: ''
      };
    } catch {
      return {
        deviceType: '',
        version: '',
        apps: [],
        extensions: [],
        newApp: '',
        newExtension: ''
      };
    }
  });
  // Sync with Layout's team state via localStorage
  const [team, setTeam] = useState(() => localStorage.getItem('secureGuardTeam') || 'blue');
  
  // Listen for team changes from Layout
  useEffect(() => {
    const handleStorageChange = () => {
      const newTeam = localStorage.getItem('secureGuardTeam') || 'blue';
      setTeam(newTeam);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  // Persist active tab
  useEffect(() => {
    sessionStorage.setItem('aidetection_tab', activeTab);
  }, [activeTab]);

  // Persist device form
  useEffect(() => {
    sessionStorage.setItem('aidetection_deviceForm', JSON.stringify(deviceForm));
  }, [deviceForm]);

  // Persist breach form
  useEffect(() => {
    sessionStorage.setItem('aidetection_breachForm', JSON.stringify(breachForm));
  }, [breachForm]);
  const [breachSearching, setBreachSearching] = useState(false);
  const [breachResults, setBreachResults] = useState(null);
  const [breachForm, setBreachForm] = useState(() => {
    try {
      const saved = sessionStorage.getItem('aidetection_breachForm');
      return saved ? JSON.parse(saved) : {
        term: '',
        fields: ['email'],
        wildcard: false,
        case_sensitive: false
      };
    } catch {
      return {
        term: '',
        fields: ['email'],
        wildcard: false,
        case_sensitive: false
      };
    }
  });
  const { showOnboarding, currentStep, completeOnboarding, skipOnboarding, nextStep, prevStep, resetOnboarding } = useOnboarding('aidetection');

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter text to analyze');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    try {
      const { data } = await api.functions.invoke('detectAIText', { text: inputText.trim() });
      setResult({
        isAI: data?.isAI ?? false,
        confidence: Math.min(100, Math.max(0, data?.confidence ?? 50)),
        model: data?.model || 'AI Detector',
        processingTime: data?.processingTime || 'LLM',
        signals: Array.isArray(data?.signals) ? data.signals : [],
      });
      toast.success('Analysis complete');
    } catch (err) {
      toast.error('Analysis failed: ' + (err?.message || 'Unknown error'));
      setResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVulnerabilityScan = async () => {
    if (!deviceForm.deviceType) {
      toast.error('Please select a device type');
      return;
    }

    if (scanning) {
      toast.warning('Scan already in progress');
      return;
    }

    setScanning(true);
    setVulnResults(null);
    try {
      const { data } = await api.functions.invoke('scanDeviceVulnerabilities', {
        deviceType: deviceForm.deviceType,
        version: deviceForm.version,
        apps: deviceForm.apps,
        extensions: deviceForm.extensions,
        team: team
      });
      setVulnResults(data);
      toast.success('Vulnerability scan complete');
    } catch (error) {
      (typeof window !== 'undefined' && window.__SERAPHIM_LOG__)?.error?.('Vulnerability scan error:', error);
      toast.error('Scan failed: ' + (error.message || 'Unknown error'));
      setVulnResults({ error: true, message: error.message || 'Scan failed' });
    } finally {
      setScanning(false);
    }
  };

  const addApp = () => {
    const appName = deviceForm.newApp.trim();
    if (!appName) {
      toast.error('Please enter an application name');
      return;
    }
    if (deviceForm.apps.includes(appName)) {
      toast.warning('Application already added');
      return;
    }
    if (deviceForm.apps.length >= 50) {
      toast.error('Maximum 50 applications allowed');
      return;
    }
    setDeviceForm({
      ...deviceForm,
      apps: [...deviceForm.apps, appName],
      newApp: ''
    });
  };

  const removeApp = (index) => {
    setDeviceForm({
      ...deviceForm,
      apps: deviceForm.apps.filter((_, i) => i !== index)
    });
  };

  const addExtension = () => {
    const extName = deviceForm.newExtension.trim();
    if (!extName) {
      toast.error('Please enter an extension name');
      return;
    }
    if (deviceForm.extensions.includes(extName)) {
      toast.warning('Extension already added');
      return;
    }
    if (deviceForm.extensions.length >= 50) {
      toast.error('Maximum 50 extensions allowed');
      return;
    }
    setDeviceForm({
      ...deviceForm,
      extensions: [...deviceForm.extensions, extName],
      newExtension: ''
    });
  };

  const removeExtension = (index) => {
    setDeviceForm({
      ...deviceForm,
      extensions: deviceForm.extensions.filter((_, i) => i !== index)
    });
  };

  const handleBreachSearch = async () => {
    if (!breachForm.term.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    if (breachForm.fields.length === 0) {
      toast.error('At least one search field must be selected');
      return;
    }

    if (breachSearching) {
      toast.warning('Search already in progress');
      return;
    }

    setBreachSearching(true);
    setBreachResults(null);

    try {
      const { data } = await api.functions.invoke('searchBreaches', {
        term: breachForm.term.trim(),
        fields: breachForm.fields,
        wildcard: breachForm.wildcard,
        case_sensitive: breachForm.case_sensitive
      });

      setBreachResults(data);
      
      if (data.success && data.count > 0) {
        toast.success(`Found ${data.count} breach record(s)`);
      } else if (data.success && data.count === 0) {
        toast.info('No breaches found - target appears clean');
      }
    } catch (error) {
      (typeof window !== 'undefined' && window.__SERAPHIM_LOG__)?.error?.('Breach search error:', error);
      toast.error('Search failed: ' + (error.message || 'Unknown error'));
      setBreachResults({ success: false, error: error.message || 'Search failed' });
    } finally {
      setBreachSearching(false);
    }
  };

  const toggleField = (field) => {
    setBreachForm(prev => {
      const newFields = prev.fields.includes(field)
        ? prev.fields.filter(f => f !== field)
        : [...prev.fields, field];
      
      // Prevent deselecting all fields
      if (newFields.length === 0) {
        toast.error('At least one search field must be selected');
        return prev;
      }
      
      return { ...prev, fields: newFields };
    });
  };

  return (
    <div className="space-y-6">
      {showOnboarding && (
        <div className="fixed inset-0 z-50">
          <OnboardingOverlay
            steps={aiDetectionOnboardingSteps}
            currentStep={currentStep}
            onNext={nextStep}
            onPrev={prevStep}
            onSkip={skipOnboarding}
            onComplete={completeOnboarding}
            teamColor={team}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader
          title={team === 'blue' ? "AI DETECTION" : "TARGET RECON"}
          description={team === 'blue' 
            ? "Synthetic content detection and vulnerability assessment"
            : "Intelligence gathering and exploit mapping"}
        />
        <Button
          onClick={resetOnboarding}
          variant="outline"
          size="sm"
          className="border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 flex items-center gap-2 flex-shrink-0"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Tour</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={cn(
          "bg-black border",
          team === 'blue' ? "border-cyan-500/30" : "border-red-500/30"
        )}>
          <TabsTrigger 
            value="ai-detection"
            data-onboard-target="ai-tab"
            className={cn(
              team === 'blue'
                ? "data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300"
                : "data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300"
            )}
          >
            AI Content Detection
          </TabsTrigger>
          <TabsTrigger 
            value="vulnerability-scan"
            data-onboard-target="vuln-tab"
            className={cn(
              team === 'blue'
                ? "data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300"
                : "data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300"
            )}
          >
            {team === 'blue' ? 'Vulnerability Scanner' : 'Target Assessment'}
          </TabsTrigger>
          <TabsTrigger 
            value="breach-search"
            data-onboard-target="breach-tab"
            className={cn(
              team === 'blue'
                ? "data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300"
                : "data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300"
            )}
          >
            {team === 'blue' ? 'Breach Intelligence' : 'Breach Recon'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-detection" className="space-y-6">
          {/* Info Banner */}
          <Card className={cn(
            "backdrop-blur-md",
            team === 'blue' 
              ? "bg-black/40 border-cyan-500/50 shadow-[0_0_40px_rgba(0,186,255,0.2)]"
              : "bg-black/40 border-red-500/50 shadow-[0_0_40px_rgba(255,50,50,0.2)]"
          )}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-xl",
                  team === 'blue' ? "bg-cyan-500/20 border border-cyan-500/50" : "bg-red-500/20 border border-red-500/50"
                )}>
                  <Sparkles className={cn(
                    "w-7 h-7 drop-shadow-lg",
                    team === 'blue' ? "text-cyan-400" : "text-red-400"
                  )} />
                </div>
                <div>
                  <p className={cn(
                    "font-bold text-base mb-2 drop-shadow-sm tracking-tight uppercase text-[13px] tracking-[0.1em]",
                    team === 'blue' ? "text-cyan-300" : "text-red-300"
                  )}>Detection Architecture</p>
                  <p className="text-sm text-slate-100 leading-relaxed font-light">
                    Multi-layered neural analysis engine examining statistical distributions, linguistic patterns, 
                    and structural anomalies across text, image, and video modalities with sub-second classification.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Modes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className={cn(
              "group hover:scale-105 transition-all duration-300 cursor-pointer border-2 backdrop-blur-md",
              team === 'blue'
                ? "border-cyan-500/50 bg-black/40 shadow-[0_0_30px_rgba(0,186,255,0.2)] hover:shadow-[0_0_50px_rgba(0,186,255,0.3)]"
                : "border-red-500/50 bg-black/40 shadow-[0_0_30px_rgba(255,50,50,0.2)] hover:shadow-[0_0_50px_rgba(255,50,50,0.3)]"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 rounded-xl backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl border",
                    team === 'blue' 
                      ? "bg-cyan-500/20 border-cyan-500/50" 
                      : "bg-red-500/20 border-red-500/50"
                  )}>
                    <FileText className={cn(
                      "w-6 h-6 sm:w-7 sm:h-7 drop-shadow-lg",
                      team === 'blue' ? "text-cyan-400" : "text-red-400"
                    )} />
                  </div>
                  <CardTitle className="text-sm sm:text-base text-white font-bold drop-shadow-sm tracking-tight">Linguistic Analysis</CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm text-slate-200 font-medium">
                  LLM output detection and attribution
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Image/Video analysis requires vision model integration - use text analysis */}
          </div>

          {/* Text Input */}
          <Card className={cn(
            "backdrop-blur-md",
            team === 'blue'
              ? "bg-black/40 border-cyan-500/50 shadow-[0_0_30px_rgba(0,186,255,0.2)]"
              : "bg-black/40 border-red-500/50 shadow-[0_0_30px_rgba(255,50,50,0.2)]"
          )}>
            <CardHeader>
              <CardTitle className={cn(
                "text-lg font-bold drop-shadow-sm tracking-tight uppercase text-[15px] tracking-[0.08em]",
                team === 'blue' ? "text-cyan-300" : "text-red-300"
              )}>Content Analysis</CardTitle>
              <CardDescription className="text-slate-200 font-medium">
                Submit content for synthetic origin detection and confidence scoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste text here to analyze..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[200px] font-mono text-sm bg-slate-950/60 border-slate-600/40 text-slate-100 placeholder:text-slate-400 backdrop-blur-sm"
              />
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <span className="text-xs sm:text-sm text-slate-400 font-medium">
                  {inputText.length} characters
                </span>
                <Button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing}
                  className={cn(
                    "shadow-lg w-full sm:w-auto",
                    team === 'blue'
                      ? "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                      : "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50"
                  )}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Content'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {result && <DetectionResult result={result} />}

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-purple-500/30 backdrop-blur-sm shadow-lg shadow-purple-500/10 hover:scale-105 transition-transform">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/30 to-purple-600/20 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <TrendingUp className="w-7 h-7 text-purple-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">247</p>
                <p className="text-sm text-slate-400 font-medium">Analyses Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-red-500/30 backdrop-blur-sm shadow-lg shadow-red-500/10 hover:scale-105 transition-transform">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/30 to-red-600/20 flex items-center justify-center shadow-lg shadow-red-500/20">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">83%</p>
                <p className="text-sm text-slate-400 font-medium">AI Content Detected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-green-500/30 backdrop-blur-sm shadow-lg shadow-green-500/10 hover:scale-105 transition-transform">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/30 to-green-600/20 flex items-center justify-center shadow-lg shadow-green-500/20">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">95.2%</p>
                <p className="text-sm text-slate-400 font-medium">Accuracy Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>
        </TabsContent>

        <TabsContent value="vulnerability-scan" className="space-y-6">
          <Card className={cn(
            "backdrop-blur-md",
            team === 'blue'
              ? "bg-black/40 border-cyan-500/50 shadow-[0_0_30px_rgba(0,186,255,0.2)]"
              : "bg-black/40 border-red-500/50 shadow-[0_0_30px_rgba(255,50,50,0.2)]"
          )}>
            <CardHeader>
              <CardTitle className={cn(
                "text-lg font-bold tracking-tight uppercase text-[15px] tracking-[0.08em]",
                team === 'blue' ? "text-cyan-300" : "text-red-300"
              )}>
                {team === 'blue' ? 'Infrastructure Vulnerability Assessment' : 'Target Reconnaissance'}
              </CardTitle>
              <CardDescription className="text-slate-200 font-medium">
                {team === 'blue' 
                  ? 'Identify weaknesses in your infrastructure to strengthen defenses'
                  : 'Enumerate vulnerabilities in target systems for exploitation planning'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Device Type</Label>
                  <Select value={deviceForm.deviceType} onValueChange={(v) => setDeviceForm({...deviceForm, deviceType: v})}>
                    <SelectTrigger className={cn(
                      "bg-black/60 text-white",
                      team === 'blue' ? "border-cyan-500/30" : "border-red-500/30"
                    )}>
                      <SelectValue placeholder="Select device type" />
                    </SelectTrigger>
                    <SelectContent className={cn(
                      "bg-slate-900",
                      team === 'blue' ? "border-cyan-500/30" : "border-red-500/30"
                    )}>
                      <SelectItem value="windows-10">Windows 10</SelectItem>
                      <SelectItem value="windows-11">Windows 11</SelectItem>
                      <SelectItem value="macos-ventura">macOS Ventura</SelectItem>
                      <SelectItem value="macos-sonoma">macOS Sonoma</SelectItem>
                      <SelectItem value="ubuntu-22.04">Ubuntu 22.04</SelectItem>
                      <SelectItem value="ubuntu-24.04">Ubuntu 24.04</SelectItem>
                      <SelectItem value="ios-17">iOS 17</SelectItem>
                      <SelectItem value="android-14">Android 14</SelectItem>
                      <SelectItem value="router">Network Router</SelectItem>
                      <SelectItem value="iot-camera">IoT Camera</SelectItem>
                      <SelectItem value="nas">NAS Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Version (Optional)</Label>
                  <Input 
                    placeholder="e.g., 22H2, Build 22621"
                    value={deviceForm.version}
                    onChange={(e) => setDeviceForm({...deviceForm, version: e.target.value})}
                    className="bg-black/60 border-cyan-500/30 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Installed Applications</Label>
                <div className="flex gap-2 mb-2">
                  <Input 
                    placeholder="e.g., Adobe Reader, Chrome, VS Code"
                    value={deviceForm.newApp}
                    onChange={(e) => setDeviceForm({...deviceForm, newApp: e.target.value})}
                    onKeyPress={(e) => e.key === 'Enter' && addApp()}
                    className={cn(
                      "bg-black/60 text-white",
                      team === 'blue' ? "border-cyan-500/30" : "border-red-500/30"
                    )}
                  />
                  <Button onClick={addApp} size="icon" className={cn(
                    team === 'blue' 
                      ? "bg-cyan-500/20 border border-cyan-500/50"
                      : "bg-red-500/20 border border-red-500/50"
                  )}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {deviceForm.apps.map((app, i) => (
                    <Badge key={i} className="bg-cyan-500/20 text-cyan-300 border-cyan-500/50">
                      {app}
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => removeApp(i)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Browser Extensions</Label>
                <div className="flex gap-2 mb-2">
                  <Input 
                    placeholder="e.g., uBlock Origin, LastPass"
                    value={deviceForm.newExtension}
                    onChange={(e) => setDeviceForm({...deviceForm, newExtension: e.target.value})}
                    onKeyPress={(e) => e.key === 'Enter' && addExtension()}
                    className={cn(
                      "bg-black/60 text-white",
                      team === 'blue' ? "border-cyan-500/30" : "border-red-500/30"
                    )}
                  />
                  <Button onClick={addExtension} size="icon" className={cn(
                    team === 'blue'
                      ? "bg-cyan-500/20 border border-cyan-500/50"
                      : "bg-red-500/20 border border-red-500/50"
                  )}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {deviceForm.extensions.map((ext, i) => (
                    <Badge key={i} className="bg-cyan-500/20 text-cyan-300 border-cyan-500/50">
                      {ext}
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => removeExtension(i)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleVulnerabilityScan}
                disabled={scanning}
                className={cn(
                  "w-full",
                  team === 'blue'
                    ? "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                    : "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50"
                )}
              >
                <Scan className="w-4 h-4 mr-2" />
                {scanning ? 'Scanning...' : team === 'blue' ? 'Scan for Vulnerabilities' : 'Enumerate Weaknesses'}
              </Button>
            </CardContent>
          </Card>

          {vulnResults?.error ? (
            <Card className="backdrop-blur-md bg-red-950/40 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              <CardHeader>
                <CardTitle className="text-white">Scan Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-300">{vulnResults.message || 'An error occurred during the scan'}</p>
              </CardContent>
            </Card>
          ) : vulnResults && (
            <div className="space-y-4">
              <Card className={cn(
                "backdrop-blur-md",
                team === 'blue'
                  ? "bg-black/40 border-cyan-500/50 shadow-[0_0_30px_rgba(0,186,255,0.2)]"
                  : "bg-black/40 border-red-500/50 shadow-[0_0_30px_rgba(255,50,50,0.2)]"
              )}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Assessment Summary</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        "text-lg px-3 py-1",
                        vulnResults.device_info?.risk_score >= 70 
                          ? "bg-red-500/30 text-red-300 border-red-500/50"
                          : vulnResults.device_info?.risk_score >= 40
                            ? "bg-yellow-500/30 text-yellow-300 border-yellow-500/50"
                            : "bg-green-500/30 text-green-300 border-green-500/50"
                      )}>
                        Risk: {vulnResults.device_info?.risk_score}/100
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-200">{vulnResults.device_info?.overall_assessment}</p>
                </CardContent>
              </Card>

              <Card className={cn(
                "backdrop-blur-md",
                team === 'blue'
                  ? "bg-black/40 border-cyan-500/50"
                  : "bg-black/40 border-red-500/50"
              )}>
                <CardHeader>
                  <CardTitle className={team === 'blue' ? "text-cyan-300" : "text-red-300"}>
                    Known Vulnerabilities ({vulnResults.vulnerabilities?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {vulnResults.vulnerabilities?.map((vuln, i) => (
                    <div key={i} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{vuln.title}</h4>
                          <p className="text-xs text-slate-400 mt-1">{vuln.cve_id}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={cn(
                            vuln.severity === 'critical' && "bg-red-500/30 text-red-300 border-red-500/50",
                            vuln.severity === 'high' && "bg-orange-500/30 text-orange-300 border-orange-500/50",
                            vuln.severity === 'medium' && "bg-yellow-500/30 text-yellow-300 border-yellow-500/50",
                            vuln.severity === 'low' && "bg-blue-500/30 text-blue-300 border-blue-500/50"
                          )}>
                            {vuln.severity?.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-slate-300">
                            CVSS: {vuln.cvss_score}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{vuln.description}</p>
                      {vuln.exploit_available && (
                        <Badge className="bg-red-500/30 text-red-300 border-red-500/50 mb-2">
                          ⚠️ Exploit Available
                        </Badge>
                      )}
                      <div className="mt-3 p-3 bg-black/40 rounded border border-slate-700">
                        <p className="text-xs font-bold text-slate-400 mb-1">
                          {team === 'blue' ? 'REMEDIATION' : 'EXPLOITATION NOTES'}
                        </p>
                        <p className="text-xs text-slate-300">{vuln.remediation}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {vulnResults.attack_vectors && vulnResults.attack_vectors.length > 0 && (
                <Card className={cn(
                  "backdrop-blur-md",
                  team === 'blue'
                    ? "bg-black/40 border-cyan-500/50"
                    : "bg-black/40 border-red-500/50"
                )}>
                  <CardHeader>
                    <CardTitle className={team === 'blue' ? "text-cyan-300" : "text-red-300"}>
                      {team === 'blue' ? 'Threat Vectors' : 'Attack Vectors'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {vulnResults.attack_vectors.map((vector, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-slate-700">
                        <span className="text-white">{vector.vector}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline">Likelihood: {vector.likelihood}</Badge>
                          <Badge variant="outline">Impact: {vector.impact}</Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className={cn(
                "backdrop-blur-md",
                team === 'blue'
                  ? "bg-black/40 border-cyan-500/50"
                  : "bg-black/40 border-red-500/50"
              )}>
                <CardHeader>
                  <CardTitle className={team === 'blue' ? "text-cyan-300" : "text-red-300"}>
                    {team === 'blue' ? 'Recommendations' : 'Tactical Guidance'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {vulnResults.recommendations?.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-200">
                        <Shield className={cn(
                          "w-4 h-4 mt-0.5 flex-shrink-0",
                          team === 'blue' ? "text-cyan-400" : "text-red-400"
                        )} />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="breach-search" className="space-y-6">
          <Card className={cn(
            "backdrop-blur-md",
            team === 'blue' 
              ? "bg-black/40 border-cyan-500/50 shadow-[0_0_40px_rgba(0,186,255,0.2)]"
              : "bg-black/40 border-red-500/50 shadow-[0_0_40px_rgba(255,50,50,0.2)]"
          )}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-xl",
                  team === 'blue' ? "bg-cyan-500/20 border border-cyan-500/50" : "bg-red-500/20 border border-red-500/50"
                )}>
                  <Database className={cn(
                    "w-7 h-7 drop-shadow-lg",
                    team === 'blue' ? "text-cyan-400" : "text-red-400"
                  )} />
                </div>
                <div>
                  <p className={cn(
                    "font-bold text-base mb-2 drop-shadow-sm tracking-tight uppercase text-[13px] tracking-[0.1em]",
                    team === 'blue' ? "text-cyan-300" : "text-red-300"
                  )}>BreachVIP Intelligence</p>
                  <p className="text-sm text-slate-100 leading-relaxed font-light">
                    {team === 'blue' 
                      ? 'Search global breach databases to identify compromised employee credentials and strengthen organizational security posture.'
                      : 'Query breach databases for target reconnaissance, credential harvesting, and attack surface enumeration across multiple data fields.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "backdrop-blur-md",
            team === 'blue'
              ? "bg-black/40 border-cyan-500/50 shadow-[0_0_30px_rgba(0,186,255,0.2)]"
              : "bg-black/40 border-red-500/50 shadow-[0_0_30px_rgba(255,50,50,0.2)]"
          )}>
            <CardHeader>
              <CardTitle className={cn(
                "text-lg font-bold tracking-tight uppercase text-[15px] tracking-[0.08em]",
                team === 'blue' ? "text-cyan-300" : "text-red-300"
              )}>
                Breach Database Query
              </CardTitle>
              <CardDescription className="text-slate-200 font-medium">
                Search across known data breaches using multiple field types and wildcard operators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300 mb-2 block">Search Term</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder={breachForm.wildcard ? "e.g., *@example.com or user*" : "e.g., user@example.com"}
                    value={breachForm.term}
                    onChange={(e) => setBreachForm({...breachForm, term: e.target.value})}
                    onKeyPress={(e) => e.key === 'Enter' && handleBreachSearch()}
                    className="bg-black/60 border-cyan-500/30 text-white flex-1"
                  />
                  <Button 
                    onClick={handleBreachSearch}
                    disabled={breachSearching}
                    className={cn(
                      "shadow-lg",
                      team === 'blue'
                        ? "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                        : "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50"
                    )}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {breachSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Wildcards: * (zero or more) and ? (one character). Max 10,000 results. Rate limit: 15 req/min.
                </p>
              </div>

              <div>
                <Label className="text-slate-300 mb-2 block">Search Fields</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {['email', 'username', 'password', 'name', 'phone', 'ip', 'discordid', 'uuid', 'domain', 'steamid'].map(field => (
                    <Button
                      key={field}
                      size="sm"
                      variant={breachForm.fields.includes(field) ? "default" : "outline"}
                      onClick={() => toggleField(field)}
                      className={cn(
                        breachForm.fields.includes(field)
                          ? team === 'blue'
                            ? "bg-cyan-500/30 text-cyan-200 border-cyan-500/50"
                            : "bg-red-500/30 text-red-200 border-red-500/50"
                          : "bg-slate-800/50 text-slate-400 border-slate-600 hover:border-slate-500"
                      )}
                    >
                      {field}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="wildcard"
                    checked={breachForm.wildcard}
                    onChange={(e) => setBreachForm({...breachForm, wildcard: e.target.checked})}
                    className="w-4 h-4 rounded bg-black/60 border-cyan-500/50"
                  />
                  <Label htmlFor="wildcard" className="text-slate-300 cursor-pointer">
                    Enable Wildcards
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="case_sensitive"
                    checked={breachForm.case_sensitive}
                    onChange={(e) => setBreachForm({...breachForm, case_sensitive: e.target.checked})}
                    className="w-4 h-4 rounded bg-black/60 border-cyan-500/50"
                  />
                  <Label htmlFor="case_sensitive" className="text-slate-300 cursor-pointer">
                    Case Sensitive
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {breachResults && (
            <Card className={cn(
              "backdrop-blur-md border-2",
              breachResults.success && breachResults.count > 0
                ? team === 'blue'
                  ? "bg-red-950/40 border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.3)]"
                  : "bg-green-950/40 border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.3)]"
                : "bg-green-950/40 border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.2)]"
            )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-white">
                    {breachResults.success && breachResults.count > 0 
                      ? `⚠️ ${breachResults.count} Breach Record${breachResults.count !== 1 ? 's' : ''} Found`
                      : breachResults.success 
                        ? '✅ No Breaches Detected'
                        : '❌ Search Error'}
                  </CardTitle>
                  <Badge className={cn(
                    "px-3 py-1 text-sm font-bold",
                    breachResults.success && breachResults.count > 0
                      ? "bg-red-500/30 text-red-300 border border-red-500/50"
                      : "bg-green-500/30 text-green-300 border border-green-500/50"
                  )}>
                    {breachResults.success 
                      ? breachResults.count > 0 
                        ? 'COMPROMISED' 
                        : 'CLEAN'
                      : 'ERROR'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto">
                {breachResults.error ? (
                  <div className="p-4 bg-red-900/30 rounded-lg border border-red-500/50">
                    <p className="text-red-300">{breachResults.error}</p>
                  </div>
                ) : breachResults.results?.map((result, idx) => (
                  <div key={idx} className="p-4 bg-slate-900/60 rounded-lg border border-slate-700 hover:border-amber-500/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-white">Source: {result.source || 'Unknown'}</p>
                        <p className="text-xs text-slate-400 mt-1">Category: {result.categories || 'General'}</p>
                      </div>
                      <Badge variant="outline" className="text-red-400 border-red-500/50">
                        Breach #{idx + 1}
                      </Badge>
                    </div>
                    {result.data && (
                      <div className="mt-2 p-3 bg-black/40 rounded border border-slate-700">
                        <pre className="text-xs text-slate-300 whitespace-pre-wrap break-all">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
                
                {breachResults.success && breachResults.count === 0 && (
                  <div className="p-6 bg-green-900/20 rounded-lg border border-green-500/40 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-green-300 font-semibold">
                      {team === 'blue' 
                        ? 'No breach records found. This credential appears secure.'
                        : 'Target not found in breach databases. Consider alternative reconnaissance methods.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}