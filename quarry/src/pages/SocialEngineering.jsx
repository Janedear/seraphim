import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { Users, Copy, Zap, Mail } from "lucide-react";
import { toast } from "sonner";

export default function SocialEngineering() {
  const [pretextType, setPretextType] = useState('it_support');
  const [companyName, setCompanyName] = useState('');
  const [targetName, setTargetName] = useState('');
  const [generatedPretext, setGeneratedPretext] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('');

  const pretexts = {
    it_support: {
      phone: `Hello, this is {caller} from IT Support. We've detected unusual activity on your account and need to verify your credentials to prevent suspension. Could you please confirm your username?`,
      email: `Subject: URGENT: Account Security Alert\n\nDear {target},\n\nWe have detected suspicious login attempts on your account from an unknown location. To secure your account, please verify your identity by clicking the link below:\n\n[Verification Link]\n\nThis link will expire in 24 hours. If you don't recognize this activity, contact IT immediately.\n\nBest regards,\nIT Security Team\n{company}`
    },
    vendor: {
      phone: `Hi, this is {caller} from {company}'s primary vendor. We're updating our payment system and need to verify the accounts payable contact information. Who should I speak with regarding invoices?`,
      email: `Subject: Invoice Payment - Action Required\n\nDear {target},\n\nWe need to update our records for invoice #{invoice}. Please confirm your current payment processing contact and any changes to your banking information.\n\nInvoice Details:\nAmount: $15,847.23\nDue Date: {date}\n\nReply to this email or call us at {phone}.\n\nThank you,\nAccounts Department\n{company} Vendor Services`
    },
    executive: {
      phone: `This is {caller}, assistant to the CEO. We have an urgent matter requiring immediate access to financial records. The CEO is in a meeting with the board and needs this information within the hour.`,
      email: `Subject: URGENT - Board Meeting Request\n\nDear {target},\n\nThe CEO needs the Q4 financial summary for an emergency board meeting in 30 minutes. Please send the latest reports to this email immediately.\n\nThis is time-sensitive. Call my direct line if you have questions: {phone}\n\nRegards,\n{caller}\nExecutive Assistant to CEO\n{company}`
    },
    contractor: {
      phone: `Hello, I'm {caller} from the security contractor firm. We're performing routine maintenance on the building's access systems and need to verify which departments have access to server rooms.`,
      email: `Subject: Building Access System Maintenance\n\nDear {target},\n\nWe will be performing scheduled maintenance on the building access control systems this weekend. Please provide a list of employees requiring access to restricted areas.\n\nMaintenance Window: Saturday 6AM - 2PM\n\nSend access lists to this email by EOD Friday.\n\nThank you,\n{caller}\nSecurity Systems Contractor`
    }
  };

  const generatePretext = () => {
    const pretext = pretexts[pretextType];
    const caller = 'Michael Johnson';
    const phone = '(555) 123-4567';
    const invoice = Math.floor(Math.random() * 100000);
    const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();

    const phoneScript = pretext.phone
      .replace(/{caller}/g, caller)
      .replace(/{company}/g, companyName || '[Company]')
      .replace(/{target}/g, targetName || '[Target]');

    const emailScript = pretext.email
      .replace(/{caller}/g, caller)
      .replace(/{company}/g, companyName || '[Company]')
      .replace(/{target}/g, targetName || '[Target]')
      .replace(/{phone}/g, phone)
      .replace(/{invoice}/g, invoice)
      .replace(/{date}/g, date);

    setGeneratedPretext(`=== PHONE SCRIPT ===\n\n${phoneScript}\n\n\n=== EMAIL TEMPLATE ===\n\n${emailScript}`);
    toast.success('Pretext generated');
  };

  const emailTemplates = {
    urgent: {
      subject: 'URGENT: Security Alert - Immediate Action Required',
      body: `Dear {name},\n\nWe have detected suspicious activity on your account. Immediate verification is required to prevent account suspension.\n\nClick here to verify: [Link]\n\nThis link expires in 2 hours.\n\nSecurity Team`
    },
    invoice: {
      subject: 'Invoice #{number} - Payment Overdue',
      body: `Dear {name},\n\nOur records show invoice #{number} for $12,453.78 is overdue.\n\nPlease review the attached invoice and process payment immediately to avoid service interruption.\n\nView Invoice: [Link]\n\nAccounts Receivable`
    },
    delivery: {
      subject: 'Package Delivery Failed - Rescheduling Required',
      body: `Dear {name},\n\nWe attempted to deliver package #TRK{number} but no one was available.\n\nReschedule delivery: [Link]\n\nPackage will be returned in 48 hours if not claimed.\n\nShipping Department`
    },
    hr: {
      subject: 'Mandatory HR Training - Complete by EOD',
      body: `Dear {name},\n\nYou are required to complete mandatory compliance training today.\n\nAccess training portal: [Link]\n\nFailure to complete may result in system access restrictions.\n\nHuman Resources`
    }
  };

  const generateEmail = (type) => {
    const template = emailTemplates[type];
    const number = Math.floor(Math.random() * 100000);
    
    const email = `Subject: ${template.subject.replace(/{number}/g, number)}\n\n${template.body.replace(/{name}/g, targetName || '[Name]').replace(/{number}/g, number)}`;
    
    setEmailTemplate(email);
    toast.success('Email template generated');
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social Engineering Toolkit"
        description="Pretexts, scripts, and templates for social engineering assessments"
      />

      <Tabs defaultValue="pretexts" className="space-y-4">
        <TabsList className="bg-black/40 border border-red-500/30">
          <TabsTrigger value="pretexts" className="data-[state=active]:bg-red-600">Pretexts</TabsTrigger>
          <TabsTrigger value="emails" className="data-[state=active]:bg-red-600">Email Templates</TabsTrigger>
          <TabsTrigger value="vishing" className="data-[state=active]:bg-red-600">Vishing Scripts</TabsTrigger>
          <TabsTrigger value="techniques" className="data-[state=active]:bg-red-600">Techniques</TabsTrigger>
        </TabsList>

        <TabsContent value="pretexts">
          <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Pretext Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Pretext Type</label>
                  <Select value={pretextType} onValueChange={setPretextType}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="it_support">IT Support</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                      <SelectItem value="contractor">Contractor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Company Name</label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                    placeholder="Acme Corp"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Target Name</label>
                  <Input
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                    placeholder="John Smith"
                  />
                </div>
              </div>

              <Button onClick={generatePretext} className="w-full bg-gradient-to-r from-red-600 to-red-700">
                <Zap className="w-4 h-4 mr-2" />
                Generate Pretext
              </Button>

              {generatedPretext && (
                <div className="space-y-2">
                  <Textarea
                    value={generatedPretext}
                    readOnly
                    className="min-h-[400px] font-mono text-sm bg-slate-900 border-slate-700 text-slate-300"
                  />
                  <Button onClick={() => copy(generatedPretext)} variant="outline" className="w-full border-slate-700 text-white">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Pretext
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails">
          <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Phishing Email Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Target Name</label>
                <Input
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="John Smith"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.keys(emailTemplates).map((type) => (
                  <Button
                    key={type}
                    onClick={() => generateEmail(type)}
                    variant="outline"
                    className="border-slate-700 text-white capitalize"
                  >
                    {type}
                  </Button>
                ))}
              </div>

              {emailTemplate && (
                <div className="space-y-2">
                  <Textarea
                    value={emailTemplate}
                    readOnly
                    className="min-h-[250px] font-mono text-sm bg-slate-900 border-slate-700 text-slate-300"
                  />
                  <Button onClick={() => copy(emailTemplate)} variant="outline" className="w-full border-slate-700 text-white">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Template
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vishing">
          <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white">Vishing Call Scripts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm text-slate-300">
                <div className="p-4 bg-slate-900 rounded">
                  <p className="font-semibold text-white mb-2">Opening:</p>
                  <p>"Hello, this is [Name] from [Company] IT Department. I'm calling about a critical security matter affecting your account."</p>
                </div>

                <div className="p-4 bg-slate-900 rounded">
                  <p className="font-semibold text-white mb-2">Build Rapport:</p>
                  <p>"I understand this is unexpected. I want to make sure we resolve this quickly so it doesn't affect your work."</p>
                </div>

                <div className="p-4 bg-slate-900 rounded">
                  <p className="font-semibold text-white mb-2">Create Urgency:</p>
                  <p>"We've detected suspicious activity in the last hour. If we don't verify your account now, it will be automatically suspended for security reasons."</p>
                </div>

                <div className="p-4 bg-slate-900 rounded">
                  <p className="font-semibold text-white mb-2">Request Information:</p>
                  <p>"For verification, I need to confirm your employee ID and the last four digits of your work phone number."</p>
                </div>

                <div className="p-4 bg-slate-900 rounded">
                  <p className="font-semibold text-white mb-2">Handle Objections:</p>
                  <p>"I completely understand your concern. You can call our main IT line at [number] and ask for me directly. My extension is [ext]."</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="techniques">
          <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white">Social Engineering Techniques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { title: 'Authority', desc: 'Impersonate someone in a position of power (executive, law enforcement, IT admin)' },
                  { title: 'Urgency', desc: 'Create time pressure to prevent careful consideration' },
                  { title: 'Scarcity', desc: 'Suggest limited time or availability to act' },
                  { title: 'Liking/Trust', desc: 'Build rapport and appear friendly and helpful' },
                  { title: 'Social Proof', desc: 'Reference others who have complied ("Everyone in your department has done this")' },
                  { title: 'Reciprocity', desc: 'Offer something first to create obligation' },
                  { title: 'Fear', desc: 'Threaten negative consequences (account suspension, legal action)' },
                  { title: 'Curiosity', desc: 'Pique interest to encourage clicking or responding' }
                ].map((technique, i) => (
                  <div key={i} className="p-3 bg-slate-900 rounded">
                    <p className="font-semibold text-red-400 mb-1">{technique.title}</p>
                    <p className="text-sm text-slate-300">{technique.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-slate-800/50 border-amber-600/30">
        <CardContent className="pt-4">
          <p className="text-xs text-amber-400">
            ⚠️ Social engineering assessments must be authorized and conducted within legal and ethical boundaries. Only test with explicit written permission.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}