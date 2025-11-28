import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: "By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service."
  },
  {
    title: "2. Use License",
    content: "Permission is granted to temporarily access the materials (information or software) on our platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not: modify or copy the materials; use the materials for any commercial purpose; attempt to decompile or reverse engineer any software contained on the platform; remove any copyright or other proprietary notations from the materials; or transfer the materials to another person."
  },
  {
    title: "3. Age Restriction",
    content: "You must be at least 18 years of age to use this platform. By using this platform, you warrant that you are at least 18 years of age and you agree to provide valid proof of age upon request. We reserve the right to verify your age and to suspend or terminate your account if we discover you are underage."
  },
  {
    title: "4. User Accounts",
    content: "When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password."
  },
  {
    title: "5. Content",
    content: "Our platform allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ('Content'). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness. By posting Content, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service."
  },
  {
    title: "6. Prohibited Uses",
    content: "You may not use our platform: for any unlawful purpose or to solicit others to perform or participate in any unlawful acts; to violate any international, federal, provincial or state regulations, rules, laws, or local ordinances; to infringe upon or violate our intellectual property rights or the intellectual property rights of others; to harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate; to submit false or misleading information; to upload or transmit viruses or any other type of malicious code."
  },
  {
    title: "7. Intellectual Property",
    content: "The platform and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of the platform and its licensors. The platform is protected by copyright, trademark, and other laws of both the country and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent."
  },
  {
    title: "8. Copyright Policy",
    content: "We respect the intellectual property rights of others. It is our policy to respond to any claim that Content posted on the platform infringes the copyright or other intellectual property infringement of any person. If you believe that any Content violates your copyright, please see our DMCA Policy for information on how to file a notice."
  },
  {
    title: "9. Termination",
    content: "We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the platform will immediately cease. If you wish to terminate your account, you may simply discontinue using the platform."
  },
  {
    title: "10. Limitation of Liability",
    content: "In no event shall the platform, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the platform."
  },
  {
    title: "11. Governing Law",
    content: "These Terms shall be governed and construed in accordance with the laws without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights."
  },
  {
    title: "12. Changes to Terms",
    content: "We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion."
  }
];

export default function Terms() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Terms of Service</h1>
        </div>
        <p className="text-muted-foreground">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            Please read these Terms of Service carefully before using our platform. By accessing or using the platform, 
            you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the platform.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {sections.map((section) => (
          <Card key={section.title} data-testid={`section-${section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
            <CardHeader>
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{section.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Contact Us</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            If you have any questions about these Terms, please contact our support team through the Help & Support page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
