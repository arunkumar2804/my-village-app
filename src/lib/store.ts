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
  NotificationEntry,
  VillageEvent,
  VillageLocation,
} from "./types";

// Note: Database tables should match these definitions.
// Table names: bus_timings, train_timings, water_updates, canal_updates, announcements, events, village_locations
const ADMIN_ROLE_PREFIX = "__ADMIN_ROLE__:";
const NOTIFICATION_PREFIX = "__NOTIFY__:";

function parseRoleOverrideTitle(title: string): { userId: string; role: "user" | "admin" } | null {
  if (!title?.startsWith(ADMIN_ROLE_PREFIX)) return null;
  const payload = title.slice(ADMIN_ROLE_PREFIX.length);
  const [userId, role] = payload.split(":");
  if (!userId || (role !== "user" && role !== "admin")) return null;
  return { userId, role };
}

function parseNotificationTitle(title: string): { title: string; targetType: "all" | "selected"; targetUserIds: string[] } | null {
  if (!title?.startsWith(NOTIFICATION_PREFIX)) return null;
  const payload = title.slice(NOTIFICATION_PREFIX.length);
  try {
    const parsed = JSON.parse(payload) as { title: string; targetType: "all" | "selected"; targetUserIds?: string[] };
    if (!parsed?.title) return null;
    return {
      title: parsed.title,
      targetType: parsed.targetType === "selected" ? "selected" : "all",
      targetUserIds: Array.isArray(parsed.targetUserIds) ? parsed.targetUserIds : [],
    };
  } catch {
    return null;
  }
}

async function getRoleOverrides(): Promise<Record<string, "user" | "admin">> {
  const { data, error } = await supabase
    .from("announcements")
    .select("title, created_at")
    .like("title", `${ADMIN_ROLE_PREFIX}%`)
    .order("created_at", { ascending: true });

  if (error || !data) return {};

  const map: Record<string, "user" | "admin"> = {};
  for (const row of data as Array<{ title: string }>) {
    const parsed = parseRoleOverrideTitle(row.title);
    if (parsed) {
      map[parsed.userId] = parsed.role;
    }
  }
  return map;
}

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

// ─── Notifications ───
export async function getNotifications(): Promise<NotificationEntry[]> {
  const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false });
  let primaryRows: NotificationEntry[] = [];
  if (!error && data) {
    primaryRows = (data as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id ?? ""),
      title: String(row.title ?? ""),
      description: String(row.description ?? ""),
      targetType: row.targetType === "selected" || row.target_type === "selected" ? "selected" : "all",
      targetUserIds: Array.isArray(row.targetUserIds)
        ? (row.targetUserIds as string[])
        : Array.isArray(row.target_user_ids)
          ? (row.target_user_ids as string[])
          : [],
      isActive: row.isActive === false || row.is_active === false ? false : true,
      createdBy: String(row.createdBy ?? row.created_by ?? ""),
      createdAt: String(row.createdAt ?? row.created_at ?? ""),
    }));
  }

  const { data: fallbackRows, error: fallbackError } = await supabase
    .from("announcements")
    .select("*")
    .like("title", `${NOTIFICATION_PREFIX}%`)
    .order("created_at", { ascending: false });

  if (fallbackError || !fallbackRows) return primaryRows;

  const fallbackMapped = (fallbackRows as Array<Record<string, unknown>>)
    .map((row) => {
      const parsed = parseNotificationTitle(String(row.title ?? ""));
      if (!parsed) return null;
      return {
        id: String(row.id ?? ""),
        title: parsed.title,
        description: String(row.description ?? ""),
        targetType: parsed.targetType,
        targetUserIds: parsed.targetUserIds,
        isActive: true,
        createdBy: "announcement-fallback",
        createdAt: String(row.created_at ?? ""),
      } as NotificationEntry;
    })
    .filter((entry): entry is NotificationEntry => Boolean(entry));

  if (primaryRows.length === 0) return fallbackMapped;

  const seen = new Set(primaryRows.map((entry) => entry.id));
  const extras = fallbackMapped.filter((entry) => !seen.has(entry.id));
  return [...primaryRows, ...extras];
}

