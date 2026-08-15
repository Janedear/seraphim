import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { Copy, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import pako from 'pako';

const EncoderCard = ({ title, description, encode, decode }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const handleEncode = () => {
    try {
      const result = encode(input);
      setOutput(result);
    } catch (error) {
      toast.error(`Encoding failed: ${error.message}`);
    }
  };

  const handleDecode = () => {
    try {
      const result = decode(input);
      setOutput(result);
    } catch (error) {
      toast.error(`Decoding failed: ${error.message}`);
    }
  };

  const handleCopy = () => {
    if (!output) {
      toast.error('No output to copy');
      return;
    }
    navigator.clipboard.writeText(output).then(() => toast.success('Copied to clipboard')).catch(() => toast.error('Copy failed'));
  };

  const handleSwap = () => {
    setInput(output);
    setOutput('');
  };

  return (
    <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-slate-500">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Input..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[80px] text-sm font-mono"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleEncode} className="flex-1">
            Encode
          </Button>
          <Button size="sm" onClick={handleDecode} className="flex-1" variant="outline">
            Decode
          </Button>
          <Button size="sm" onClick={handleSwap} variant="ghost">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
        <Textarea
          placeholder="Output..."
          value={output}
          readOnly
          className="min-h-[80px] text-sm font-mono bg-slate-900/50 border-slate-700 text-slate-200"
        />
        <Button size="sm" onClick={handleCopy} variant="outline" className="w-full">
          <Copy className="w-3 h-3 mr-2" />
          Copy Output
        </Button>
      </CardContent>
    </Card>
  );
};

const HashCard = ({ title, algorithm, hashFunc }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const handleHash = async () => {
    try {
      const result = await hashFunc(input);
      setOutput(result);
    } catch (error) {
      toast.error(`Hashing failed: ${error.message}`);
    }
  };

  const handleCopy = () => {
    if (!output) {
      toast.error('No hash to copy');
      return;
    }
    navigator.clipboard.writeText(output).then(() => toast.success('Copied to clipboard')).catch(() => toast.error('Copy failed'));
  };

  return (
    <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-slate-500">One-way hash function</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Input to hash..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[60px] text-sm font-mono"
        />
        <Button size="sm" onClick={handleHash} className="w-full">
          Generate {algorithm} Hash
        </Button>
        <Textarea
          placeholder="Hash output..."
          value={output}
          readOnly
          className="min-h-[60px] text-sm font-mono bg-slate-900/50 border-slate-700 text-slate-200"
        />
        <Button size="sm" onClick={handleCopy} variant="outline" className="w-full">
          <Copy className="w-3 h-3 mr-2" />
          Copy Hash
        </Button>
      </CardContent>
    </Card>
  );
};

