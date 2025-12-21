import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

const sections = [
  {
    title: "1. Information We Collect",
    content: "We collect information you provide directly to us, including your name, email address, username, password, profile information, payment information, and any content you create or upload. We also collect information automatically such as your IP address, browser type, device information, and usage data through cookies and similar technologies."
  },
  {
    title: "2. How We Use Your Information",
    content: "We use the information we collect to: provide, maintain, and improve our services; process transactions and send related information; send you technical notices, updates, security alerts, and support messages; respond to your comments, questions, and customer service requests; communicate with you about products, services, offers, and events; monitor and analyze trends, usage, and activities; detect, investigate, and prevent fraudulent transactions and other illegal activities; personalize and improve your experience on our platform."
  },
  {
    title: "3. Information Sharing",
    content: "We do not sell your personal information. We may share your information with: service providers who perform services on our behalf; business partners when you choose to use integrated services; other users as part of the social features of our platform; in response to legal requests or to protect rights and safety; in connection with a business transaction such as a merger or acquisition; with your consent or at your direction."
  },
  {
    title: "4. Data Security",
    content: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized or unlawful processing, accidental loss, destruction, or damage. This includes encryption of data in transit and at rest, regular security audits, and access controls. However, no method of transmission over the internet or electronic storage is 100% secure."
  },
  {
    title: "5. Your Rights and Choices",
    content: "You have the right to: access, update, or delete your personal information; object to processing of your personal information; request restriction of processing; request data portability; withdraw consent at any time; lodge a complaint with a supervisory authority. You can exercise these rights through your account settings or by contacting us."
  },
  {
    title: "6. Cookies and Tracking",
    content: "We use cookies and similar tracking technologies to track activity on our platform and hold certain information. Cookies are files with small amounts of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our platform."
  },
  {
    title: "7. Data Retention",
    content: "We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your information, we will securely delete or anonymize it. Content you upload may be retained for archival purposes even after account deletion, as required by legal and regulatory obligations."
  },
  {
    title: "8. International Data Transfers",
    content: "Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. By using our platform, you consent to the transfer of information to jurisdictions outside your country of residence."
  },
  {
    title: "9. Children's Privacy",
    content: "Our platform is not intended for anyone under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us immediately. If we become aware that we have collected personal information from children without verification of parental consent, we take steps to remove that information."
  },
  {
    title: "10. Age Verification",
    content: "To ensure compliance with legal requirements, we implement age verification processes. This may include collection of government-issued identification documents. We use third-party age verification services that process this information securely and in compliance with applicable laws. Verification data is encrypted and stored securely."
  },
  {
    title: "11. Third-Party Links",
    content: "Our platform may contain links to third-party websites or services that are not owned or controlled by us. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services. We encourage you to review the privacy policy of every site you visit."
  },
  {
    title: "12. Changes to Privacy Policy",
    content: "We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the 'Last updated' date. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page."
  }
];

export default function Privacy() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
        </div>
        <p className="text-muted-foreground">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            This Privacy Policy describes how we collect, use, and share your personal information when you use our platform. 
            We are committed to protecting your privacy and ensuring the security of your personal information.
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
            If you have any questions about this Privacy Policy or our data practices, please contact our privacy team 
            through the Help & Support page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
