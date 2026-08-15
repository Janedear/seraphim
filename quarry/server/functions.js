import { createHash, randomUUID } from 'node:crypto';
import net from 'node:net';
import { create, filter, list, remove, update } from './store.js';
import { invokeLlm, llmKeyPresent } from './llm.js';
import { getOperator } from './operator.js';
import { decodePayload, embedPngText, encodePayload, extractPngText } from './stego.js';

const uploads = new Map();

export function saveUpload(buffer, filename = 'upload.bin') {
  const id = randomUUID();
  const url = `/local-api/files/${id}`;
  uploads.set(id, { buffer, filename, created: Date.now() });
  return { id, url, filename, size: buffer.length };
}

export function getUpload(id) {
  return uploads.get(id) || null;
}

function withinTimeframe(iso, timeframe = '24h') {
  if (!iso) return true;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return true;
  const now = Date.now();
  const map = {
    '24h': 24,
    last_24_hours: 24,
    last_7_days: 24 * 7,
    '7d': 24 * 7,
    last_30_days: 24 * 30,
    '30d': 24 * 30,
    monthly: 24 * 30,
  };
  const hours = map[timeframe] || 24 * 7;
  return now - t <= hours * 3600_000;
}

export function detectAiHeuristic(text) {
  const trimmed = (text || '').trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgWord = words.length ? words.join('').length / words.length : 0;
  const uniq = new Set(words.map((w) => w.toLowerCase())).size;
  const ttr = words.length ? uniq / words.length : 0;
  const avgSent = sentences.length ? words.length / sentences.length : 0;
  const hedges = (trimmed.match(/\b(furthermore|moreover|additionally|it is important to note|in conclusion|overall)\b/gi) || []).length;
  const contractions = (trimmed.match(/\b(don't|isn't|can't|won't|I'm|we're)\b/gi) || []).length;

  let score = 40;
  if (avgSent > 22) score += 15;
  if (ttr < 0.42 && words.length > 40) score += 18;
  if (hedges >= 2) score += 12;
  if (avgWord > 5.2) score += 8;
  if (contractions === 0 && words.length > 30) score += 10;
  if (contractions >= 3) score -= 15;
  if (words.length < 12) score -= 10;
  score = Math.max(4, Math.min(96, Math.round(score)));

  const isAI = score >= 58;
  return {
    isAI,
    confidence: score,
    model: isAI ? 'GPT-like (heuristic)' : 'Human-like (heuristic)',
    signals: [
      { indicator: 'Lexical diversity', explanation: `Type-token ratio ${ttr.toFixed(2)} (lower can indicate templated prose).` },
      { indicator: 'Sentence length', explanation: `Average ${avgSent.toFixed(1)} words per sentence.` },
      { indicator: 'Discourse markers', explanation: hedges ? `${hedges} formal transition phrase(s) found.` : 'Few formal AI-style transitions.' },
      { indicator: 'Contractions', explanation: contractions ? `${contractions} contractions (more typical of human writing).` : 'No contractions in a longer sample.' },
    ],
    processingTime: 'heuristic',
    success: true,
  };
}

function entropy(buf) {
  const counts = new Array(256).fill(0);
  for (const b of buf) counts[b] += 1;
  let e = 0;
  for (const c of counts) {
    if (!c) continue;
    const p = c / buf.length;
    e -= p * Math.log2(p);
  }
  return e;
}

async function hibpLookup(sha1hex) {
  const hash = sha1hex.trim().toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(hash)) {
    return { error: 'SHA-1 hash required (40 hex characters). Use SHA-1 of password to check breaches.', status: 400 };
  }
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { 'Add-Padding': 'true' },
  });
  if (!res.ok) return { error: `HIBP API error: ${res.status}`, status: res.status };
  const text = await res.text();
  let count = 0;
  for (const line of text.split(/\r?\n/)) {
    const [h, c] = line.split(':');
    if (h?.toLowerCase() === suffix) {
      count = parseInt(c || '0', 10);
      break;
    }
  }
  return {
    success: true,
    pwned: count > 0,
    count,
    message: count > 0
      ? `This hash appears ${count} times in known breaches`
      : 'Hash not found in Have I Been Pwned database',
  };
}