const CompressionCard = ({ title, description, compress, decompress }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [fileMode, setFileMode] = useState(false);

  const handleCompress = () => {
    try {
      const result = compress(input);
      setOutput(result);
      toast.success('Compressed successfully');
    } catch (error) {
      toast.error(`Compression failed: ${error.message}`);
    }
  };

  const handleDecompress = () => {
    try {
      const result = decompress(input);
      setOutput(result);
      toast.success('Decompressed successfully');
    } catch (error) {
      toast.error(`Decompression failed: ${error.message}`);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64 = btoa(String.fromCharCode(...uint8Array));
      setInput(base64);
      setFileMode(true);
      toast.success('File loaded');
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([output], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'decompressed.txt';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Downloaded');
    } catch (error) {
      toast.error(`Download failed: ${error.message}`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success('Copied to clipboard');
  };

  return (
    <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-slate-500">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            id={`file-${title}`}
          />
          <label htmlFor={`file-${title}`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full" asChild>
              <span>
                <Upload className="w-3 h-3 mr-2" />
                Upload File
              </span>
            </Button>
          </label>
        </div>
        <Textarea
          placeholder="Input (text or base64 for binary)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[80px] text-sm font-mono"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleCompress} className="flex-1">
            Compress
          </Button>
          <Button size="sm" onClick={handleDecompress} className="flex-1" variant="outline">
            Decompress
          </Button>
        </div>
        <Textarea
          placeholder="Output..."
          value={output}
          readOnly
          className="min-h-[80px] text-sm font-mono bg-slate-50"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleCopy} variant="outline" className="flex-1">
            <Copy className="w-3 h-3 mr-2" />
            Copy
          </Button>
          <Button size="sm" onClick={handleDownload} variant="outline" className="flex-1">
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function EncodersDecoders() {
  // Base encoders/decoders
  const base64Encode = (str) => btoa(unescape(encodeURIComponent(str)));
  const base64Decode = (str) => decodeURIComponent(escape(atob(str)));

  const hexEncode = (str) => Array.from(str).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  const hexDecode = (str) => str.match(/.{1,2}/g).map(byte => String.fromCharCode(parseInt(byte, 16))).join('');

  const urlEncode = (str) => encodeURIComponent(str);
  const urlDecode = (str) => decodeURIComponent(str);

  const htmlEncode = (str) => str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  // Safe HTML entity decode without innerHTML (prevents XSS)
  const htmlDecode = (str) => {
    const entities = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'" };
    return str
      .replace(/&(?:amp|lt|gt|quot|#39|#x27);/gi, (m) => entities[m.toLowerCase()] ?? m)
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
      .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
  };

  const binaryEncode = (str) => str.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
  const binaryDecode = (str) => str.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join('');

  const asciiEncode = (str) => str.split('').map(c => c.charCodeAt(0)).join(' ');
  const asciiDecode = (str) => str.split(' ').map(n => String.fromCharCode(parseInt(n))).join('');

  const rot13Encode = (str) => str.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26));
  const rot13Decode = rot13Encode; // ROT13 is symmetric

  const base32Encode = (str) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    let result = '';
    
    for (let i = 0; i < str.length; i++) {
      bits += str.charCodeAt(i).toString(2).padStart(8, '0');
    }
    
    for (let i = 0; i < bits.length; i += 5) {
      const chunk = bits.substr(i, 5).padEnd(5, '0');
      result += alphabet[parseInt(chunk, 2)];
    }
    
    return result;
  };

  const base32Decode = (str) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    let result = '';
    
    for (let i = 0; i < str.length; i++) {
      const index = alphabet.indexOf(str[i].toUpperCase());
      if (index !== -1) {
        bits += index.toString(2).padStart(5, '0');
      }
    }
    
    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.substr(i, 8);
      if (byte.length === 8) {
        result += String.fromCharCode(parseInt(byte, 2));
      }
    }
    
    return result;
  };

  const morseEncode = (str) => {
    const morse = { 'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', ' ': '/' };
    return str.toUpperCase().split('').map(c => morse[c] || c).join(' ');
  };

  const morseDecode = (str) => {
    const morse = { '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y', '--..': 'Z', '-----': '0', '.----': '1', '..---': '2', '...--': '3', '....-': '4', '.....': '5', '-....': '6', '--...': '7', '---..': '8', '----.': '9', '/': ' ' };
    return str.split(' ').map(c => morse[c] || c).join('');
  };

  const unicodeEncode = (str) => str.split('').map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')).join('');
  const unicodeDecode = (str) => str.replace(/\\u[\dA-F]{4}/gi, match => String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16)));

  const jwtDecode = (str) => {
    try {
      const parts = str.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT');
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      return JSON.stringify({ header, payload }, null, 2);
    } catch (error) {
      throw new Error('Invalid JWT format');
    }
  };

  const jwtEncode = () => {
    throw new Error('JWT encoding requires signing - decode only');
  };

  // Hash functions
  const md5Hash = async (str) => {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('MD5', msgBuffer).catch(() => {
      // MD5 not supported in Web Crypto (e.g. some browsers). For non-security uses only (e.g. legacy checksums).
      return 'MD5 not supported in this browser';
    });
    if (typeof hashBuffer === 'string') return hashBuffer;
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const sha1Hash = async (str) => {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const sha256Hash = async (str) => {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const sha512Hash = async (str) => {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-512', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Compression functions
  const zlibCompress = (str) => {
    const input = new TextEncoder().encode(str);
    const compressed = pako.deflate(input);
    return btoa(String.fromCharCode(...compressed));
  };

  const zlibDecompress = (str) => {
    try {
      const compressed = Uint8Array.from(atob(str), c => c.charCodeAt(0));
      const decompressed = pako.inflate(compressed);
      return new TextDecoder().decode(decompressed);
    } catch (error) {
      throw new Error('Invalid zlib data');
    }
  };

  const gzipCompress = (str) => {
    const input = new TextEncoder().encode(str);
    const compressed = pako.gzip(input);
    return btoa(String.fromCharCode(...compressed));
  };

  const gzipDecompress = (str) => {
    try {
      const compressed = Uint8Array.from(atob(str), c => c.charCodeAt(0));
      const decompressed = pako.ungzip(compressed);
      return new TextDecoder().decode(decompressed);
    } catch (error) {
      throw new Error('Invalid gzip data');
    }
  };

  const deflateCompress = (str) => {
    const input = new TextEncoder().encode(str);
    const compressed = pako.deflateRaw(input);
    return btoa(String.fromCharCode(...compressed));
  };

  const deflateDecompress = (str) => {
    try {
      const compressed = Uint8Array.from(atob(str), c => c.charCodeAt(0));
      const decompressed = pako.inflateRaw(compressed);
      return new TextDecoder().decode(decompressed);
    } catch (error) {
      throw new Error('Invalid deflate data');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Encoders & Decoders"
        description="Encode, decode, and hash data in various formats"
      />

      <Tabs defaultValue="text" className="space-y-4">
        <TabsList className="bg-black/40 border border-red-500/30">
          <TabsTrigger value="text">Text Encoding</TabsTrigger>
          <TabsTrigger value="binary">Binary & Numeric</TabsTrigger>
          <TabsTrigger value="compression">Compression</TabsTrigger>
          <TabsTrigger value="crypto">Cryptographic</TabsTrigger>
          <TabsTrigger value="web">Web Formats</TabsTrigger>
          <TabsTrigger value="hashing">Hashing</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <EncoderCard
              title="Base64"
              description="Standard Base64 encoding"
              encode={base64Encode}
              decode={base64Decode}
            />
            <EncoderCard
              title="Base32"
              description="Base32 encoding (RFC 4648)"
              encode={base32Encode}
              decode={base32Decode}
            />
            <EncoderCard
              title="ROT13"
              description="Caesar cipher with shift of 13"
              encode={rot13Encode}
              decode={rot13Decode}
            />
            <EncoderCard
              title="Morse Code"
              description="International morse code"
              encode={morseEncode}
              decode={morseDecode}
            />
            <EncoderCard
              title="Unicode Escape"
              description="\\uXXXX format"
              encode={unicodeEncode}
              decode={unicodeDecode}
            />
          </div>
        </TabsContent>

        <TabsContent value="binary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <EncoderCard
              title="Hexadecimal"
              description="Convert to/from hex"
              encode={hexEncode}
              decode={hexDecode}
            />
            <EncoderCard
              title="Binary"
              description="Convert to/from binary"
              encode={binaryEncode}
              decode={binaryDecode}
            />
            <EncoderCard
              title="ASCII Codes"
              description="Character to ASCII codes"
              encode={asciiEncode}
              decode={asciiDecode}
            />
          </div>
        </TabsContent>

        <TabsContent value="compression" className="space-y-4">
          <Card className="border-red-500/30 bg-red-500/10 mb-4 backdrop-blur-md">
            <CardContent className="pt-4">
              <p className="text-xs text-red-200">
                💡 Upload compressed files or paste base64-encoded compressed data. 
                Output is automatically base64-encoded for binary data.
              </p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CompressionCard
              title="Zlib"
              description="Zlib compression/decompression"
              compress={zlibCompress}
              decompress={zlibDecompress}
            />
            <CompressionCard
              title="Gzip"
              description="Gzip compression/decompression"
              compress={gzipCompress}
              decompress={gzipDecompress}
            />
            <CompressionCard
              title="Deflate"
              description="Raw deflate compression"
              compress={deflateCompress}
              decompress={deflateDecompress}
            />
          </div>
        </TabsContent>

        <TabsContent value="crypto" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <EncoderCard
              title="JWT Decoder"
              description="Decode JSON Web Tokens"
              encode={jwtEncode}
              decode={jwtDecode}
            />
          </div>
        </TabsContent>

        <TabsContent value="web" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <EncoderCard
              title="URL Encoding"
              description="Percent encoding for URLs"
              encode={urlEncode}
              decode={urlDecode}
            />
            <EncoderCard
              title="HTML Entities"
              description="HTML entity encoding"
              encode={htmlEncode}
              decode={htmlDecode}
            />
          </div>
        </TabsContent>

        <TabsContent value="hashing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <HashCard
              title="MD5"
              algorithm="MD5"
              hashFunc={md5Hash}
            />
            <HashCard
              title="SHA-1"
              algorithm="SHA-1"
              hashFunc={sha1Hash}
            />
            <HashCard
              title="SHA-256"
              algorithm="SHA-256"
              hashFunc={sha256Hash}
            />
            <HashCard
              title="SHA-512"
              algorithm="SHA-512"
              hashFunc={sha512Hash}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}