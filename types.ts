export interface Target {
  id: number;
  name: string;
  location: string;
  growthSignal: string;
  triggerType: 'FUNDING' | 'HIRING' | 'EXECUTIVE' | 'EXPANSION' | 'PRODUCT' | 'OTHER';
  urgencyScore: 'HOT' | 'WARM' | 'COLD'; // Based on recency (HOT < 1 month)
  visualGap: string;
  attackAngle: string;
  humanTarget: string;
  sourceLinks: string[];
}

export interface TacticalPlan {
  emailSubject: string;
  linkedInHook: string;
  videoConcept: string;
}

export interface SocialAudit {
  score: number; // 1-10
  chakraLevel: 'FAIBLE' | 'MOYEN' | 'PUISSANT';
  critique: string;
  tactics: TacticalPlan;
}

export interface ScanResult {
  targets: Target[];
  timestamp: string;
  sector: string;
  region: string;
  trigger: string;
}

export enum ScanStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}