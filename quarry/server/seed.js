import { create, update } from './store.js';

const ago = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString();

export function seedIfNeeded(hasAnyRows) {
  if (hasAnyRows()) return false;
  seedAll();
  return true;
}

export function seedAll() {
  const policyStd = create('Policy', {
    name: 'Standard Endpoint',
    description: 'Default realtime protection for workstations',
    is_default: true,
    device_count: 3,
    realtime_protection: true,
    cloud_lookup: true,
    behavioral_analysis: true,
    exploit_protection: true,
    scan_schedule: 'daily',
    scan_time: '02:00',
    scan_type: 'quick',
    web_protection: true,
    block_malicious_urls: true,
    block_phishing: true,
    ransomware_protection: true,
    firewall_enabled: true,
  });

  const policyLock = create('Policy', {
    name: 'High Security',
    description: 'USB block, SSL inspection, full scans',
    is_default: false,
    device_count: 2,
    realtime_protection: true,
    ssl_inspection: true,
    device_control: true,
    block_usb: true,
    scan_type: 'full',
    scan_schedule: 'daily',
  });

  const d1 = create('Device', {
    hostname: 'ws-finance-04',
    os: 'Windows 11',
    os_version: '23H2',
    ip_address: '10.0.2.89',
    mac_address: '00:1A:2B:3C:4D:01',
    status: 'online',
    risk_score: 72,
    last_seen: ago(8),
    agent_version: '1.4.2',
    policy_id: policyStd.id,
    policy_name: policyStd.name,
    user_name: 'jsmith',
    department: 'Finance',
    location: 'HQ-Floor-3',
    tags: ['workstation', 'finance'],
  });

  const d2 = create('Device', {
    hostname: 'srv-dc-01',
    os: 'Windows Server 2022',
    os_version: '21H2',
    ip_address: '10.0.1.10',
    mac_address: '00:1A:2B:3C:4D:02',
    status: 'online',
    risk_score: 18,
    last_seen: ago(2),
    agent_version: '1.4.2',
    policy_id: policyLock.id,
    policy_name: policyLock.name,
    user_name: 'SYSTEM',
    department: 'IT',
    location: 'DC-Rack-A',
    tags: ['domain-controller'],
  });

  const d3 = create('Device', {
    hostname: 'ws-eng-12',
    os: 'Ubuntu 24.04',
    os_version: '24.04',
    ip_address: '10.0.2.67',
    mac_address: '00:1A:2B:3C:4D:03',
    status: 'online',
    risk_score: 41,
    last_seen: ago(15),
    agent_version: '1.4.1',
    policy_id: policyStd.id,
    policy_name: policyStd.name,
    user_name: 'bwilson',
    department: 'Engineering',
    location: 'HQ-Floor-2',
    tags: ['workstation', 'linux'],
  });

  const d4 = create('Device', {
    hostname: 'laptop-sales-09',
    os: 'Windows 11',
    os_version: '22H2',
    ip_address: '10.0.2.105',
    mac_address: '00:1A:2B:3C:4D:04',
    status: 'isolated',
    risk_score: 88,
    last_seen: ago(40),
    agent_version: '1.3.9',
    policy_id: policyStd.id,
    policy_name: policyStd.name,
    user_name: 'mchen',
    department: 'Sales',
    location: 'Remote',
    tags: ['laptop', 'isolated'],
  });

  const d5 = create('Device', {
    hostname: 'srv-web-02',
    os: 'Ubuntu 22.04',
    os_version: '22.04',
    ip_address: '10.0.1.80',
    mac_address: '00:1A:2B:3C:4D:05',
    status: 'online',
    risk_score: 55,
    last_seen: ago(4),
    agent_version: '1.4.2',
    policy_id: policyLock.id,
    policy_name: policyLock.name,
    user_name: 'www-data',
    department: 'IT',
    location: 'DC-Rack-B',
    tags: ['web', 'production'],
  });

  const a1 = create('Alert', {
    title: 'Suspicious PowerShell encoded command',
    description: 'Encoded IEX download cradle observed on a finance workstation.',
    severity: 'critical',
    status: 'new',
    device_id: d1.id,
    device_hostname: d1.hostname,
    mitre_tactic: 'Execution',
    mitre_technique: 'T1059.001',
    mitre_technique_name: 'PowerShell',
    detection_source: 'EDR',
    process_name: 'powershell.exe',
    command_line: 'powershell -enc SQBFAFgA',
    user_name: 'jsmith',
    created_date: ago(25),
  });

  const a2 = create('Alert', {
    title: 'Multiple failed SSH logins',
    description: '5+ failed SSH authentications from an external IP in 3 minutes.',
    severity: 'high',
    status: 'in_progress',
    device_id: d5.id,
    device_hostname: d5.hostname,
    mitre_tactic: 'Credential Access',
    mitre_technique: 'T1110.001',
    mitre_technique_name: 'Password Guessing',
    detection_source: 'Firewall',
    network_destination: '10.0.1.80',
    network_port: 22,
    created_date: ago(40),
  });

  create('Alert', {
    title: 'Possible SQL injection on /login',
    description: 'WAF matched tautology patterns against the public web app.',
    severity: 'high',
    status: 'new',
    device_id: d5.id,
    device_hostname: d5.hostname,
    mitre_tactic: 'Initial Access',
    mitre_technique: 'T1190',
    mitre_technique_name: 'Exploit Public-Facing Application',
    detection_source: 'WAF',
    network_destination: '10.0.1.80',
    network_port: 443,
    created_date: ago(55),
  });

  create('Alert', {
    title: 'Account lockout: jsmith',
    description: 'AD lockout after repeated bad passwords.',
    severity: 'medium',
    status: 'new',
    device_id: d2.id,
    device_hostname: d2.hostname,
    mitre_tactic: 'Credential Access',
    mitre_technique: 'T1110',
    mitre_technique_name: 'Brute Force',
    detection_source: 'Active Directory',
    user_name: 'jsmith',
    created_date: ago(70),
  });

  create('Alert', {
    title: 'Unusual DNS volume',
    description: 'High query rate to a newly registered domain.',
    severity: 'low',
    status: 'new',
    device_id: d3.id,
    device_hostname: d3.hostname,
    mitre_tactic: 'Command and Control',
    mitre_technique: 'T1071.004',
    mitre_technique_name: 'DNS',
    detection_source: 'Proxy',
    network_destination: '8.8.8.8',
    user_name: 'bwilson',
    created_date: ago(90),
  });

  const incident = create('Incident', {
    title: 'Finance workstation suspected compromise',
    description: 'PowerShell cradle plus lockout on the same user. Isolation recommended.',
    severity: 'critical',
    status: 'open',
    priority: 'p1',
    assigned_to: 'preview@seraphim.local',
    assigned_to_name: 'Preview User',
    alert_ids: [a1.id],
    device_ids: [d1.id, d4.id],
    sla_due: ago(-180),
    sla_breached: false,
    tags: ['endpoint', 'finance'],
    comments: [],
    timeline: [{ at: ago(20), event: 'Incident opened from EDR alert' }],
    created_date: ago(20),
  });

  create('Incident', {
    title: 'External brute force against web/SSH',
    description: 'Firewall and WAF alerts clustered on srv-web-02.',
    severity: 'high',
    status: 'in_progress',
    priority: 'p2',
    assigned_to: 'preview@seraphim.local',
    assigned_to_name: 'Preview User',
    alert_ids: [a2.id],
    device_ids: [d5.id],
    tags: ['perimeter'],
    comments: [],
    timeline: [],
    created_date: ago(35),
  });

  create('Incident', {
    title: 'Closed: phishing mailbox sweep',
    description: 'User-reported message quarantined. No payload executed.',
    severity: 'medium',
    status: 'closed',
    priority: 'p3',
    alert_ids: [],
    device_ids: [],
    tags: ['email'],
    comments: [],
    timeline: [],
    created_date: ago(60 * 26),
  });

  update('Alert', a1.id, { incident_id: incident.id });

  const siemSeed = [
    { severity: 'critical', source: 'Firewall', message: 'Multiple failed SSH login attempts detected', sourceIp: '45.33.32.156', destIp: '10.0.1.80', user: null, minutes: 12 },
    { severity: 'high', source: 'IDS', message: 'Possible SQL injection attempt on web server', sourceIp: '185.220.101.47', destIp: '10.0.1.80', user: null, minutes: 18 },
    { severity: 'medium', source: 'Active Directory', message: 'Account locked due to too many failed login attempts', sourceIp: '10.0.2.105', destIp: '10.0.1.10', user: 'jsmith', minutes: 28 },
    { severity: 'high', source: 'Endpoint', message: 'Suspicious PowerShell execution detected', sourceIp: '10.0.2.89', destIp: null, user: 'jsmith', minutes: 32 },
    { severity: 'info', source: 'Proxy', message: 'High volume of DNS queries to unusual domain', sourceIp: '10.0.2.67', destIp: '8.8.8.8', user: 'bwilson', minutes: 48 },
    { severity: 'low', source: 'Endpoint', message: 'Unsigned driver load blocked', sourceIp: '10.0.2.89', destIp: null, user: 'jsmith', minutes: 80 },
    { severity: 'high', source: 'Honeypot', message: 'Cowrie: SSH password spray against lab-ssh-22', sourceIp: '203.0.113.44', destIp: '10.0.9.22', user: 'root', minutes: 6 },
    { severity: 'medium', source: 'EDR', message: 'LSASS handle opened by non-system process', sourceIp: '10.0.2.105', destIp: null, user: 'mchen', minutes: 110 },
  ];

  for (const ev of siemSeed) {
    create('SiemEvent', {
      timestamp: ago(ev.minutes).replace('T', ' ').slice(0, 19),
      severity: ev.severity,
      source: ev.source,
      message: ev.message,
      sourceIp: ev.sourceIp,
      destIp: ev.destIp,
      user: ev.user,
      created_date: ago(ev.minutes),
    });
  }

  create('CorrelationRule', { name: 'Brute Force Detection', description: '5+ failed logins within 5 minutes', enabled: true, triggers: 2, severity: 'high' });
  create('CorrelationRule', { name: 'Lateral Movement', description: 'Unusual authentication patterns across systems', enabled: true, triggers: 1, severity: 'critical' });
  create('CorrelationRule', { name: 'Data Exfiltration', description: 'Large outbound transfers to external IPs', enabled: true, triggers: 0, severity: 'high' });
  create('CorrelationRule', { name: 'Privilege Escalation', description: 'User privilege changes or admin access patterns', enabled: true, triggers: 1, severity: 'critical' });

  create('AlertRule', { name: 'Critical Incident Alert', condition: 'critical_incident_count', threshold: '3', channels: ['in_app', 'email'], enabled: true });
  create('AlertRule', { name: 'Malware Detection', condition: 'malware_detected', threshold: '1', channels: ['in_app', 'slack'], enabled: true });
  create('AlertRule', { name: 'SIEM brute force', condition: 'failed_login_burst', threshold: '5', channels: ['in_app'], enabled: true });

  create('Honeypot', {
    name: 'lab-ssh-22',
    type: 'SSH',
    port: 22,
    status: 'active',
    interactions: 14,
    data_captured: '12 creds',
    attacker_count: 4,
    last_activity: ago(6),
  });
  create('Honeypot', {
    name: 'lab-http-8080',
    type: 'HTTP',
    port: 8080,
    status: 'active',
    interactions: 7,
    data_captured: '3 form posts',
    attacker_count: 2,
    last_activity: ago(50),
  });

  create('PhishingCampaign', {
    name: 'Q3 password reset drill',
    status: 'completed',
    template: 'Simulated IT Support',
    sent: 40,
    opened: 18,
    clicked: 6,
    reported: 11,
  });

  const c2 = create('C2Server', { name: 'lab-teamserver-01', status: 'active' });
  create('Listener', {
    name: 'https-443',
    c2_server_id: c2.id,
    protocol: 'https',
    host: '127.0.0.1',
    port: 8443,
    status: 'running',
  });
  create('Agent', {
    name: 'lab-checkin-profile',
    c2_server_id: c2.id,
    status: 'ready',
    platform: 'windows',
  });
  create('Beacon', {
    beacon_id: 'bcn-lab-001',
    c2_server_id: c2.id,
    hostname: 'ws-finance-04',
    username: 'jsmith',
    ip_address: '10.0.2.89',
    process_name: 'seraphim-lab.exe',
    integrity_level: 'medium',
    os_version: 'Windows 11',
    status: 'active',
    last_callback: ago(1),
    callback_count: 12,
    sleep_interval: 60,
  });

  create('User', {
    email: 'preview@seraphim.local',
    full_name: 'Preview User',
    role: 'admin',
    department: 'SOC',
  });
}