function scanPorts(host, ports, timeout = 700) {
  return Promise.all(ports.map((port) => new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (state) => {
      socket.destroy();
      resolve({ port, state });
    };
    const timer = setTimeout(() => done('filtered'), timeout);
    socket.on('connect', () => {
      clearTimeout(timer);
      done('open');
    });
    socket.on('error', () => {
      clearTimeout(timer);
      done('closed');
    });
  })));
}

function emitSiem(partial) {
  const now = new Date();
  return create('SiemEvent', {
    timestamp: now.toISOString().replace('T', ' ').slice(0, 19),
    severity: partial.severity || 'info',
    source: partial.source || 'Seraphim',
    message: partial.message,
    sourceIp: partial.sourceIp || null,
    destIp: partial.destIp || null,
    user: partial.user || null,
    created_date: now.toISOString(),
  });
}

function correlateAndAlert(event) {
  const rules = list('CorrelationRule').filter((r) => r.enabled);
  const created = [];
  for (const rule of rules) {
    const hay = `${event.message} ${event.source}`.toLowerCase();
    const match =
      (rule.name.toLowerCase().includes('brute') && hay.includes('failed')) ||
      (rule.name.toLowerCase().includes('sql') && hay.includes('sql')) ||
      (rule.name.toLowerCase().includes('exfil') && hay.includes('transfer')) ||
      (rule.name.toLowerCase().includes('privilege') && hay.includes('privilege')) ||
      (rule.name.toLowerCase().includes('lateral') && hay.includes('authentication'));
    if (!match) continue;
    update('CorrelationRule', rule.id, { triggers: (rule.triggers || 0) + 1 });
    created.push(create('Alert', {
      title: `${rule.name}: ${event.message}`,
      description: `Correlation rule "${rule.name}" matched a SIEM event.`,
      severity: rule.severity || event.severity || 'medium',
      status: 'new',
      detection_source: 'SIEM',
      mitre_tactic: 'Discovery',
      created_date: new Date().toISOString(),
    }));
  }
  return created;
}

const COMMON_PORTS = [21, 22, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080, 8443];

const X86 = {
  0x90: ['nop', ''],
  0xc3: ['ret', ''],
  0xc2: ['ret', 'imm16'],
  0xcc: ['int3', ''],
  0x55: ['push', 'rbp'],
  0x5d: ['pop', 'rbp'],
  0x56: ['push', 'rsi'],
  0x57: ['push', 'rdi'],
  0x53: ['push', 'rbx'],
  0x50: ['push', 'rax'],
  0x58: ['pop', 'rax'],
  0x51: ['push', 'rcx'],
  0x59: ['pop', 'rcx'],
};

function disassembleBytes(bytes) {
  const instructions = [];
  let i = 0;
  while (i < bytes.length && instructions.length < 80) {
    const b = bytes[i];
    const known = X86[b];
    if (b === 0xe8 && i + 4 < bytes.length) {
      const rel = bytes.readInt32LE(i + 1);
      instructions.push({ address: `0x${i.toString(16).padStart(4, '0')}`, bytes: bytes.subarray(i, i + 5).toString('hex'), mnemonic: 'call', operands: `0x${(i + 5 + rel).toString(16)}` });
      i += 5;
    } else if (b === 0xeb && i + 1 < bytes.length) {
      instructions.push({ address: `0x${i.toString(16).padStart(4, '0')}`, bytes: bytes.subarray(i, i + 2).toString('hex'), mnemonic: 'jmp', operands: `short ${bytes.readInt8(i + 1)}` });
      i += 2;
    } else if (known) {
      instructions.push({ address: `0x${i.toString(16).padStart(4, '0')}`, bytes: b.toString(16).padStart(2, '0'), mnemonic: known[0], operands: known[1] });
      i += 1;
    } else if (b === 0x48) {
      instructions.push({ address: `0x${i.toString(16).padStart(4, '0')}`, bytes: bytes.subarray(i, i + 2).toString('hex'), mnemonic: 'rex.w', operands: 'prefix' });
      i += 1;
    } else {
      instructions.push({ address: `0x${i.toString(16).padStart(4, '0')}`, bytes: b.toString(16).padStart(2, '0'), mnemonic: 'db', operands: `0x${b.toString(16)}` });
      i += 1;
    }
  }
  return instructions;
}

