import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  Printer,
  BarChart3,
  TrendingUp,
  Shield,
  AlertTriangle,
  Monitor,
  Microscope,
  Network,
  Target,
  FileWarning,
  Clock
} from "lucide-react";
import { useExecutiveSummary, useExportAlerts, useExportDevices } from '@/components/hooks/useApi';
import { useAuth } from '@/lib/AuthContext';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

const ReportCard = ({ icon: Icon, title, description, onExport, exportFormats, isExporting, team = 'blue' }) => (
  <Card className={cn('bg-black/40 backdrop-blur-md transition-all', team === 'blue' ? 'border-cyan-500/30 hover:shadow-[0_0_40px_rgba(0,186,255,0.3)]' : 'border-red-500/30 hover:shadow-[0_0_40px_rgba(255,50,50,0.3)]')}>
    <CardHeader className="pb-3">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg border flex items-center justify-center', team === 'blue' ? 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_20px_rgba(0,186,255,0.3)]' : 'bg-red-500/20 border-red-500/50 shadow-[0_0_20px_rgba(255,50,50,0.3)]')}>
          <Icon className={cn('w-5 h-5', team === 'blue' ? 'text-cyan-400' : 'text-red-400')} />
        </div>
        <div className="flex-1">
          <CardTitle className="text-base text-white">{title}</CardTitle>
          <CardDescription className={cn('text-xs', team === 'blue' ? 'text-cyan-200/70' : 'text-red-200/70')}>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex gap-2">
        {exportFormats.map(format => (
          <Button
            key={format}
            variant="outline"
            size="sm"
            onClick={() => onExport(format)}
            disabled={isExporting}
          >
            <Download className="w-4 h-4 mr-2" />
            {format.toUpperCase()}
          </Button>
        ))}
      </div>
    </CardContent>
  </Card>
);

const StatRow = ({ label, value, subValue }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
    <span className="text-sm text-slate-600">{label}</span>
    <div className="text-right">
      <span className="text-sm font-semibold text-slate-900">{value}</span>
      {subValue && (
        <span className="text-xs text-slate-500 ml-2">{subValue}</span>
      )}
    </div>
  </div>
);

