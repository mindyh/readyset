export type KitCategory = 'vehicle' | 'evacuation' | 'fire' | 'shelter-in-place' | 'medical' | 'custom';

export type ItemStatus = 'packed' | 'to-buy' | 'to-pack' | 'removed' | 'expired';

export interface KitItem {
  id: string;
  name: string;
  status: ItemStatus;
  note?: string;
  expirationDate?: string | null; // YYYY-MM-DD
  quantity: string;
  lastChecked: string; // YYYY-MM-DD
  alertOnExpiration: boolean;
  
  // For borrowed/removed items:
  removedAt?: string | null; // YYYY-MM-DD
  reminderDueDate?: string | null; // YYYY-MM-DD
}

export interface Kit {
  id: string;
  name: string;
  description: string;
  category: KitCategory;
  items: KitItem[];
  createdAt: string;
  updatedAt: string;
  lastAuditedAt?: string | null;
}

export interface SMTPConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export interface AppSettings {
  recipientEmails: string; // Comma-separated
  reminderDays: number;    // Default e.g. 7 days for putting back removed items
  smtp: SMTPConfig;
  hubSubtitle?: string;
}

export interface EmailLog {
  id: string;
  timestamp: string;
  to: string;
  subject: string;
  body: string;
  status: 'sent' | 'failed' | 'simulated';
  error?: string;
}

export interface AppData {
  kits: Kit[];
  settings: AppSettings;
  emailLogs: EmailLog[];
  lastAutoCheckDate?: string; // YYYY-MM-DD
}