export async function addNotification(
  data: Omit<NotificationEntry, "id" | "createdAt">,
): Promise<NotificationEntry | null> {
  const payloads: Array<Record<string, unknown>> = [
    data,
    {
      title: data.title,
      description: data.description,
      target_type: data.targetType,
      target_user_ids: data.targetUserIds,
      is_active: data.isActive,
      created_by: data.createdBy || "admin",
    },
  ];

  for (const payload of payloads) {
    const { data: newRow, error } = await supabase.from("notifications").insert([payload]).select().single();
    if (!error && newRow) {
      return newRow as NotificationEntry;
    }
  }

  const fallbackMeta = JSON.stringify({
    title: data.title,
    targetType: data.targetType,
    targetUserIds: data.targetUserIds,
  });
  const { data: fallbackRow, error: fallbackError } = await supabase
    .from("announcements")
    .insert([
      {
        title: `${NOTIFICATION_PREFIX}${fallbackMeta}`,
        description: data.description,
        priority: "important",
      },
    ])
    .select()
    .single();

  if (fallbackError || !fallbackRow) return null;
  return {
    id: String((fallbackRow as Record<string, unknown>).id ?? ""),
    title: data.title,
    description: data.description,
    targetType: data.targetType,
    targetUserIds: data.targetUserIds,
    isActive: true,
    createdBy: data.createdBy || "announcement-fallback",
    createdAt: String((fallbackRow as Record<string, unknown>).created_at ?? ""),
  };
}

export async function deleteNotification(id: string): Promise<void> {
  await supabase.from("notifications").delete().eq("id", id);
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

function normalizeProfileRow(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id ?? ""),
    email: String(row.email ?? ""),
    full_name: String(row.full_name ?? row.fullName ?? ""),
    avatar_url: String(row.avatar_url ?? row.avatarUrl ?? ""),
    phone_number:
      (row.phone_number as string | null | undefined) ??
      (row.phoneNumber as string | null | undefined) ??
      null,
    role:
      row.role === "admin" || row.role === "user"
        ? (row.role as "admin" | "user")
        : undefined,
    is_admin: typeof row.is_admin === "boolean" ? row.is_admin : typeof row.isAdmin === "boolean" ? row.isAdmin : undefined,
    created_at: typeof row.created_at === "string" ? row.created_at : undefined,
  };
}

export async function getProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (error) return null;
  const profile = normalizeProfileRow(data as Record<string, unknown>);
  const overrides = await getRoleOverrides();
  const overrideRole = overrides[id];
  if (!overrideRole) return profile;
  return {
    ...profile,
    role: overrideRole,
    is_admin: overrideRole === "admin",
  };
}

export async function upsertProfile(profile: Profile): Promise<{ profile: Profile | null; error: string | null }> {
  const payloads: Array<Record<string, unknown>> = [
    {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url || "",
      phone_number: profile.phone_number,
      role: profile.role ?? "user",
      is_admin: profile.is_admin ?? false,
    },
    {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url || "",
      phone_number: profile.phone_number,
    },
    {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url || "",
      phoneNumber: profile.phone_number,
    },
  ];

  let lastErrorMessage = "Unknown profile save error.";
  for (const payload of payloads) {
    const { data, error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" }).select().single();
    if (!error && data) {
      return { profile: normalizeProfileRow(data as Record<string, unknown>), error: null };
    }
    if (error) {
      lastErrorMessage = error.message;
    }
  }

  console.error("Error creating profile", lastErrorMessage);
  return { profile: null, error: lastErrorMessage };
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) return [];
  const profiles = (data as Array<Record<string, unknown>>).map(normalizeProfileRow);
  const overrides = await getRoleOverrides();
  return profiles.map((profile) => {
    const overrideRole = overrides[profile.id];
    if (!overrideRole) return profile;
    return {
      ...profile,
      role: overrideRole,
      is_admin: overrideRole === "admin",
    };
  });
}

export async function updateProfileRole(id: string, role: "user" | "admin"): Promise<Profile | null> {
  const fullUpdate = await supabase
    .from("profiles")
    .update({ role, is_admin: role === "admin" })
    .eq("id", id)
    .select()
    .single();

  if (!fullUpdate.error) {
    return fullUpdate.data as Profile;
  }

  const roleOnly = await supabase.from("profiles").update({ role }).eq("id", id).select().single();
  if (!roleOnly.error) {
    return roleOnly.data as Profile;
  }

  const adminOnly = await supabase
    .from("profiles")
    .update({ is_admin: role === "admin" })
    .eq("id", id)
    .select()
    .single();
  if (!adminOnly.error) {
    return adminOnly.data as Profile;
  }

  const fallback = await supabase
    .from("announcements")
    .insert([
      {
        title: `${ADMIN_ROLE_PREFIX}${id}:${role}`,
        description: "System role override",
        priority: "normal",
      },
    ])
    .select()
    .single();

  if (fallback.error) return null;

  const profile = await getProfile(id);
  if (profile) {
    return {
      ...profile,
      role,
      is_admin: role === "admin",
    };
  }

  return {
    id,
    email: "",
    full_name: "",
    avatar_url: "",
    phone_number: null,
    role,
    is_admin: role === "admin",
  };
}

export async function deleteProfile(id: string): Promise<void> {
  await supabase.from("profiles").delete().eq("id", id);
}