const ExecutiveSummaryReport = ({ data, printRef }) => {
  if (!data) return null;

  return (
    <div ref={printRef} className="space-y-6 print:p-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-slate-700" />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Security Executive Summary</h1>
            <p className="text-sm text-slate-500">
              Generated {format(new Date(), 'MMMM d, yyyy HH:mm')}
            </p>
          </div>
        </div>
        <div className="text-right print:hidden">
          <p className="text-xs text-slate-500">Report Period</p>
          <p className="text-sm font-medium text-slate-900">Last 30 Days</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4 pb-4 text-center">
            <Monitor className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{data.totalDevices}</p>
            <p className="text-xs text-slate-600">Total Devices</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="pt-4 pb-4 text-center">
            <Shield className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{data.protectedPercentage}%</p>
            <p className="text-xs text-slate-600">Protection Rate</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-4 pb-4 text-center">
            <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{data.activeAlerts}</p>
            <p className="text-xs text-slate-600">Active Alerts</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-4 pb-4 text-center">
            <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{data.avgRiskScore}</p>
            <p className="text-xs text-slate-600">Avg Risk Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Endpoint Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <StatRow label="Total Devices" value={data.totalDevices} />
            <StatRow label="Online Devices" value={data.onlineDevices} />
            <StatRow label="Protection Rate" value={`${data.protectedPercentage}%`} />
            <StatRow label="Average Risk Score" value={data.avgRiskScore} subValue="/ 100" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Incident Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <StatRow label="Open Incidents" value={data.openIncidents} />
            <StatRow label="Resolved Incidents" value={data.resolvedIncidents || 0} />
            <StatRow label="Mean Time to Detect" value={data.meanTimeToDetect || 'N/A'} />
            <StatRow label="Mean Time to Respond" value={data.meanTimeToRespond || 'N/A'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Alerts by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            {data.alertsBySeverity?.map(item => (
              <StatRow 
                key={item.severity} 
                label={item.severity.charAt(0).toUpperCase() + item.severity.slice(1)} 
                value={item.count} 
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top MITRE ATT&CK Tactics</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topMitreTactics?.slice(0, 5).map(item => (
              <StatRow 
                key={item.tactic} 
                label={item.tactic} 
                value={item.count} 
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 border-t border-slate-200 print:mt-8">
        <p className="text-xs text-slate-500">
          This report was automatically generated by Seraphim Endpoint Security Console
        </p>
      </div>
    </div>
  );
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState('summary');
  const printRef = useRef(null);
  const { user } = useAuth();
  const team = user?.team || 'blue';
  
  const { data: summary, isLoading: summaryLoading } = useExecutiveSummary();
  const exportAlertsMutation = useExportAlerts();
  const exportDevicesMutation = useExportDevices();

  const handleExport = async (type, format) => {
    let result;
    if (type === 'alerts') {
      result = await exportAlertsMutation.mutateAsync(format);
    } else if (type === 'devices') {
      result = await exportDevicesMutation.mutateAsync(format);
    }

    if (result) {
      const blob = new Blob([result.data], { type: result.contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and export security reports"
        actions={
          activeTab === 'summary' && (
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
          )
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn('bg-black/40 border', team === 'blue' ? 'border-cyan-500/30' : 'border-red-500/30')}>
          <TabsTrigger value="summary" className={cn('data-[state=active]:', team === 'blue' ? 'data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400' : 'data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400')}>Executive Summary</TabsTrigger>
          <TabsTrigger value="export" className={cn('data-[state=active]:', team === 'blue' ? 'data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400' : 'data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400')}>Export Data</TabsTrigger>
          <TabsTrigger value="detailed" className={cn('data-[state=active]:', team === 'blue' ? 'data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400' : 'data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400')}>Detailed Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          {summaryLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          ) : (
            <ExecutiveSummaryReport data={summary} printRef={printRef} />
          )}
        </TabsContent>

        <TabsContent value="export" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ReportCard
              icon={AlertTriangle}
              title="Alerts Export"
              description="Export all alerts data"
              onExport={(format) => handleExport('alerts', format)}
              exportFormats={['csv', 'json']}
              isExporting={exportAlertsMutation.isPending}
              team={team}
            />
            <ReportCard
              icon={Monitor}
              title="Devices Export"
              description="Export all devices data"
              onExport={(format) => handleExport('devices', format)}
              exportFormats={['csv', 'json']}
              isExporting={exportDevicesMutation.isPending}
              team={team}
            />
            <ReportCard
              icon={BarChart3}
              title="Incident Report"
              description="Export incident data and timeline"
              onExport={() => {}}
              exportFormats={['csv', 'json']}
              isExporting={false}
              team={team}
            />
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Malware Analysis Report */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <Microscope className="w-5 h-5 text-red-700" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Malware Analysis Report</CardTitle>
                    <CardDescription className="text-xs">
                      Complete analysis of all malware samples with IOCs, behaviors, and MITRE techniques
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs space-y-1">
                  <p className="font-medium">Includes:</p>
                  <ul className="list-disc list-inside text-slate-600">
                    <li>All quarantined samples from Malware Zoo</li>
                    <li>Behavioral analysis and threat scores</li>
                    <li>Network IOCs and C2 servers</li>
                    <li>File system modifications</li>
                    <li>YARA rule matches</li>
                    <li>MITRE ATT&CK technique mapping</li>
                    <li>Recommendations for blocking</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1"><Download className="w-3 h-3 mr-2" />PDF</Button>
                  <Button size="sm" variant="outline" className="flex-1">CSV</Button>
                  <Button size="sm" variant="outline" className="flex-1">JSON</Button>
                </div>
              </CardContent>
            </Card>

            {/* Threat Hunting Report */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-700" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Threat Hunting Report</CardTitle>
                    <CardDescription className="text-xs">
                      Proactive hunting results, findings, and suspicious patterns detected
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs space-y-1">
                  <p className="font-medium">Includes:</p>
                  <ul className="list-disc list-inside text-slate-600">
                    <li>Executed hunt hypotheses</li>
                    <li>Suspicious activities found</li>
                    <li>Evidence and indicators</li>
                    <li>False positive analysis</li>
                    <li>Recommended actions</li>
                    <li>Custom query results</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1"><Download className="w-3 h-3 mr-2" />PDF</Button>
                  <Button size="sm" variant="outline" className="flex-1">CSV</Button>
                  <Button size="sm" variant="outline" className="flex-1">JSON</Button>
                </div>
              </CardContent>
            </Card>

            {/* SIEM Analysis Report */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Network className="w-5 h-5 text-blue-700" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">SIEM & Log Analysis</CardTitle>
                    <CardDescription className="text-xs">
                      Security event logs, correlation rules, and anomaly detection
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs space-y-1">
                  <p className="font-medium">Includes:</p>
                  <ul className="list-disc list-inside text-slate-600">
                    <li>Event volume and trends</li>
                    <li>Correlation rule triggers</li>
                    <li>Top event sources</li>
                    <li>Failed login attempts</li>
                    <li>Firewall blocks</li>
                    <li>Network anomalies</li>
                    <li>Timeline of critical events</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1"><Download className="w-3 h-3 mr-2" />PDF</Button>
                  <Button size="sm" variant="outline" className="flex-1">CSV</Button>
                  <Button size="sm" variant="outline" className="flex-1">JSON</Button>
                </div>
              </CardContent>
            </Card>

            {/* Incident Response Report */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <FileWarning className="w-5 h-5 text-orange-700" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Incident Response Report</CardTitle>
                    <CardDescription className="text-xs">
                      Complete incident lifecycle with timeline, actions, and outcomes
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs space-y-1">
                  <p className="font-medium">Includes:</p>
                  <ul className="list-disc list-inside text-slate-600">
                    <li>Incident summary and severity</li>
                    <li>Complete timeline of events</li>
                    <li>Actions taken and playbooks used</li>
                    <li>Affected systems and users</li>
                    <li>Root cause analysis</li>
                    <li>Remediation steps</li>
                    <li>Lessons learned</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1"><Download className="w-3 h-3 mr-2" />PDF</Button>
                  <Button size="sm" variant="outline" className="flex-1">CSV</Button>
                  <Button size="sm" variant="outline" className="flex-1">JSON</Button>
                </div>
              </CardContent>
            </Card>

            {/* Vulnerability Assessment */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Vulnerability Assessment</CardTitle>
                    <CardDescription className="text-xs">
                      Discovered vulnerabilities, risk scores, and remediation priorities
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs space-y-1">
                  <p className="font-medium">Includes:</p>
                  <ul className="list-disc list-inside text-slate-600">
                    <li>CVE details and CVSS scores</li>
                    <li>Affected systems inventory</li>
                    <li>Exploit availability</li>
                    <li>Risk prioritization matrix</li>
                    <li>Patch recommendations</li>
                    <li>Compliance impact</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1"><Download className="w-3 h-3 mr-2" />PDF</Button>
                  <Button size="sm" variant="outline" className="flex-1">CSV</Button>
                  <Button size="sm" variant="outline" className="flex-1">JSON</Button>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Report */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-700" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Compliance Report</CardTitle>
                    <CardDescription className="text-xs">
                      PCI-DSS, HIPAA, SOC2, ISO 27001 compliance status
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs space-y-1">
                  <p className="font-medium">Includes:</p>
                  <ul className="list-disc list-inside text-slate-600">
                    <li>Compliance framework mappings</li>
                    <li>Control implementation status</li>
                    <li>Gap analysis and findings</li>
                    <li>Evidence collection</li>
                    <li>Audit trail documentation</li>
                    <li>Remediation roadmap</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1"><Download className="w-3 h-3 mr-2" />PDF</Button>
                  <Button size="sm" variant="outline" className="flex-1">CSV</Button>
                  <Button size="sm" variant="outline" className="flex-1">JSON</Button>
                </div>
              </CardContent>
            </Card>

            {/* Phishing Campaign Report */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-pink-700" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Phishing Simulation Report</CardTitle>
                    <CardDescription className="text-xs">
                      Campaign results, user awareness metrics, and training effectiveness
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs space-y-1">
                  <p className="font-medium">Includes:</p>
                  <ul className="list-disc list-inside text-slate-600">
                    <li>Campaign statistics</li>
                    <li>Click-through rates</li>
                    <li>Data submission rates</li>
                    <li>User risk profiles</li>
                    <li>Department-level analysis</li>
                    <li>Training recommendations</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1"><Download className="w-3 h-3 mr-2" />PDF</Button>
                  <Button size="sm" variant="outline" className="flex-1">CSV</Button>
                  <Button size="sm" variant="outline" className="flex-1">JSON</Button>
                </div>
              </CardContent>
            </Card>

            {/* Pentesting Report */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Target className="w-5 h-5 text-slate-700" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Penetration Testing Report</CardTitle>
                    <CardDescription className="text-xs">
                      Offensive security findings, exploitation paths, and recommendations
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs space-y-1">
                  <p className="font-medium">Includes:</p>
                  <ul className="list-disc list-inside text-slate-600">
                    <li>Executive summary</li>
                    <li>Scope and methodology</li>
                    <li>Discovered vulnerabilities</li>
                    <li>Exploitation proof-of-concepts</li>
                    <li>Attack chain analysis</li>
                    <li>Remediation priorities</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1"><Download className="w-3 h-3 mr-2" />PDF</Button>
                  <Button size="sm" variant="outline" className="flex-1">CSV</Button>
                  <Button size="sm" variant="outline" className="flex-1">JSON</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scheduled Reports */}
          <Card className={cn('backdrop-blur-md', team === 'blue' ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-red-500/30 bg-red-500/5')}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className={cn('w-5 h-5', team === 'blue' ? 'text-cyan-400' : 'text-red-400')} />
                  <div>
                    <CardTitle className="text-base text-white">Scheduled Report Generation</CardTitle>
                    <CardDescription className={cn('text-xs', team === 'blue' ? 'text-cyan-200/70' : 'text-red-200/70')}>
                      Automate report generation and delivery via email
                    </CardDescription>
                  </div>
                </div>
                <Button size="sm">Configure Schedule</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className={cn('bg-black/60 p-3 rounded border', team === 'blue' ? 'border-cyan-500/20' : 'border-red-500/20')}>
                  <p className="font-semibold mb-1 text-white">Daily Digest</p>
                  <p className={team === 'blue' ? 'text-cyan-200/70' : 'text-red-200/70'}>Critical alerts and incidents summary</p>
                </div>
                <div className={cn('bg-black/60 p-3 rounded border', team === 'blue' ? 'border-cyan-500/20' : 'border-red-500/20')}>
                  <p className="font-semibold mb-1 text-white">Weekly Executive</p>
                  <p className={team === 'blue' ? 'text-cyan-200/70' : 'text-red-200/70'}>High-level metrics for leadership</p>
                </div>
                <div className={cn('bg-black/60 p-3 rounded border', team === 'blue' ? 'border-cyan-500/20' : 'border-red-500/20')}>
                  <p className="font-semibold mb-1 text-white">Monthly Compliance</p>
                  <p className={team === 'blue' ? 'text-cyan-200/70' : 'text-red-200/70'}>Full compliance status report</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}