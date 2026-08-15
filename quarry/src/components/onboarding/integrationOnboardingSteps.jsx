/**
 * Global integration onboarding steps - shown to first-time users
 * Walks through key integrations and setup.
 */
export const integrationOnboardingSteps = [
  {
    title: 'Welcome to Seraphim',
    description: 'Your security operations platform for blue team defense and red team operations. Configure integrations to unlock malware analysis, OSINT, attack simulations, and more.',
    cardPosition: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    highlights: [
      'Blue Team: Alerts, Incidents, Honeypots, Threat Intel',
      'Red Team: Recon, Phishing, Attack Sims, Payloads',
      'Works out of the box for Recon, Password tools, Nmap'
    ],
    tips: 'Complete this tour to learn what to configure for full functionality.',
  },
  {
    title: 'Integration Setup',
    description: 'Most powerful features need API keys. Go to Settings → Integrations to configure VirusTotal, AbuseIPDB, and other services. Keys are stored securely in your Seraphim project.',
    cardPosition: { top: '20%', right: '20px', transform: 'none' },
    highlights: [
      'VirusTotal – Malware Sandbox file/hash analysis',
      'AbuseIPDB – OSINT / Attacker Intelligence',
      'Attack Simulation API – Red team exercises',
      'Data entities – PhishingCampaign, Honeypot'
    ],
    tips: 'Free tiers available for VirusTotal (4 req/min) and AbuseIPDB (1000 req/day).',
  },
  {
    title: 'Works Without Config',
    description: 'These features work immediately with no setup: Recon Tools (WHOIS, DNS, subdomain), Password breach lookup (Have I Been Pwned), Network Scanner (nmap.online), and AI Detection (with AI provider in Settings).',
    cardPosition: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    highlights: [
      'Recon Tools – HackerTarget free API',
      'Password Tools – SHA-1 breach lookup',
      'Network Scanner – Default nmap service',
      'AI Detection – Add provider in Settings'
    ],
    tips: 'Start with Recon Tools and Password Tools to explore without any configuration.',
  },
  {
    title: "You're Ready",
    description: 'Open Settings → Integrations anytime to configure APIs or run the integration tests. Switch between Blue Team (defensive) and Red Team (offensive) using the sidebar toggle.',
    cardPosition: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    highlights: [
      'Settings → Integrations – Configure & test APIs',
      'Blue/Red toggle – Switch team perspective',
      'Academy – Learn security concepts'
    ],
    tips: 'Bookmark the Integration Setup page for quick access when you add new API keys.',
  },
];

export default integrationOnboardingSteps;
