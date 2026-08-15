import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { api } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Eye, EyeOff, Lock, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Steganography() {
  const [mode, setMode] = useState('encode');
  const [carrierType, setCarrierType] = useState('image');
  const [method, setMethod] = useState('lsb_image');
  const [carrierFile, setCarrierFile] = useState(null);
  const [hiddenData, setHiddenData] = useState('');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [compressionEnabled, setCompressionEnabled] = useState(true);
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [extractedData, setExtractedData] = useState('');

  // Fetch operations history (Steganography entity may not exist in all apps)
  const { data: operations = [] } = useQuery({
    queryKey: ['steganography_operations'],
    queryFn: async () => {
      try {
        const SteganographyEntity = api.entities?.Steganography;
        if (!SteganographyEntity) return [];
        return await SteganographyEntity.list('-updated_date', 20) || [];
      } catch {
        return [];
      }
    }
  });

  const methodOptions = {
    image: [
      { value: 'lsb_image', label: 'LSB Encoding (Least Significant Bit)' },
      { value: 'dct_image', label: 'DCT Encoding (Discrete Cosine Transform)' }
    ],
    text: [
      { value: 'word_shift', label: 'Word Shift (Unicode word spacing)' },
      { value: 'whitespace', label: 'Whitespace (Tab/space modulation)' },
      { value: 'unicode', label: 'Unicode Manipulation' }
    ],
    file: [
      { value: 'lsb_image', label: 'LSB Encoding' },
      { value: 'dct_image', label: 'DCT Encoding' }
    ]
  };

  const handleEncode = async () => {
    if (!carrierFile || !hiddenData) {
      toast.error('Carrier file and data required');
      return;
    }

    if (hiddenData.length > 10000000) {
      toast.error('Data too large (max 10MB)');
      return;
    }

    if (encryptionEnabled && !encryptionKey) {
      toast.error('Encryption key required');
      return;
    }

    setIsProcessing(true);
    setResult(null);
    try {
      const response = await api.functions.invoke('steganographyEncode', {
        carrier_type: carrierType,
        method: method,
        carrier_file_url: carrierFile.trim(),
        hidden_data: hiddenData,
        compression_enabled: compressionEnabled,
        encryption_enabled: encryptionEnabled,
        encryption_key: encryptionKey
      });

      const data = response?.data ?? response;
      setResult(data);
      toast.success('Data encoded successfully');
    } catch (error) {
      toast.error(`Encoding failed: ${error.message}`);
      setResult({ error: true, message: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecode = async () => {
    if (!carrierFile) {
      toast.error('Carrier file required');
      return;
    }

    if (encryptionEnabled && !encryptionKey) {
      toast.error('Encryption key required');
      return;
    }

    setIsProcessing(true);
    setExtractedData('');
    setResult(null);
    try {
      const response = await api.functions.invoke('steganographyDecode', {
        carrier_type: carrierType,
        method: method,
        carrier_file_url: carrierFile.trim(),
        encryption_enabled: encryptionEnabled,
        encryption_key: encryptionKey
      });

      const data = response?.data ?? response;
      setExtractedData(data?.extracted_data || '');
      setResult(data);
      toast.success('Data decoded successfully');
    } catch (error) {
      toast.error(`Decoding failed: ${error.message}`);
      setResult({ error: true, message: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Steganography"
        description="Hide data in images and text using advanced steganographic techniques"
      />

      <Tabs value={mode} onValueChange={setMode}>
        <TabsList className="bg-black/40 border border-slate-700">
          <TabsTrigger value="encode" className="gap-2">
            <Eye className="w-4 h-4" />
            Encode (Hide Data)
          </TabsTrigger>
          <TabsTrigger value="decode" className="gap-2">
            <EyeOff className="w-4 h-4" />
            Decode (Extract Data)
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            History
          </TabsTrigger>
        </TabsList>

        {/* Encode Tab */}
        <TabsContent value="encode" className="space-y-4">
          <Card className="bg-black/40 border-slate-700">
            <CardHeader>
              <CardTitle>Hide Data in Carrier Medium</CardTitle>
              <CardDescription>Embed sensitive data invisibly within images or text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Carrier Type Selection */}
              <div className="space-y-2">
                <Label className="text-slate-200">Carrier Type</Label>
                <Select value={carrierType} onValueChange={(val) => {
                  setCarrierType(val);
                  setMethod(methodOptions[val][0].value);
                  setCarrierFile('');
                }}>
                  <SelectTrigger className="text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image (JPG, PNG)</SelectItem>
                    <SelectItem value="text">Text Document</SelectItem>
                    <SelectItem value="file">Binary File</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Method Selection */}
              <div className="space-y-2">
                <Label className="text-slate-200">Encoding Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {methodOptions[carrierType]?.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Carrier File - Upload or URL */}
              <div className="space-y-2">
                <Label className="text-slate-200">Carrier File</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept={carrierType === 'image' ? 'image/*' : carrierType === 'text' ? '.txt,.doc,.docx' : '*'}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          setIsProcessing(true);
                          const response = await api.integrations.Core.UploadFile({ file });
                          setCarrierFile(response.file_url);
                          toast.success('File uploaded');
                          e.target.value = '';
                        } catch (error) {
                          toast.error('Upload failed');
                        } finally {
                          setIsProcessing(false);
                        }
                      }
                    }}
                    className="bg-slate-900 border-slate-700 text-slate-200 flex-1"
                  />
                  <Input
                    type="text"
                    placeholder="Or paste URL"
                    value={carrierFile}
                    onChange={(e) => setCarrierFile(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 flex-1"
                  />
                </div>
              </div>

              {/* Data to Hide */}
              <div className="space-y-2">
                <Label className="text-slate-200">Data to Hide</Label>
                <Textarea
                  placeholder="Enter text or payload to hide..."
                  value={hiddenData}
                  onChange={(e) => setHiddenData(e.target.value)}
                  rows={6}
                  className="bg-slate-900 border-slate-700 font-mono text-sm text-slate-200 placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-300">{hiddenData.length} characters</p>
              </div>

              {/* Compression & Encryption */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded border border-slate-700">
                  <input
                    type="checkbox"
                    checked={compressionEnabled}
                    onChange={(e) => setCompressionEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label className="text-sm cursor-pointer flex-1">Compress data</label>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded border border-slate-700">
                  <input
                    type="checkbox"
                    checked={encryptionEnabled}
                    onChange={(e) => setEncryptionEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label className="text-sm cursor-pointer flex-1">Encrypt data</label>
                </div>
              </div>

              {encryptionEnabled && (
                <div className="space-y-2">
                  <Label className="text-slate-200">Encryption Key (required)</Label>
                  <Input
                    type="password"
                    placeholder="Enter encryption passphrase"
                    value={encryptionKey}
                    onChange={(e) => setEncryptionKey(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500"
                  />
                </div>
              )}

              {/* Info Box */}
              <Card className="bg-blue-900/20 border-blue-700/50">
                <CardContent className="pt-4 text-xs text-slate-300 space-y-1">
                  <p className="flex items-center gap-2">
                    <Lock className="w-3 h-3 text-blue-400" />
                    {method === 'lsb_image' && 'LSB: 3 bits per pixel, ideal for large payloads'}
                    {method === 'dct_image' && 'DCT: More robust against compression, lower capacity'}
                    {method === 'whitespace' && 'Whitespace: Invisible character manipulation'}
                    {method === 'word_shift' && 'Word Shift: Unicode-based text steganography'}
                    {method === 'unicode' && 'Unicode: Zero-width character embedding'}
                  </p>
                </CardContent>
              </Card>

              <Button
                className="w-full bg-red-600 hover:bg-red-700 gap-2"
                onClick={handleEncode}
                disabled={isProcessing || !carrierFile || !hiddenData}
              >
                <Eye className="w-4 h-4" />
                {isProcessing ? 'Encoding...' : 'Encode Data'}
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card className="border-green-500/50 bg-green-500/10">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Encoding Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400">Method</p>
                    <p className="text-white font-mono">{result.method}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Payload Size</p>
                    <p className="text-white font-mono">{result.payload_size_bytes} bytes</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Capacity Used</p>
                    <p className="text-white font-mono">{result.capacity_percentage}%</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Execution Time</p>
                    <p className="text-white font-mono">{result.execution_time_ms}ms</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded border border-slate-700 font-mono text-xs break-all text-cyan-400">
                  {result.output_url}
                </div>

                <Button className="w-full gap-2" onClick={() => {
                  navigator.clipboard.writeText(result.output_url);
                  toast.success('URL copied');
                }}>
                  <Copy className="w-4 h-4" />
                  Copy Output URL
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Decode Tab */}
        <TabsContent value="decode" className="space-y-4">
          <Card className="bg-black/40 border-slate-700">
            <CardHeader>
              <CardTitle>Extract Hidden Data</CardTitle>
              <CardDescription>Recover data from steganographic carrier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Carrier Type */}
              <div className="space-y-2">
                <Label className="text-slate-200">Carrier Type</Label>
                <Select value={carrierType} onValueChange={(val) => {
                  setCarrierType(val);
                  setMethod(methodOptions[val][0].value);
                  setCarrierFile('');
                  setExtractedData('');
                }}>
                  <SelectTrigger className="text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image (JPG, PNG)</SelectItem>
                    <SelectItem value="text">Text Document</SelectItem>
                    <SelectItem value="file">Binary File</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Method */}
              <div className="space-y-2">
                <Label className="text-slate-200">Decoding Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {methodOptions[carrierType]?.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Carrier File - Upload or URL */}
              <div className="space-y-2">
                <Label className="text-slate-200">Carrier File</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept={carrierType === 'image' ? 'image/*' : carrierType === 'text' ? '.txt,.doc,.docx' : '*'}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          setIsProcessing(true);
                          const response = await api.integrations.Core.UploadFile({ file });
                          setCarrierFile(response.file_url);
                          toast.success('File uploaded');
                          e.target.value = '';
                        } catch (error) {
                          toast.error('Upload failed');
                        } finally {
                          setIsProcessing(false);
                        }
                      }
                    }}
                    className="bg-slate-900 border-slate-700 text-slate-200 flex-1"
                  />
                  <Input
                    type="text"
                    placeholder="Or paste URL"
                    value={carrierFile}
                    onChange={(e) => setCarrierFile(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 flex-1"
                  />
                </div>
              </div>

              {/* Decryption Key */}
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded border border-slate-700">
                <input
                  type="checkbox"
                  checked={encryptionEnabled}
                  onChange={(e) => setEncryptionEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <label className="text-sm cursor-pointer flex-1">Data is encrypted</label>
              </div>

              {encryptionEnabled && (
                <div className="space-y-2">
                  <Label className="text-slate-200">Decryption Key (required)</Label>
                  <Input
                    type="password"
                    placeholder="Enter decryption passphrase"
                    value={encryptionKey}
                    onChange={(e) => setEncryptionKey(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500"
                  />
                </div>
              )}

              <Button
                className="w-full bg-red-600 hover:bg-red-700 gap-2"
                onClick={handleDecode}
                disabled={isProcessing || !carrierFile}
              >
                <EyeOff className="w-4 h-4" />
                {isProcessing ? 'Decoding...' : 'Decode Data'}
              </Button>
            </CardContent>
          </Card>

          {extractedData && (
            <Card className="border-green-500/50 bg-green-500/10">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Data Extracted
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={extractedData}
                  readOnly
                  rows={8}
                  className="bg-slate-900 border-slate-700 font-mono text-sm"
                />
                <Button className="w-full gap-2" onClick={() => {
                  navigator.clipboard.writeText(extractedData);
                  toast.success('Data copied');
                }}>
                  <Copy className="w-4 h-4" />
                  Copy Extracted Data
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {operations.length === 0 ? (
            <Card className="bg-black/40 border-slate-700">
              <CardContent className="py-8 text-center text-slate-400">
                No operations yet
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {operations.map((op) => (
                <Card key={op.id} className="bg-black/40 border-slate-700">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400 text-xs mb-1">Operation</p>
                        <Badge className="capitalize">
                          {op.operation_type}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs mb-1">Method</p>
                        <p className="text-white font-mono text-xs">{op.method}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs mb-1">Status</p>
                        <Badge className={
                          op.status === 'completed' ? 'bg-green-900/30 text-green-300' :
                          op.status === 'failed' ? 'bg-red-900/30 text-red-300' :
                          'bg-yellow-900/30 text-yellow-300'
                        }>
                          {op.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs mb-1">Size</p>
                        <p className="text-white">{op.payload_size_bytes || 0} bytes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}