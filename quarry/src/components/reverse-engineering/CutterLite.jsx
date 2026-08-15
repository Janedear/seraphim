import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/client';

const HexViewer = ({ data, maxLines = 50 }) => {
  const lines = data.split('\n').slice(0, maxLines);
  
  return (
    <div className="space-y-2 font-mono text-xs">
      {lines.map((line, idx) => (
        <div key={idx} className="flex gap-4 p-2 hover:bg-slate-800/50 rounded">
          <span className="text-slate-500 w-12 text-right">{String(idx * 16).padStart(4, '0')}</span>
          <span className="text-cyan-400 flex-1 whitespace-pre-wrap break-words">{line}</span>
        </div>
      ))}
      {lines.length >= maxLines && (
        <p className="text-slate-500 text-xs p-2 italic">... {Math.max(0, data.split('\n').length - maxLines)} more lines</p>
      )}
    </div>
  );
};

export default function CutterLite() {
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [hexDump, setHexDump] = useState('');
  const [disassembly, setDisassembly] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    setLoading(true);
    setFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Generate hex dump
      const hex = Array.from(bytes)
        .map((b, i) => {
          const hex = b.toString(16).toUpperCase().padStart(2, '0');
          return (i + 1) % 16 === 0 ? hex + '\n' : hex + ' ';
        })
        .join('');

      setHexDump(hex);
      setFileData(bytes);

      // Set file info
      setFileInfo({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        uploaded: new Date().toLocaleString(),
      });

      try {
        let binary = '';
        const chunk = 8192;
        for (let i = 0; i < Math.min(bytes.length, 256 * 1024); i += chunk) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        const base64 = btoa(binary);
        const { data } = await api.functions.invoke('disassembleBinary', { bytesBase64: base64 });
        setDisassembly(data?.disassembly || data?.message || 'Disassembly unavailable. Set DISASSEMBLY_API_URL for real disassembly.');
      } catch (err) {
        toast.error('Disassembly failed: ' + (err?.message || 'Unknown error'));
        setDisassembly('; Disassembly failed. Configure DISASSEMBLY_API_URL or use Assembly Analyzer tab for text-based analysis.');
      }

      toast.success(`Loaded ${file.name} (${file.size} bytes)`);
    } catch (error) {
      toast.error('Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const downloadHex = () => {
    if (!hexDump) return;
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(hexDump));
    element.setAttribute('download', `${fileName}.hex`);
    element.click();
    toast.success('Hex dump downloaded');
  };

  return (
    <div className="space-y-6">
      <Card className="bg-black/40 backdrop-blur-md border-red-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            Cutter Lite - Binary Analyzer
          </CardTitle>
          <CardDescription className="text-slate-400">
            Lightweight binary disassembly and hex analysis tool
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center w-full p-8 border-2 border-dashed border-slate-700 rounded-lg hover:border-red-500/50 transition-colors cursor-pointer"
            onClick={() => document.getElementById('file-input').click()}>
            <div className="text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-300 font-medium">Drop binary or click to upload</p>
              <p className="text-xs text-slate-500 mt-1">ELF, PE, Mach-O, or raw binary</p>
            </div>
            <input
              id="file-input"
              type="file"
              hidden
              onChange={handleFileUpload}
              accept=".bin,.exe,.elf,.o,.so,.dylib"
            />
          </div>

          {fileInfo && (
            <div className="p-3 bg-slate-800/50 rounded border border-slate-700 text-sm">
              <p className="text-slate-300"><strong>File:</strong> {fileInfo.name}</p>
              <p className="text-slate-400 text-xs">Size: {fileInfo.size} bytes | Type: {fileInfo.type}</p>
              <p className="text-slate-500 text-xs">Loaded: {fileInfo.uploaded}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {fileData && (
        <Card className="bg-black/40 backdrop-blur-md border-red-500/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Binary Analysis</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={downloadHex}
                className="border-slate-700 gap-2"
              >
                <Download className="w-3 h-3" />
                Export Hex
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="disassembly" className="space-y-4">
              <TabsList className="bg-slate-800 border border-slate-700">
                <TabsTrigger value="disassembly">Disassembly</TabsTrigger>
                <TabsTrigger value="hex">Hex Dump</TabsTrigger>
                <TabsTrigger value="strings">Strings</TabsTrigger>
              </TabsList>

              <TabsContent value="disassembly" className="space-y-3">
                <div className="bg-slate-900 rounded border border-slate-700 p-4 overflow-auto max-h-[400px]">
                  <HexViewer data={disassembly} />
                </div>
              </TabsContent>

              <TabsContent value="hex" className="space-y-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(hexDump);
                    toast.success('Hex copied');
                  }}
                  className="gap-2"
                >
                  <Copy className="w-3 h-3" />
                  Copy All
                </Button>
                <div className="bg-slate-900 rounded border border-slate-700 p-4 overflow-auto max-h-[400px]">
                  <HexViewer data={hexDump} />
                </div>
              </TabsContent>

              <TabsContent value="strings" className="space-y-3">
                <div className="bg-slate-900 rounded border border-slate-700 p-4">
                  <div className="font-mono text-xs space-y-1">
                    {Array.from(fileData)
                      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
                      .join('')
                      .split('')
                      .reduce((acc, char) => {
                        if (char === '.') {
                          return acc;
                        }
                        if (!acc.current) acc.current = '';
                        acc.current += char;
                        if (acc.current.length > 40) {
                          acc.strings.push(acc.current);
                          acc.current = '';
                        }
                        return acc;
                      }, { strings: [], current: '' })
                      .strings.map((s, i) => (
                        <p key={i} className="text-green-400">{s}</p>
                      ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}