function vulnCatalog(deviceType = '', apps = []) {
  const stack = `${deviceType} ${apps.join(' ')}`.toLowerCase();
  const vulns = [];
  if (stack.includes('windows')) {
    vulns.push({ cve_id: 'CVE-2024-21338', title: 'Windows Kernel Elevation of Privilege', cvss_score: 7.8, severity: 'high', component: 'Windows Kernel', exploit_available: true });
    vulns.push({ cve_id: 'CVE-2024-21412', title: 'Internet Shortcut Files Security Feature Bypass', cvss_score: 8.1, severity: 'high', component: 'Windows SmartScreen', exploit_available: true });
  }
  if (stack.includes('ubuntu') || stack.includes('linux')) {
    vulns.push({ cve_id: 'CVE-2024-1086', title: 'nf_tables use-after-free LPE', cvss_score: 7.8, severity: 'high', component: 'Linux kernel', exploit_available: true });
  }
  if (stack.includes('chrome')) {
    vulns.push({ cve_id: 'CVE-2024-4947', title: 'V8 type confusion', cvss_score: 8.8, severity: 'high', component: 'Google Chrome', exploit_available: true });
  }
  if (stack.includes('iis') || stack.includes('web') || stack.includes('nginx') || stack.includes('apache')) {
    vulns.push({ cve_id: 'CVE-2021-44228', title: 'Log4Shell-class remote code execution pattern', cvss_score: 10, severity: 'critical', component: 'Java/logging stack', exploit_available: true });
  }
  if (!vulns.length) {
    vulns.push({ cve_id: 'CVE-2023-44487', title: 'HTTP/2 Rapid Reset', cvss_score: 7.5, severity: 'high', component: 'HTTP/2 services', exploit_available: true });
  }
  const risk = Math.min(95, 30 + vulns.length * 18);
  return {
    success: true,
    device_info: { device_type: deviceType || 'unknown', apps, risk_score: risk },
    vulnerabilities: vulns,
    recommendations: [
      'Apply the latest vendor security updates for listed CVEs.',
      'Confirm EDR isolation works on this host class.',
      'Restrict inbound admin ports to jump hosts.',
    ],
  };
}

function currentUser() {
  return getOperator();
}

