import { Link } from "wouter";
import { Twitter, Instagram, MessageCircle, Send } from "lucide-react";
import pupfanzLogo from "@/assets/pupfanz-logo.jpeg";
import { Badge } from "@/components/ui/badge";

export default function Footer() {
  const platformLinks = [
    { name: 'Discover Creators', href: '/discover' },
    { name: 'Become a Creator', href: '/creator-signup' },
    { name: 'Pack Communities', href: '/packs' },
    { name: 'Live Streams', href: '/live' },
  ];

  const safetyLinks = [
    { name: 'Safety Center', href: '/safety' },
    { name: 'Community Guidelines', href: '/guidelines' },
    { name: 'Report Abuse', href: '/report' },
    { name: 'Contact Support', href: '/support' },
  ];

  const legalLinks = [
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'DMCA Policy', href: '/dmca' },
    { name: '2257 Compliance', href: '/2257' },
  ];

  const socialLinks = [
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'Instagram', href: '#', icon: Instagram },
    { name: 'Discord', href: '#', icon: MessageCircle },
    { name: 'Telegram', href: '#', icon: Send },
  ];

  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <img 
                src={pupfanzLogo} 
                alt="PupFanz Logo" 
                className="h-32 w-auto rounded-lg"
                data-testid="logo-footer"
              />
            </div>
            <p className="text-muted text-sm mb-4">
              The pack-centric creator platform where safety meets authentic connections. Built for the wild, high-energy community.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-muted hover:text-primary transition-colors"
                  aria-label={social.name}
                  data-testid={`social-${social.name.toLowerCase()}`}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="neon-text-primary mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              {platformLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted hover:text-foreground transition-colors"
                    data-testid={`footer-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Safety Links */}
          <div>
            <h4 className="neon-text-secondary mb-4">Safety & Support</h4>
            <ul className="space-y-2 text-sm">
              {safetyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted hover:text-foreground transition-colors"
                    data-testid={`footer-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="neon-text-accent mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted hover:text-foreground transition-colors"
                    data-testid={`footer-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted mb-4 md:mb-0">
            © 2024 PupFanz. All rights reserved. | 18+ Adult Content Platform
          </p>
          <div className="flex items-center space-x-4">
            <Badge className="safety-badge safety-badge-verified">
              <span className="mr-2">🛡️</span>
              2257 Compliant
            </Badge>
            <Badge className="safety-badge safety-badge-consent">
              <span className="mr-2">🔒</span>
              SSL Secured
            </Badge>
          </div>
        </div>
      </div>
    </footer>
  );
}
