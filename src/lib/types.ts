// ═══════════════════════════════════════════
// Data Models for My Village App
// ═══════════════════════════════════════════

export interface BusTiming {
  id: string;
  routeNumber: string;
  from: string;
  to: string;
  departureTime: string;
  isActive: boolean;
  operator: string;
  createdAt: string;
}

export interface TrainTiming {
  id: string;
  trainName: string;
  trainNumber: string;
  from: string;
  to: string;
  departureTime: string;
  nearbyStation: string;
  isActive: boolean;
  createdAt: string;
}

export interface WaterUpdate {
  id: string;
  session: "morning" | "evening";
  zone: string;
  startTime: string;
  endTime: string;
  durationMins: number;
  isActive: boolean;
  createdAt: string;
}

export interface CanalUpdate {
  id: string;
  title: string;
  description: string;
  status: "open" | "closed" | "maintenance";
  waterLevel: "low" | "normal" | "high" | "flood";
  updatedAt: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  priority: "normal" | "important" | "urgent";
  createdAt: string;
}

export interface VillageEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  createdAt: string;
}

export type DataCategory =
  | "bus"
  | "train"
  | "water"
  | "canal"
  | "announcement"
  | "event";
