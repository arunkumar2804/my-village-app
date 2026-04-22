// ═══════════════════════════════════════════
// Supabase-based data store
// ═══════════════════════════════════════════

import { supabase } from "./supabase";
import type {
  BusTiming,
  TrainTiming,
  WaterUpdate,
  CanalUpdate,
  Announcement,
  VillageEvent,
  VillageLocation,
} from "./types";

// Note: Database tables should match these definitions.
// Table names: bus_timings, train_timings, water_updates, canal_updates, announcements, events, village_locations

// ─── Village Locations ───
export async function getVillageLocations(): Promise<VillageLocation[]> {
  const { data, error } = await supabase.from("village_locations").select("*").order("created_at", { ascending: false });
  if (error) { console.error("Error fetching locations:", error); return []; }
  return data as VillageLocation[];
}

export async function addVillageLocation(data: Omit<VillageLocation, "id" | "createdAt">): Promise<VillageLocation | null> {
  const { data: newRow, error } = await supabase.from("village_locations").insert([data]).select().single();
  if (error) { console.error("Error adding location:", error); return null; }
  return newRow;
}

export async function deleteVillageLocation(id: string): Promise<void> {
  await supabase.from("village_locations").delete().eq("id", id);
}

// ─── Bus Timings ───
export async function getBusTimings(): Promise<BusTiming[]> {
  const { data, error } = await supabase.from("bus_timings").select("*").order("created_at", { ascending: false });
  if (error) { console.error("Error fetching buses:", error); return []; }
  return data as BusTiming[];
}

export async function addBusTiming(data: Omit<BusTiming, "id" | "createdAt">): Promise<BusTiming | null> {
  const { data: newRow, error } = await supabase.from("bus_timings").insert([data]).select().single();
  if (error) { console.error("Error adding bus:", error); return null; }
  return newRow;
}

export async function deleteBusTiming(id: string): Promise<void> {
  await supabase.from("bus_timings").delete().eq("id", id);
}

// ─── Train Timings ───
export async function getTrainTimings(): Promise<TrainTiming[]> {
  const { data, error } = await supabase.from("train_timings").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return data as TrainTiming[];
}

export async function addTrainTiming(data: Omit<TrainTiming, "id" | "createdAt">): Promise<TrainTiming | null> {
  const { data: newRow, error } = await supabase.from("train_timings").insert([data]).select().single();
  if (error) return null;
  return newRow;
}

export async function deleteTrainTiming(id: string): Promise<void> {
  await supabase.from("train_timings").delete().eq("id", id);
}

// ─── Water Updates ───
export async function getWaterUpdates(): Promise<WaterUpdate[]> {
  const { data, error } = await supabase.from("water_updates").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return data as WaterUpdate[];
}

export async function addWaterUpdate(data: Omit<WaterUpdate, "id" | "createdAt">): Promise<WaterUpdate | null> {
  const { data: newRow, error } = await supabase.from("water_updates").insert([data]).select().single();
  if (error) return null;
  return newRow;
}

export async function deleteWaterUpdate(id: string): Promise<void> {
  await supabase.from("water_updates").delete().eq("id", id);
}

// ─── Canal Updates ───
export async function getCanalUpdates(): Promise<CanalUpdate[]> {
  const { data, error } = await supabase.from("canal_updates").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return data as CanalUpdate[];
}

export async function addCanalUpdate(data: Omit<CanalUpdate, "id" | "createdAt">): Promise<CanalUpdate | null> {
  const { data: newRow, error } = await supabase.from("canal_updates").insert([data]).select().single();
  if (error) return null;
  return newRow;
}

export async function deleteCanalUpdate(id: string): Promise<void> {
  await supabase.from("canal_updates").delete().eq("id", id);
}

// ─── Announcements ───
export async function getAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return data as Announcement[];
}

export async function addAnnouncement(data: Omit<Announcement, "id" | "createdAt">): Promise<Announcement | null> {
  const { data: newRow, error } = await supabase.from("announcements").insert([data]).select().single();
  if (error) return null;
  return newRow;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await supabase.from("announcements").delete().eq("id", id);
}

// ─── Events ───
export async function getEvents(): Promise<VillageEvent[]> {
  const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return data as VillageEvent[];
}

export async function addEvent(data: Omit<VillageEvent, "id" | "createdAt">): Promise<VillageEvent | null> {
  const { data: newRow, error } = await supabase.from("events").insert([data]).select().single();
  if (error) return null;
  return newRow;
}

export async function deleteEvent(id: string): Promise<void> {
  await supabase.from("events").delete().eq("id", id);
}

// ─── Profiles ───
import type { Profile } from "./types";

export async function getProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (error) return null;
  return data as Profile;
}

export async function upsertProfile(profile: Profile): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").upsert(profile).select().single();
  if (error) {
    console.error("Error creating profile", error);
    return null;
  }
  return data as Profile;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return data as Profile[];
}