export const handlers = {
  async getAlertRules() {
    return list('AlertRule');
  },

  async createAlertRule(body) {
    return create('AlertRule', {
      name: body.name || 'Untitled rule',
      condition: body.condition || 'critical_incident_count',
      threshold: String(body.threshold ?? '1'),
      channels: body.channels || ['in_app'],
      enabled: body.enabled !== false,
    });
  },

  async deleteAlertRule(body) {
    const ok = remove('AlertRule', body.ruleId || body.id);
    return { success: ok };
  },

  async toggleAlertRule(body) {
    const row = update('AlertRule', body.ruleId || body.id, { enabled: Boolean(body.enabled) });
    return { success: Boolean(row), rule: row };
  },

  async getAlertNotifications() {
    return { notifications: list('Notification') };
  },

  async dismissNotification(body) {
    remove('Notification', body.notificationId || body.id);
    return { success: true };
  },

  async getReportHistory() {
    return list('Report').map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      generated_at: r.generated_at,
      generated_by: r.generated_by,
      content: r.content,
    }));
  },

  async generateAIReport(body) {
    const timeframe = body.timeframe || 'last_7_days';
    const reportType = body.reportType || 'daily-summary';
    const alerts = list('Alert').filter((a) => withinTimeframe(a.created_date, timeframe));
    const incidents = list('Incident').filter((i) => withinTimeframe(i.created_date, timeframe));
    const devices = list('Device');
    const events = list('SiemEvent').filter((e) => withinTimeframe(e.created_date, timeframe));
    const sampleAlerts = alerts.slice(0, 8).map((a) => ({
      title: a.title,
      severity: a.severity,
      status: a.status,
      tactic: a.mitre_tactic,
      host: a.device_hostname,
    }));
    const sampleIncidents = incidents.slice(0, 6).map((i) => ({
      title: i.title,
      severity: i.severity,
      status: i.status,
    }));

    const fallback = {
      title: `Seraphim ${reportType} (${timeframe})`,
      executive_summary: `${alerts.length} alerts, ${incidents.length} incidents, and ${events.length} SIEM events in scope across ${devices.length} devices.`,
      key_metrics: [
        { metric: 'alerts', value: alerts.length, trend: 'n/a' },
        { metric: 'critical_alerts', value: alerts.filter((a) => a.severity === 'critical').length, trend: 'n/a' },
        { metric: 'open_incidents', value: incidents.filter((i) => i.status !== 'closed').length, trend: 'n/a' },
        { metric: 'siem_events', value: events.length, trend: 'n/a' },
      ],
      findings: sampleAlerts.slice(0, 5).map((a) => `${a.severity}: ${a.title} (${a.host || 'unknown host'})`),
      recommendations: [
        'Triage new critical alerts and attach them to incidents.',
        'Review isolated devices before restoring network access.',
        'Tune correlation rules that are not firing.',
      ],
      conclusion: 'Report built from live local-store records, not placeholder counts.',
    };

    const llm = await invokeLlm({
      prompt: `Generate a ${reportType} security report for timeframe ${timeframe}.
ALERTS: ${JSON.stringify(sampleAlerts)}
INCIDENTS: ${JSON.stringify(sampleIncidents)}
DEVICE_COUNT: ${devices.length}
SIEM_EVENT_COUNT: ${events.length}
Return JSON with title, executive_summary, key_metrics (array of {metric,value,trend}), findings (string array), recommendations (string array), conclusion.`,
    });

    const content = llm && llm.title ? { ...fallback, ...llm } : fallback;
    const report = {
      id: randomUUID(),
      name: content.title,
      type: reportType,
      content,
      generated_at: new Date().toISOString(),
      generated_by: currentUser().email,
      llm: Boolean(llm && llm.title),
    };
    create('Report', report);
    return report;
  },

  async scheduleReport(body) {
    const row = create('ScheduledReport', {
      reportType: body.reportType || body.type || 'daily-summary',
      frequency: body.frequency || 'daily',
      recipients: body.recipients || body.scheduleRecipients || '',
      next_run: new Date(Date.now() + 24 * 3600_000).toISOString(),
    });
    return { success: true, schedule: row };
  },

  async detectAIText(body) {
    const text = body.text?.trim();
    if (!text || text.length > 50_000) {
      return { error: 'text is required and must be 1-50000 characters', status: 400 };
    }
    const heuristic = detectAiHeuristic(text);
    const llm = await invokeLlm({
      prompt: `Analyze if this text is AI-generated. Return JSON {isAI, confidence (0-100), model, signals:[{indicator,explanation}]}.\nTEXT:\n${text.slice(0, 8000)}`,
    });
    if (llm && typeof llm.isAI === 'boolean') {
      return { success: true, ...llm, processingTime: 'llm', heuristic };
    }
    return heuristic;
  },

  async scanDeviceVulnerabilities(body) {
    const deviceType = body.deviceType || body.os || body.target || 'Windows 11';
    const apps = body.apps || body.applications || [];
    const catalog = vulnCatalog(deviceType, Array.isArray(apps) ? apps : []);
    const llm = await invokeLlm({
      prompt: `List current high-impact CVEs for ${deviceType} apps=${JSON.stringify(apps)}. Return JSON {device_info:{device_type,risk_score}, vulnerabilities:[{cve_id,title,cvss_score,severity,component,exploit_available}], recommendations:[string]}`,
    });
    const result = llm?.vulnerabilities ? { success: true, ...llm } : catalog;
    emitSiem({
      severity: 'medium',
      source: 'Vulnerability Scanner',
      message: `Vulnerability scan completed for ${deviceType} (${(result.vulnerabilities || []).length} findings)`,
      destIp: body.target || null,
    });
    return result;
  },

  async searchBreaches(body) {
    const term = (body.term || body.query || body.email || '').trim().toLowerCase();
    if (!term) return { error: 'term is required', status: 400 };
    const localHits = list('Alert')
      .filter((a) => `${a.user_name || ''} ${a.device_hostname || ''} ${a.title}`.toLowerCase().includes(term))
      .map((a) => ({ source: 'local-alerts', title: a.title, user: a.user_name, host: a.device_hostname }));
    const seeded = [];
    if (term.includes('jsmith') || term.includes('corp.local')) {
      seeded.push({ source: 'lab-corpus', email: 'jsmith@corp.local', breach: 'LabCorp 2024 dump', fields: ['email', 'username'] });
    }
    return {
      success: true,
      count: localHits.length + seeded.length,
      results: [...seeded, ...localHits],
      data: [...seeded, ...localHits],
      message: process.env.BREACH_VIP_API_KEY
        ? 'Local corpus plus configured breach API'
        : 'Local lab corpus (set BREACH_VIP_API_KEY for live breach.vip)',
    };
  },

  async osintLookup(body) {
    const query = (body.query || body.ip || body.target || '').trim();
    if (!query) return { error: 'query is required', status: 400 };
    const ip = query;
    const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
    let geo = {};
    if (ipv4) {
      try {
        const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,isp,org,as,query`);
        if (res.ok) geo = await res.json();
      } catch {
        geo = {};
      }
    }
    let abuse = null;
    if (ipv4 && process.env.ABUSEIPDB_API_KEY) {
      try {
        const res = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`, {
          headers: { Key: process.env.ABUSEIPDB_API_KEY, Accept: 'application/json' },
        });
        if (res.ok) abuse = (await res.json()).data;
      } catch {
        abuse = null;
      }
    }
    return {
      success: true,
      query: ip,
      abuseConfidenceScore: abuse?.abuseConfidenceScore ?? 0,
      totalReports: abuse?.totalReports ?? 0,
      country: abuse?.countryCode || geo.countryCode,
      usageType: abuse?.usageType || geo.org,
      isp: abuse?.isp || geo.isp,
      domain: abuse?.domain,
      reportedAt: abuse?.lastReportedAt,
      categories: [],
      configured: Boolean(process.env.ABUSEIPDB_API_KEY),
      geo,
    };
  },

  async reconLookup(body) {
    const type = body.type;
    const target = (body.target || '').trim().toLowerCase();
    if (!type || !target) return { error: 'Missing type or target', status: 400 };
    if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(target) && !/^(\d{1,3}\.){3}\d{1,3}$/.test(target)) {
      return { error: 'Invalid domain or IP', status: 400 };
    }
    const base = process.env.HACKERTARGET_BASE || 'https://api.hackertarget.com';
    const path = {
      whois: `/whois/?q=${encodeURIComponent(target)}`,
      dns: `/dnslookup/?q=${encodeURIComponent(target)}`,
      subdomain: `/hostsearch/?q=${encodeURIComponent(target)}`,
      ssl: `/sslcertinfo/?q=${encodeURIComponent(target)}`,
    }[type];
    if (!path) return { error: 'Invalid type. Use: whois, dns, subdomain, ssl', status: 400 };
    const res = await fetch(`${base}${path}`);
    const text = await res.text();
    return { success: res.ok, type, target, data: text };
  },

  async nmapScan(body) {
    const target = (body.target || '').trim();
    if (!target) return { error: 'target is required', status: 400 };
    if (target === '169.254.169.254') return { error: 'Target blocked', status: 400 };
    const ports = await scanPorts(target, COMMON_PORTS, body.timeout || 700);
    const open = ports.filter((p) => p.state === 'open');
    emitSiem({
      severity: open.length ? 'medium' : 'info',
      source: 'Network Scanner',
      message: `Port scan of ${target}: ${open.length} open port(s)`,
      destIp: target,
    });
    return {
      success: true,
      target,
      scan_id: randomUUID(),
      profile: body.profile || 'default',
      ports,
      open_ports: open.map((p) => p.port),
      data: ports,
    };
  },

  async toolOrchestratorScan(body) {
    if (body.mode === 'simulation') {
      return { error: 'simulation mode is disabled', status: 400 };
    }
    const target = body.target || body.domain || body.ip;
    const recon = target ? await handlers.reconLookup({ type: body.type || 'dns', target }) : { skipped: true };
    const nmap = body.ip || /^(\d{1,3}\.){3}\d{1,3}$/.test(target || '')
      ? await handlers.nmapScan({ target: body.ip || target })
      : { skipped: true };
    return { success: true, recon, nmap };
  },

  async lookupHashBreach(body) {
    return hibpLookup(body.hash || '');
  },

  async analyzeMalware(body) {
    let buf = Buffer.alloc(0);
    if (body.fileBase64) {
      buf = Buffer.from(body.fileBase64, 'base64');
    } else if (body.hash && /^[a-f0-9]{64}$/i.test(body.hash)) {
      return {
        success: true,
        verdict: body.hash.startsWith('e3b0c442') ? 'clean' : 'unknown',
        score: body.hash.startsWith('e3b0c442') ? 0 : 35,
        sha256: body.hash,
        families: [],
        indicators: ['Hash-only lookup. Provide a file for PE/entropy analysis.'],
        configured: Boolean(process.env.VIRUSTOTAL_API_KEY),
      };
    }
    const sha256 = createHash('sha256').update(buf).digest('hex');
    const mz = buf.length >= 2 && buf[0] === 0x4d && buf[1] === 0x5a;
    const ent = buf.length ? entropy(buf) : 0;
    const strings = buf.toString('latin1').match(/[ -~]{6,}/g) || [];
    const suspicious = strings.filter((s) => /powershell|cmd\.exe|virtualalloc|createprocess|http:\/\//i.test(s)).slice(0, 8);
    let score = 10;
    if (mz) score += 15;
    if (ent > 7.2) score += 25;
    if (suspicious.length) score += 20;
    const verdict = score >= 50 ? 'suspicious' : 'likely_benign';
    emitSiem({
      severity: score >= 50 ? 'high' : 'info',
      source: 'Sandbox',
      message: `Malware analysis ${verdict} (score ${score}) sha256=${sha256.slice(0, 12)}…`,
    });
    return {
      success: true,
      verdict,
      score,
      sha256,
      entropy: Number(ent.toFixed(2)),
      pe: mz,
      families: [],
      indicators: [
        mz ? 'MZ/PE header present' : 'Not a PE file',
        `Shannon entropy ${ent.toFixed(2)}`,
        ...suspicious.map((s) => `string: ${s.slice(0, 80)}`),
      ],
    };
  },

  async analyzeAssembly(body) {
    const asm = (body.asmCode || body.asm || '').trim();
    if (!asm) return { error: 'asmCode is required', status: 400 };
    const findings = [];
    if (/int\s+0x80|syscall/i.test(asm)) findings.push('System call present');
    if (/xor\s+\w+,\s*\1/i.test(asm)) findings.push('Register zeroing via XOR (common in shells)');
    if (/call\s+.*win(exec|inet)/i.test(asm)) findings.push('Windows API call pattern');
    const llm = await invokeLlm({
      prompt: `Analyze this assembly for capability and risk. Return JSON {summary, findings:[string], risk:low|medium|high}.\n${asm.slice(0, 4000)}`,
    });
    return {
      success: true,
      summary: llm?.summary || `Parsed ${asm.split('\n').length} lines. ${findings.length} heuristic signals.`,
      findings: llm?.findings || findings,
      risk: llm?.risk || (findings.length >= 2 ? 'medium' : 'low'),
    };
  },

  async disassembleBinary(body) {
    let bytes = Buffer.alloc(0);
    if (body.bytesBase64) bytes = Buffer.from(body.bytesBase64, 'base64');
    else if (body.hex) bytes = Buffer.from(String(body.hex).replace(/\s+/g, ''), 'hex');
    if (!bytes.length) return { error: 'bytesBase64 or hex required', status: 400 };
    return { success: true, instructions: disassembleBytes(bytes), count: Math.min(80, bytes.length) };
  },

  async steganographyEncode(body) {
    const { carrier_type, method, hidden_data, encryption_enabled, encryption_key, carrier_file_url } = body;
    if (!carrier_type || !method || !hidden_data) {
      return { error: 'Missing required parameters', status: 400 };
    }
    const key = encryption_enabled ? encryption_key : '';
    const start = Date.now();
    let output = '';
    let outputUrl = '';
    if (carrier_type === 'text') {
      output = encodePayload(method, hidden_data, key);
      const uploaded = saveUpload(Buffer.from(output, 'utf8'), 'stego.txt');
      outputUrl = uploaded.url;
    } else {
      const id = (carrier_file_url || '').split('/').pop();
      const file = id ? getUpload(id) : null;
      const carrier = file?.buffer || Buffer.from(carrier_file_url || 'empty');
      const stegoBuf = embedPngText(carrier, encodePayload('unicode', hidden_data, key));
      const uploaded = saveUpload(stegoBuf, 'stego.png');
      outputUrl = uploaded.url;
      output = outputUrl;
    }
    const op = create('Steganography', {
      operation_type: 'encode',
      carrier_type,
      method,
      hidden_data,
      status: 'completed',
      output_url: outputUrl,
      payload_size_bytes: hidden_data.length,
      execution_time_ms: Date.now() - start,
    });
    return {
      status: 'completed',
      operation_id: op.id,
      method,
      carrier_type,
      output_url: outputUrl,
      encoded_preview: carrier_type === 'text' ? output.slice(0, 400) : undefined,
      payload_size_bytes: hidden_data.length,
      message: 'Data embedded. Decode with the same method and key.',
    };
  },

  async steganographyDecode(body) {
    const { carrier_type, method, carrier_file_url, encryption_enabled, encryption_key } = body;
    if (!carrier_type || !method || !carrier_file_url) {
      return { error: 'Missing required parameters', status: 400 };
    }
    const key = encryption_enabled ? encryption_key : '';
    const start = Date.now();
    const id = carrier_file_url.split('/').pop();
    const file = getUpload(id);
    let extracted = '';
    if (carrier_type === 'text') {
      const text = file ? file.buffer.toString('utf8') : carrier_file_url;
      extracted = decodePayload(method, text, key);
    } else if (file) {
      extracted = decodePayload('unicode', extractPngText(file.buffer), key);
    } else {
      extracted = '';
    }
    const op = create('Steganography', {
      operation_type: 'decode',
      carrier_type,
      method,
      status: 'completed',
      hidden_data: extracted,
      payload_size_bytes: extracted.length,
      execution_time_ms: Date.now() - start,
    });
    return {
      status: 'completed',
      operation_id: op.id,
      method,
      carrier_type,
      extracted_data: extracted,
      payload_size_bytes: extracted.length,
      encryption_enabled: Boolean(encryption_enabled),
      message: extracted ? 'Data extracted from carrier' : 'No embedded Seraphim payload found',
    };
  },

  async listHoneypots() {
    const honeypots = list('Honeypot').map((h) => ({
      id: h.id,
      name: h.name,
      type: h.type,
      port: h.port,
      status: h.status,
      interactions: h.interactions ?? 0,
      dataCaptured: h.data_captured ?? h.dataCaptured ?? '0',
      attackers: h.attacker_count ?? h.attackers ?? 0,
      lastActivity: h.last_activity ?? h.lastActivity ?? 'Never',
    }));
    return { success: true, honeypots };
  },

  async listPhishingCampaigns() {
    return { success: true, campaigns: list('PhishingCampaign') };
  },

  async runAttackSimulation(body) {
    const simulationType = body.simulationType || body.type || 'connectivity';
    const target = body.target || 'lab-network';
    const event = emitSiem({
      severity: simulationType === 'connectivity' ? 'info' : 'high',
      source: 'Attack Simulation',
      message: `Lab simulation "${simulationType}" executed against ${target}`,
      destIp: target,
    });
    const alerts = correlateAndAlert(event);
    const alert = create('Alert', {
      title: `Attack simulation: ${simulationType}`,
      description: `Controlled lab simulation against ${target}.`,
      severity: simulationType === 'connectivity' ? 'informational' : 'high',
      status: 'new',
      detection_source: 'Attack Simulation',
      mitre_tactic: 'Discovery',
      network_destination: target,
    });
    return {
      success: true,
      configured: true,
      simulation_type: simulationType,
      target,
      alerts_created: [alert.id, ...alerts.map((a) => a.id)],
      siem_event_id: event.id,
      findings: [
        `Simulation ${simulationType} recorded as a SIEM event.`,
        `${alerts.length} correlation rule(s) fired.`,
      ],
    };
  },

  async executeBeaconCommand(body) {
    const { beacon_id, command_type, command, c2_server_id, timeout = 300 } = body;
    if (!beacon_id || !command_type || !command) {
      return { error: 'Missing required parameters: beacon_id, command_type, command', status: 400 };
    }
    const beacons = filter('Beacon', { beacon_id });
    if (!beacons.length) return { error: 'Beacon not found', status: 404 };
    const beacon = beacons[0];
    if (beacon.status !== 'active') {
      return { error: `Beacon status is ${beacon.status}, not active`, status: 409 };
    }
    const labOutput = {
      whoami: `${beacon.username}\\${beacon.hostname}`,
      hostname: beacon.hostname,
      ipconfig: beacon.ip_address,
    }[String(command).trim().toLowerCase()] || `lab-ack: queued ${command_type} (no remote execution)`;

    const row = create('Command', {
      beacon_id,
      c2_server_id: c2_server_id || beacon.c2_server_id,
      command_type,
      command,
      arguments: body.arguments || {},
      status: 'completed',
      result: labOutput,
      issued_by: currentUser().email,
      issued_at: new Date().toISOString(),
      timeout,
    });
    update('Beacon', beacon.id, {
      last_callback: new Date().toISOString(),
      callback_count: (beacon.callback_count || 0) + 1,
    });
    return {
      status: 'queued',
      command_id: row.id,
      beacon_id,
      result: labOutput,
      message: 'Lab command recorded. No remote implant was contacted.',
    };
  },

  async getBeaconStatus(body) {
    const query = {};
    if (body.beacon_id) query.beacon_id = body.beacon_id;
    if (body.c2_server_id) query.c2_server_id = body.c2_server_id;
    const beacons = Object.keys(query).length ? filter('Beacon', query) : list('Beacon');
    const beaconStatus = beacons.map((beacon) => {
      const lastCallbackTime = beacon.last_callback ? new Date(beacon.last_callback) : null;
      const secondsSinceCallback = lastCallbackTime ? (Date.now() - lastCallbackTime.getTime()) / 1000 : null;
      let health = 'unknown';
      if (beacon.status === 'dead') health = 'dead';
      else if (secondsSinceCallback !== null && secondsSinceCallback > (beacon.sleep_interval || 60) * 3) health = 'stale';
      else if (beacon.status === 'active') health = 'healthy';
      return {
        beacon_id: beacon.beacon_id,
        hostname: beacon.hostname,
        username: beacon.username,
        ip_address: beacon.ip_address,
        process_name: beacon.process_name,
        integrity_level: beacon.integrity_level,
        os_version: beacon.os_version,
        status: beacon.status,
        health,
        last_callback: beacon.last_callback,
        callback_count: beacon.callback_count,
        uptime_seconds: secondsSinceCallback,
      };
    });
    return {
      beacons: beaconStatus,
      total: beaconStatus.length,
      healthy: beaconStatus.filter((b) => b.health === 'healthy').length,
      stale: beaconStatus.filter((b) => b.health === 'stale').length,
      dead: beaconStatus.filter((b) => b.health === 'dead').length,
    };
  },

  async agentStagerGenerator(body) {
    const beaconId = `bcn-${randomUUID().slice(0, 8)}`;
    const listener = body.listener_id ? filter('Listener', { id: body.listener_id })[0] : list('Listener')[0];
    const profile = {
      kind: 'seraphim-lab-checkin-profile',
      beacon_id: beaconId,
      c2_server_id: body.c2_server_id,
      listener_id: body.listener_id,
      listener_host: listener?.host || '127.0.0.1',
      listener_port: listener?.port || 8443,
      platform: body.platform,
      architecture: body.architecture,
      format: body.output_format || 'json',
      note: 'This is a lab profile, not an implant. It registers a beacon record only.',
    };
    create('Beacon', {
      beacon_id: beaconId,
      c2_server_id: body.c2_server_id,
      hostname: 'lab-pending',
      username: 'lab',
      ip_address: '127.0.0.1',
      process_name: 'lab-profile',
      integrity_level: 'medium',
      os_version: body.platform,
      status: 'active',
      last_callback: new Date().toISOString(),
      callback_count: 0,
      sleep_interval: 60,
    });
    const encoded = JSON.stringify(profile, null, 2);
    return {
      beacon_id: beaconId,
      format: body.output_format || 'json',
      payload_size_bytes: Buffer.byteLength(encoded),
      profile: encoded,
      instructions: {
        execution: 'Import the downloaded JSON profile in the C2 lab console — no host execution.',
      },
    };
  },

  async generatePayload(body) {
    const technique = body.technique || body.mitre || 'T1059.001';
    return {
      success: true,
      technique,
      kind: 'detection-test',
      steps: [
        `Create a SIEM event tagged ${technique}`,
        'Confirm the matching alert rule fires',
        'Attach the alert to an incident',
      ],
      message: 'Lab detection test plan. No exploit payload is generated.',
    };
  },

  async c2_listener(body) {
    const row = create('Listener', {
      name: body.name || 'lab-listener',
      c2_server_id: body.c2_server_id,
      protocol: body.protocol || 'https',
      host: body.host || '127.0.0.1',
      port: Number(body.port) || 8443,
      status: 'running',
    });
    return { success: true, listener: row };
  },
};

export async function invokeFunction(name, body = {}) {
  const fn = handlers[name];
  if (!fn) return { error: `Unknown function: ${name}`, status: 404 };
  return fn(body || {});
}

export { llmKeyPresent };
