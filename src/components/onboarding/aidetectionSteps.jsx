export const aiDetectionOnboardingSteps = [
  {
    title: "Welcome to AI Detection",
    description: "Detect AI-generated content, identify vulnerabilities in your infrastructure, and gather intelligence on breached credentials.",
    cardPosition: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    highlights: [
      "AI Content Detection for identifying LLM-generated text",
      "Vulnerability Scanning to assess your security posture",
      "Breach Intelligence for credential threat hunting"
    ],
    tips: "Complete this tour to unlock all features and best practices."
  },
  {
    title: "AI Content Analysis",
    description: "Analyze text submissions to detect synthetic content and AI-generated material. Our multi-layered neural engine examines linguistic patterns and statistical distributions.",
    cardPosition: { top: '20%', right: '20px', transform: 'none' },
    targetSelector: '[data-onboard-target=\"ai-tab\"]',
    highlights: [
      "Paste any text for instant AI detection",
      "Get confidence scores and detection signals",
      "View detailed analysis breakdown"
    ],
    tips: "The confidence score combines multiple linguistic indicators for accuracy."
  },
  {
    title: "Vulnerability Scanner",
    description: "Identify security weaknesses in your infrastructure by specifying device types, installed applications, and browser extensions.",
    cardPosition: { top: '20%', right: '20px', transform: 'none' },
    targetSelector: '[data-onboard-target=\"vuln-tab\"]',
    highlights: [
      "Select your device type and version",
      "Add installed applications for deeper analysis",
      "View known CVEs with remediation steps",
      "Assess attack vectors and overall risk"
    ],
    tips: "More detailed input results in more accurate vulnerability assessment."
  },
  {
    title: "Breach Intelligence Search",
    description: "Query global breach databases to identify compromised credentials associated with email addresses, usernames, or other identifiers.",
    cardPosition: { top: '20%', right: '20px', transform: 'none' },
    targetSelector: '[data-onboard-target=\"breach-tab\"]',
    highlights: [
      "Search multiple field types simultaneously",
      "Use wildcards (* and ?) for pattern matching",
      "View breached data sources and categories",
      "Track search history for ongoing investigations"
    ],
    tips: "Wildcard matching is powerful but rate-limited (15 req/min). Use precise patterns for better results."
  },
  {
    title: "Search Field Options",
    description: "Target specific data types in breach databases for more precise reconnaissance.",
    cardPosition: { bottom: '20%', left: '50%', transform: 'translateX(-50%)' },
    highlights: [
      "Email - Find breaches by email address",
      "Username - Target specific usernames",
      "Password - Identify compromised credentials",
      "Phone, Name, IP, Domain - Multi-vector search",
      "SteamID, DiscordID, UUID - Platform-specific IDs"
    ],
    tips: "Select only the fields you need to maximize rate limit efficiency."
  },
  {
    title: "Advanced Options",
    description: "Fine-tune your searches with wildcard matching and case sensitivity for specialized reconnaissance scenarios.",
    cardPosition: { bottom: '20%', left: '50%', transform: 'translateX(-50%)' },
    highlights: [
      "Wildcard Matching - Use * for any length, ? for single char",
      "Case Sensitive - Enforce exact case matching for precision",
      "Pattern Examples - admin*, user?, *@target.com"
    ],
    tips: "Case sensitivity can help avoid false positives in credential databases."
  },
  {
    title: "Interpreting Results",
    description: "Understand breach intelligence results including source databases, data categories, and compromised information.",
    cardPosition: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    highlights: [
      "Source indicates which breach database the data came from",
      "Categories show the type of breach event",
      "Compromised Data displays the actual leaked information",
      "Search history tracks all your reconnaissance activities"
    ],
    tips: "Not all fields may be present in every breach record. Review what's available carefully."
  },
  {
    title: "You're All Set!",
    description: "You now have access to powerful threat detection and intelligence gathering tools. Start with the tab you need most.",
    cardPosition: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    highlights: [
      "Use AI Detection for content forensics",
      "Use Vulnerability Scanner for security assessments",
      "Use Breach Intelligence for credential threat hunting",
      "Check search history to review past queries"
    ],
    tips: "You can restart this tour anytime via the settings menu if you need a refresher."
  }
];

export default aiDetectionOnboardingSteps;