export type MonitorType =
  | 'Product Price'
  | 'Product Availability'
  | 'Product Catalog'
  | 'Website Content';
export type MonitorStatus = 'active' | 'paused';
export type Severity = 'Low' | 'Medium' | 'High';

export type DemoMonitor = {
  id: string;
  name: string;
  websiteUrl: string;
  monitorType: MonitorType;
  status: MonitorStatus;
  createdAt: string;
  lastChecked: string;
};

export type DemoChange = {
  id: string;
  monitorId: string;
  changeType: string;
  title: string;
  description: string;
  oldValue: string;
  newValue: string;
  severity: Severity;
  sourceUrl: string;
  detectedAt: string;
};

export type DemoAIAnalysis = {
  id: string;
  changeId: string;
  summary: string;
  whyItMatters: string;
  suggestedAction: string;
  createdAt: string;
};

export const DEMO_MONITORS: DemoMonitor[] = [
  {
    id: 'm-northstar',
    name: 'Northstar Home Goods',
    websiteUrl: 'https://northstarhome.example',
    monitorType: 'Product Price',
    status: 'active',
    createdAt: '2026-09-14T09:20:00Z',
    lastChecked: '2026-09-29T14:10:00Z',
  },
  {
    id: 'm-pineandloom',
    name: 'Pine & Loom',
    websiteUrl: 'https://pineandloom.example',
    monitorType: 'Product Catalog',
    status: 'active',
    createdAt: '2026-09-09T11:15:00Z',
    lastChecked: '2026-09-29T13:48:00Z',
  },
  {
    id: 'm-orbit',
    name: 'Orbit Supply Co.',
    websiteUrl: 'https://orbitsupply.example',
    monitorType: 'Website Content',
    status: 'paused',
    createdAt: '2026-08-27T16:40:00Z',
    lastChecked: '2026-09-28T10:12:00Z',
  },
  {
    id: 'm-studio',
    name: 'Studio Calder',
    websiteUrl: 'https://studiocalder.example',
    monitorType: 'Product Availability',
    status: 'active',
    createdAt: '2026-08-18T08:05:00Z',
    lastChecked: '2026-09-29T12:31:00Z',
  },
];

export const DEMO_CHANGES: DemoChange[] = [
  {
    id: 'c-price',
    monitorId: 'm-northstar',
    changeType: 'Product price',
    title: 'Competitor product price changed',
    description:
      'The listed price for the Alder lounge chair moved lower than the previous observed value.',
    oldValue: '$489.00',
    newValue: '$459.00',
    severity: 'High',
    sourceUrl: 'https://northstarhome.example/alder-lounge-chair',
    detectedAt: '2026-09-29T14:10:00Z',
  },
  {
    id: 'c-new-product',
    monitorId: 'm-pineandloom',
    changeType: 'Product catalog',
    title: 'New product detected',
    description:
      'A new linen travel collection appears in the monitored product catalog.',
    oldValue: '42 listed products',
    newValue: '45 listed products',
    severity: 'Medium',
    sourceUrl: 'https://pineandloom.example/shop',
    detectedAt: '2026-09-29T13:48:00Z',
  },
  {
    id: 'c-content',
    monitorId: 'm-orbit',
    changeType: 'Website content',
    title: 'Website content changed',
    description:
      'The homepage hero message and primary promotional callout are different from the prior snapshot.',
    oldValue: 'Spring utility, made simple.',
    newValue: 'Built for the long way home.',
    severity: 'Low',
    sourceUrl: 'https://orbitsupply.example',
    detectedAt: '2026-09-28T10:12:00Z',
  },
  {
    id: 'c-description',
    monitorId: 'm-studio',
    changeType: 'Product description',
    title: 'Product description changed',
    description:
      'The description for the Calder weekender now emphasizes recycled canvas and a longer warranty.',
    oldValue: 'Waxed cotton canvas with brass hardware.',
    newValue:
      'Recycled canvas with brass hardware and a two-year warranty.',
    severity: 'Medium',
    sourceUrl: 'https://studiocalder.example/weekender',
    detectedAt: '2026-09-27T09:21:00Z',
  },
];

export const DEMO_AI_ANALYSES: DemoAIAnalysis[] = [
  {
    id: 'a-price',
    changeId: 'c-price',
    summary:
      'This is a meaningful downward price move on a comparable product.',
    whyItMatters:
      'A lower displayed price could affect how shoppers compare the two products, especially if the products appear side by side.',
    suggestedAction:
      'Review your current price position and margin before deciding whether a response is appropriate. No automatic action is recommended.',
    createdAt: '2026-09-29T14:12:00Z',
  },
  {
    id: 'a-new-product',
    changeId: 'c-new-product',
    summary:
      'The catalog appears to have expanded with three newly listed items.',
    whyItMatters:
      'A collection launch may signal a seasonal merchandising shift worth understanding alongside your own assortment calendar.',
    suggestedAction:
      'Open the source page and compare the new collection’s positioning with products you are planning to launch next.',
    createdAt: '2026-09-29T13:51:00Z',
  },
];