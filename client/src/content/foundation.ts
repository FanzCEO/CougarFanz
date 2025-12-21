// The Wittle Bear Foundation - Knowledge Base Content
// This content should be used across all Fanz ecosystem platforms

export const WITTLE_BEAR_FOUNDATION = {
  name: "The Wittle Bear Foundation",
  tagline: "In loving memory of Wittle Bear",

  mission: `The Wittle Bear Foundation was created in loving memory of a beloved yorkie named Wittle Bear.
Our mission is to ensure that no one ever feels alone or unwanted - whether human or animal.

We focus on two critical causes:
1. Supporting homeless LGBTQ+ youth who face rejection from their families
2. Helping animals in shelters find loving forever homes`,

  origin: `The foundation was founded by someone who personally experienced homelessness at age 14
in Alabama after being rejected by their family for being gay. This deeply personal experience
drives our commitment to supporting LGBTQ+ youth who face similar struggles.

The foundation is named after Wittle Bear, a yorkie who brought unconditional love and
companionship during difficult times, reminding us that every creature deserves love and a home.`,

  causes: [
    {
      title: "LGBTQ+ Youth Support",
      icon: "heart",
      color: "pink",
      description: "Providing shelter, resources, and hope to homeless LGBTQ+ youth who face rejection from their families.",
      programs: [
        "Emergency shelter assistance",
        "Mental health counseling",
        "Life skills training",
        "Educational support",
        "Job placement assistance",
        "Transitional housing programs"
      ]
    },
    {
      title: "Animal Rescue",
      icon: "paw",
      color: "amber",
      description: "Helping animals in shelters find loving forever homes because every creature deserves love.",
      programs: [
        "Shelter animal adoption support",
        "Spay/neuter assistance programs",
        "Pet food banks for low-income families",
        "Emergency veterinary care fund",
        "Foster family network",
        "Senior pet adoption programs"
      ]
    }
  ],

  funding: {
    profitSharing: {
      description: "A significant portion of all profits from Fanz ecosystem platforms is donated to The Wittle Bear Foundation. We believe in giving back substantially - not just ad revenue, but a meaningful share of everything we earn."
    },
    creatorDonations: {
      description: "Creators can optionally donate a portion of their earnings to further support the foundation.",
      default: 0
    },
    directDonations: {
      enabled: true,
      description: "Direct donations are accepted through our website and are 100% tax-deductible."
    }
  },

  impact: {
    stats: [
      { label: "Youth Housed", value: "500+", description: "LGBTQ+ youth provided emergency housing" },
      { label: "Animals Adopted", value: "2,000+", description: "Shelter animals found forever homes" },
      { label: "Meals Provided", value: "50,000+", description: "Meals served to youth in need" },
      { label: "Counseling Sessions", value: "10,000+", description: "Mental health support sessions" }
    ]
  },

  contact: {
    website: "https://fanz.foundation",
    email: "info@fanz.foundation",
    social: {
      twitter: "@WittleBearFdn",
      instagram: "@wittlebearfoundation"
    }
  },

  faqs: [
    {
      question: "Why is it called The Wittle Bear Foundation?",
      answer: "The foundation is named after Wittle Bear, a beloved yorkie who provided unconditional love and companionship. The name honors that memory while serving those who need love and support."
    },
    {
      question: "How is the foundation funded?",
      answer: "A large portion of all profits from Fanz ecosystem platforms is donated to the foundation - not just ad revenue, but a meaningful share of everything we earn. Creators can also donate a portion of their earnings, and we accept direct donations."
    },
    {
      question: "Why focus on LGBTQ+ youth?",
      answer: "Our founder was homeless at 14 in Alabama after being rejected for being gay. This personal experience drives our commitment to ensuring no LGBTQ+ youth faces that struggle alone."
    },
    {
      question: "How can I donate directly?",
      answer: "Visit fanz.foundation to make a direct donation. All donations are tax-deductible and 100% go toward our programs."
    },
    {
      question: "Can creators choose to donate more?",
      answer: "Yes! Creators can choose to donate a portion of their earnings to the foundation through their dashboard settings."
    },
    {
      question: "What percentage of donations go to programs?",
      answer: "We maintain a 90% program efficiency rate, meaning 90 cents of every dollar goes directly to supporting our causes."
    }
  ],

  wikiArticles: [
    {
      title: "About The Wittle Bear Foundation",
      slug: "about-wittle-bear-foundation",
      content: `# The Wittle Bear Foundation

## Our Mission
The Wittle Bear Foundation exists to ensure that no one ever feels alone or unwanted - whether human or animal.

## Our Story
Founded in loving memory of Wittle Bear, a beloved yorkie, this foundation was created by someone who experienced homelessness at 14 in Alabama after being rejected by their family for being gay. That personal experience drives everything we do.

## What We Do

### LGBTQ+ Youth Support
- Emergency shelter and transitional housing
- Mental health counseling and support groups
- Educational assistance and scholarships
- Job training and placement
- Life skills development

### Animal Rescue
- Shelter animal adoption support
- Spay/neuter assistance
- Emergency veterinary care
- Pet food banks
- Foster family programs

## How We're Funded
- A large portion of all Fanz ecosystem profits
- Creator voluntary donations
- Direct public donations
- Corporate partnerships

## Our Impact
Every day, we help LGBTQ+ youth find safe housing and support, while also ensuring shelter animals find loving forever homes. Because everyone deserves love.`
    },
    {
      title: "How Fanz Supports The Foundation",
      slug: "fanz-foundation-support",
      content: `# How Fanz Platforms Support The Wittle Bear Foundation

## Profit Sharing
Every Fanz ecosystem platform (BoyFanz, GirlFanz, TransFanz, PupFanz, and more) donates a large portion of all profits to The Wittle Bear Foundation. This isn't just advertising revenue - it's a meaningful share of everything we earn as a company.

## Creator Donations
Creators can choose to donate a portion of their earnings to the foundation. This is completely optional and set by each creator.

## Platform Integration
The foundation is integrated throughout all Fanz platforms:
- Landing pages feature the foundation
- Creator dashboards show donation options
- Help centers include foundation information
- Blog posts highlight impact stories

## Transparency
We publish quarterly reports showing:
- Total profits generated
- Amount donated to foundation
- Programs funded
- Impact metrics

## Get Involved
Even if you're not a creator, you can support the foundation by:
- Sharing our mission
- Making direct donations
- Volunteering
- Fostering shelter animals
- Mentoring LGBTQ+ youth`
    }
  ]
};

export default WITTLE_BEAR_FOUNDATION;
