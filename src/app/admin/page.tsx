"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import "./admin.css";
import type {
  BusTiming,
  TrainTiming,
  WaterUpdate,
  CanalUpdate,
  Announcement,
  NotificationEntry,
  VillageEvent,
  VillageLocation,
  Profile,
  DataCategory,
} from "@/lib/types";
import * as store from "@/lib/store";
import { supabase } from "@/lib/supabase";

const MASTER_ADMIN_EMAIL = "arunkumail29@gmail.com";

// ─── Tab definitions ───
const TABS: { key: DataCategory; label: string; emoji: string }[] = [
  { key: "bus", label: "Bus", emoji: "🚌" },
  { key: "train", label: "Train", emoji: "🚆" },
  { key: "water", label: "Water", emoji: "💧" },
  { key: "canal", label: "Canal", emoji: "🌊" },
  { key: "announcement", label: "Announce", emoji: "📢" },
  { key: "notification", label: "Notify", emoji: "🔔" },
  { key: "event", label: "Events", emoji: "📅" },
  { key: "location", label: "Maps", emoji: "📍" },
  { key: "users", label: "Users", emoji: "👥" },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<DataCategory>("bus");
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const sectionSuffix: Record<DataCategory, string> = {
    bus: "Timings",
    train: "Timings",
    water: "Timings",
    canal: "Updates",
    announcement: "Feed",
    notification: "Feed",
    event: "Calendar",
    location: "Directory",
    users: "Directory",
  };

  const refresh = () => setRefreshKey((k) => k + 1);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <div className="admin-shell">
      {/* ─── Top Bar ─── */}
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <div className="admin-logo">V</div>
          <h1>Admin<span>Console</span></h1>
        </div>
        <Link href="/" className="admin-back-link">← Back to App</Link>
      </header>

      {/* ─── Tabs ─── */}
      <div className="admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`admin-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => { setActiveTab(tab.key); setShowForm(false); }}
          >
            <span className="tab-emoji">{tab.emoji}</span>
            {tab.label}
            <TabCount category={tab.key} refreshKey={refreshKey} />
          </button>
        ))}
      </div>

      {/* ─── Content ─── */}
      <div className="admin-content">
        <div className="admin-section-header">
          <h2>
            {TABS.find((t) => t.key === activeTab)?.emoji} {TABS.find((t) => t.key === activeTab)?.label}{" "}
            {sectionSuffix[activeTab]}
          </h2>
          {activeTab !== "users" && (
            <button className="btn-add" onClick={() => setShowForm(true)}>
              + Add
            </button>
          )}
        </div>

        <DataList category={activeTab} refreshKey={refreshKey} onRefresh={refresh} onToast={showToast} />
      </div>

      {/* ─── Form Modal ─── */}
      {showForm && (
        <FormModal
          category={activeTab}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refresh(); showToast("Saved successfully!"); }}
        />
      )}

      {/* ─── Toast ─── */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════
// Tab Count Badge
// ═══════════════════════════════════════════
function TabCount({ category, refreshKey }: { category: DataCategory; refreshKey: number }) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    const fetchCount = async () => {
      const counts: Record<DataCategory, () => Promise<unknown[]>> = {
        bus: store.getBusTimings,
        train: store.getTrainTimings,
        water: store.getWaterUpdates,
        canal: store.getCanalUpdates,
        announcement: store.getAnnouncements,
        notification: store.getNotifications,
        event: store.getEvents,
        location: store.getVillageLocations,
        users: store.getAllProfiles,
      };
      const items = await counts[category]();
      if (active) setCount(items.length);
    };
    fetchCount();
    return () => { active = false; };
  }, [category, refreshKey]);

  if (!count) return null;
  return <span className="tab-count">{count}</span>;
}

// ═══════════════════════════════════════════
// Data List
// ═══════════════════════════════════════════
function DataList({
  category,
  refreshKey,
  onRefresh,
  onToast,
}: {
  category: DataCategory;
  refreshKey: number;
  onRefresh: () => void;
  onToast: (msg: string) => void;
}) {
  const [items, setItems] = useState<unknown[]>([]);

  useEffect(() => {
    let active = true;
    const loadItems = async () => {
      const loaders: Record<DataCategory, () => Promise<unknown[]>> = {
        bus: store.getBusTimings,
        train: store.getTrainTimings,
        water: store.getWaterUpdates,
        canal: store.getCanalUpdates,
        announcement: store.getAnnouncements,
        notification: store.getNotifications,
        event: store.getEvents,
        location: store.getVillageLocations,
        users: store.getAllProfiles,
      };
      const data = await loaders[category]();
      if (active) setItems(data);
    };
    loadItems();
    return () => { active = false; };
  }, [category, refreshKey]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const deleters: Record<DataCategory, (id: string) => Promise<void>> = {
      bus: store.deleteBusTiming,
      train: store.deleteTrainTiming,
      water: store.deleteWaterUpdate,
      canal: store.deleteCanalUpdate,
      announcement: store.deleteAnnouncement,
      notification: store.deleteNotification,
      event: store.deleteEvent,
      location: store.deleteVillageLocation,
      users: store.deleteProfile,
    };
    await deleters[category](id);
    onRefresh();
    onToast("Deleted!");
  };

  const handleToggleAdmin = async (profile: Profile) => {
    const isMasterAdmin = profile.email === MASTER_ADMIN_EMAIL;
    if (isMasterAdmin) {
      onToast("Master admin role cannot be changed.");
      return;
    }

    const nextRole: "user" | "admin" = profile.role === "admin" || profile.is_admin ? "user" : "admin";
    const updated = await store.updateProfileRole(profile.id, nextRole);
    if (!updated) {
      onToast("Failed to update user role.");
      return;
    }
    onRefresh();
    onToast(nextRole === "admin" ? "User made admin." : "Admin access removed.");
  };

  const handleRemoveUser = async (profile: Profile) => {
    const isMasterAdmin = profile.email === MASTER_ADMIN_EMAIL;
    if (isMasterAdmin) {
      onToast("Master admin cannot be removed.");
      return;
    }
    if (!confirm(`Remove ${profile.full_name || profile.email} from app users?`)) return;
    await store.deleteProfile(profile.id);
    onRefresh();
    onToast("User removed.");
  };

  if (items.length === 0) {
    const emptyMessages: Record<DataCategory, string> = {
      bus: "No bus timings added yet",
      train: "No train timings added yet",
      water: "No water updates added yet",
      canal: "No canal updates added yet",
      announcement: "No announcements yet",
      notification: "No notifications yet",
      event: "No events added yet",
      location: "No map locations added yet",
      users: "No users available",
    };
    return (
      <div className="admin-empty">
        <div className="empty-emoji">{TABS.find((t) => t.key === category)?.emoji}</div>
        <h3>{emptyMessages[category]}</h3>
        <p>{category === "users" ? "Users appear here after sign-in." : "Click \"+ Add\" to create one"}</p>
      </div>
    );
  }

  return (
    <div className="data-list">
      {items.map((item) => {
        const row = item as { id: string };
        return (
        <div key={row.id} className="data-card">
          <div className="data-card-body">
            {category === "bus" && <BusCardAdmin item={item as BusTiming} />}
            {category === "train" && <TrainCard item={item as TrainTiming} />}
            {category === "water" && <WaterCard item={item as WaterUpdate} />}
            {category === "canal" && <CanalCard item={item as CanalUpdate} />}
            {category === "announcement" && <AnnouncementCard item={item as Announcement} />}
            {category === "notification" && <NotificationCard item={item as NotificationEntry} />}
            {category === "event" && <EventCard item={item as VillageEvent} />}
            {category === "location" && <LocationCard item={item as VillageLocation} />}
            {category === "users" && <UserCard item={item as Profile} />}
          </div>
          <div className="data-card-actions">
            {category !== "users" ? (
              <button className="btn-icon delete" title="Delete" onClick={() => handleDelete(row.id)}>
                🗑
              </button>
            ) : (
              <>
                <button
                  className="btn-icon"
                  title={(item as Profile).role === "admin" || (item as Profile).is_admin ? "Remove admin" : "Make admin"}
                  onClick={() => handleToggleAdmin(item as Profile)}
                >
                  {(item as Profile).role === "admin" || (item as Profile).is_admin ? "👤" : "⭐"}
                </button>
                <button
                  className="btn-icon delete"
                  title="Remove user"
                  onClick={() => handleRemoveUser(item as Profile)}
                >
                  🗑
                </button>
              </>
            )}
          </div>
        </div>
      )})}
    </div>
  );
}

// ═══════════════════════════════════════════
// Individual Card Renderers
// ═══════════════════════════════════════════

function UserCard({ item }: { item: Profile }) {
  const role = item.role === "admin" || item.is_admin ? "admin" : "user";
  return (
    <>
      {item.avatar_url && (
        <img src={item.avatar_url} alt="Av" style={{ width: 32, height: 32, borderRadius: '50%', marginBottom: 8 }} />
      )}
      <div className="data-card-title">{item.full_name}</div>
      <div className="data-card-subtitle">{item.email}</div>
      <div className="data-card-meta">
        <span className="data-chip active" style={{ fontSize: 12 }}>📞 {item.phone_number}</span>
        <span className={`data-chip ${role === "admin" ? "important" : ""}`}>
          {role === "admin" ? "Admin" : "User"}
        </span>
      </div>
    </>
  );
}

function BusCardAdmin({ item }: { item: BusTiming }) {
  return (
    <>
      <div className="data-card-title">{item.routeNumber} — {item.from} → {item.to}</div>
      <div className="data-card-subtitle">
        Departs at {format12h(item.departureTime)} · {item.serviceName || item.operatorType || 'TNSTC'}
      </div>
      <div className="data-card-meta">
        <span className={`data-chip ${item.isActive ? "active" : "inactive"}`}>
          {item.isActive ? "Active" : "Inactive"}
        </span>
        {item.fareType && <span className="data-chip">{item.fareType === 'free' ? 'Free' : 'Paid'}</span>}
      </div>
    </>
  );
}

function format12h(timeStr: string): string {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function TrainCard({ item }: { item: TrainTiming }) {
  return (
    <>
      <div className="data-card-title">{item.trainName}</div>
      <div className="data-card-subtitle">
        #{item.trainNumber} · {item.from} → {item.to} · Departs {item.departureTime}
      </div>
      <div className="data-card-meta">
        <span className="data-chip">Nearby: {item.nearbyStation}</span>
        <span className={`data-chip ${item.isActive ? "active" : "inactive"}`}>
          {item.isActive ? "Active" : "Inactive"}
        </span>
      </div>
    </>
  );
}

function WaterCard({ item }: { item: WaterUpdate }) {
  return (
    <>
      <div className="data-card-title">{item.zone}</div>
      <div className="data-card-subtitle">
        {item.session === "morning" ? "🌅" : "🌇"} {item.session} · {item.startTime} — {item.endTime} · {item.durationMins} mins
      </div>
      <div className="data-card-meta">
        <span className={`data-chip ${item.isActive ? "active" : "inactive"}`}>
          {item.isActive ? "Active" : "Inactive"}
        </span>
      </div>
    </>
  );
}

function CanalCard({ item }: { item: CanalUpdate }) {
  return (
    <>
      <div className="data-card-title">{item.title}</div>
      <div className="data-card-subtitle">{item.description}</div>
      <div className="data-card-meta">
        <span className={`data-chip ${item.status}`}>{item.status}</span>
        <span className={`data-chip ${item.waterLevel}`}>Water: {item.waterLevel}</span>
      </div>
    </>
  );
}

function AnnouncementCard({ item }: { item: Announcement }) {
  return (
    <>
      <div className="data-card-title" style={{ fontWeight: "normal", fontSize: "12px" }}>{item.description}</div>
      <div className="data-card-meta">
        <span className={`data-chip ${item.priority}`}>{item.priority}</span>
      </div>
    </>
  );
}

function NotificationCard({ item }: { item: NotificationEntry }) {
  return (
    <>
      <div className="data-card-title">{item.title}</div>
      <div className="data-card-subtitle">{item.description}</div>
      <div className="data-card-meta">
        <span className="data-chip">{item.targetType === "all" ? "All users" : "Selected users"}</span>
        {item.targetType === "selected" && (
          <span className="data-chip">{item.targetUserIds?.length || 0} recipients</span>
        )}
        <span className={`data-chip ${item.isActive ? "active" : "inactive"}`}>
          {item.isActive ? "Active" : "Inactive"}
        </span>
      </div>
    </>
  );
}

function EventCard({ item }: { item: VillageEvent }) {
  return (
    <>
      <div className="data-card-title">{item.title}</div>
      <div className="data-card-subtitle">{item.description}</div>
      <div className="data-card-meta">
        <span className="data-chip">📍 {item.location}</span>
        <span className="data-chip">📅 {item.date}</span>
        <span className="data-chip">⏰ {item.time}</span>
      </div>
    </>
  );
}

function LocationCard({ item }: { item: VillageLocation }) {
  return (
    <>
      <div className="data-card-title">{item.name}</div>
      <div className="data-card-subtitle">{item.category} · Lat: {item.lat}, Lng: {item.lng}</div>
      <div className="data-card-meta">
        <span className={`data-chip ${item.category}`}>{item.category}</span>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════
// Form Modal
// ═══════════════════════════════════════════
function FormModal({
  category,
  onClose,
  onSaved,
}: {
  category: DataCategory;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h3>Add {TABS.find((t) => t.key === category)?.label}</h3>
        {category === "bus" && <BusForm onSaved={onSaved} onClose={onClose} />}
        {category === "train" && <TrainForm onSaved={onSaved} onClose={onClose} />}
        {category === "water" && <WaterForm onSaved={onSaved} onClose={onClose} />}
        {category === "canal" && <CanalForm onSaved={onSaved} onClose={onClose} />}
        {category === "announcement" && <AnnouncementForm onSaved={onSaved} onClose={onClose} />}
        {category === "notification" && <NotificationForm onSaved={onSaved} onClose={onClose} />}
        {category === "event" && <EventForm onSaved={onSaved} onClose={onClose} />}
        {category === "location" && <LocationForm onSaved={onSaved} onClose={onClose} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Individual Forms
// ═══════════════════════════════════════════

function BusForm({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const [routeNumber, setRouteNumber] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [serviceName, setServiceName] = useState("TNSTC");
  const [operatorType, setOperatorType] = useState<"government" | "private">("government");
  const [fareType, setFareType] = useState<"free" | "paid">("paid");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await store.addBusTiming({ routeNumber, from, to, departureTime, serviceName, operatorType, fareType, isActive: true });
    if (!result) { alert("Failed to save! Please ensure the Supabase SQL tables were created and RLS is disabled."); return; }
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>Route Number</label>
          <input className="form-input" placeholder="e.g. 3A" value={routeNumber} onChange={(e) => setRouteNumber(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Service Name</label>
          <input className="form-input" placeholder="e.g. TNSTC" value={serviceName} onChange={(e) => setServiceName(e.target.value)} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>From</label>
          <input className="form-input" placeholder="Origin" value={from} onChange={(e) => setFrom(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>To</label>
          <input className="form-input" placeholder="Destination" value={to} onChange={(e) => setTo(e.target.value)} required />
        </div>
      </div>
      <div className="form-group">
        <label>Departure Time</label>
        <input className="form-input" type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} required />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Ownership Type</label>
          <select className="form-select" value={operatorType} onChange={(e) => setOperatorType(e.target.value as "government" | "private")}>
            <option value="government">Government</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div className="form-group">
          <label>Fare Type</label>
          <select className="form-select" value={fareType} onChange={(e) => setFareType(e.target.value as "free" | "paid")}>
            <option value="paid">Paid</option>
            <option value="free">Free</option>
          </select>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-submit">Save Bus Timing</button>
      </div>
    </form>
  );
}

function TrainForm({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const [trainName, setTrainName] = useState("");
  const [trainNumber, setTrainNumber] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [nearbyStation, setNearbyStation] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await store.addTrainTiming({ trainName, trainNumber, from, to, departureTime, nearbyStation, isActive: true });
    if (!result) { alert("Failed to save! Please ensure the Supabase SQL tables were created and RLS is disabled."); return; }
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>Train Name</label>
          <input className="form-input" placeholder="e.g. Intercity Express" value={trainName} onChange={(e) => setTrainName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Train Number</label>
          <input className="form-input" placeholder="e.g. 16722" value={trainNumber} onChange={(e) => setTrainNumber(e.target.value)} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>From</label>
          <input className="form-input" placeholder="Origin Station" value={from} onChange={(e) => setFrom(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>To</label>
          <input className="form-input" placeholder="Destination Station" value={to} onChange={(e) => setTo(e.target.value)} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Departure Time</label>
          <input className="form-input" type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Nearby Station</label>
          <input className="form-input" placeholder="e.g. Gomangalam" value={nearbyStation} onChange={(e) => setNearbyStation(e.target.value)} required />
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-submit">Save Train Timing</button>
      </div>
    </form>
  );
}

function WaterForm({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const [session, setSession] = useState<"morning" | "evening">("morning");
  const [zone, setZone] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [durationMins, setDurationMins] = useState(60);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await store.addWaterUpdate({ session, zone, startTime, endTime, durationMins, isActive: true });
    if (!result) { alert("Failed to save! Please ensure the Supabase SQL tables were created and RLS is disabled."); return; }
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>Session</label>
          <select className="form-select" value={session} onChange={(e) => setSession(e.target.value as "morning" | "evening")}>
            <option value="morning">Morning</option>
            <option value="evening">Evening</option>
          </select>
        </div>
        <div className="form-group">
          <label>Zone</label>
          <input className="form-input" placeholder="e.g. South Street (Zone A)" value={zone} onChange={(e) => setZone(e.target.value)} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Start Time</label>
          <input className="form-input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>End Time</label>
          <input className="form-input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
        </div>
      </div>
      <div className="form-group">
        <label>Duration (minutes)</label>
        <input className="form-input" type="number" min={1} value={durationMins} onChange={(e) => setDurationMins(Number(e.target.value))} required />
      </div>
      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-submit">Save Water Update</button>
      </div>
    </form>
  );
}

function CanalForm({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"open" | "closed" | "maintenance">("open");
  const [waterLevel, setWaterLevel] = useState<"low" | "normal" | "high" | "flood">("normal");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await store.addCanalUpdate({ title, description, status, waterLevel, updatedAt: new Date().toISOString() });
    if (!result) { alert("Failed to save! Please ensure the Supabase SQL tables were created and RLS is disabled."); return; }
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Title</label>
        <input className="form-input" placeholder="e.g. PAP Canal Main Gate" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea className="form-textarea" placeholder="Canal status details..." value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Status</label>
          <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value as "open" | "closed" | "maintenance")}>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <div className="form-group">
          <label>Water Level</label>
          <select className="form-select" value={waterLevel} onChange={(e) => setWaterLevel(e.target.value as "low" | "normal" | "high" | "flood")}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="flood">Flood</option>
          </select>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-submit">Save Canal Update</button>
      </div>
    </form>
  );
}

function AnnouncementForm({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"normal" | "important" | "urgent">("normal");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await store.addAnnouncement({ title: "", description, priority });
    if (!result) { alert("Failed to save! Please ensure the Supabase SQL tables were created and RLS is disabled."); return; }
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Description</label>
        <textarea className="form-textarea" placeholder="Announcement details..." value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Priority</label>
        <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value as "normal" | "important" | "urgent")}>
          <option value="normal">Normal</option>
          <option value="important">Important</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-submit">Save Announcement</button>
      </div>
    </form>
  );
}

function NotificationForm({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetType, setTargetType] = useState<"all" | "selected">("all");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [users, sessionResult] = await Promise.all([store.getAllProfiles(), supabase.auth.getSession()]);
      if (!active) return;
      setProfiles(users);
      const userId = sessionResult.data.session?.user?.id;
      if (userId) setCurrentUserId(userId);
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const toggleUserSelection = (id: string) => {
    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (targetType === "selected" && selectedUserIds.length === 0) {
      alert("Choose at least one user for selected notifications.");
      return;
    }

    const result = await store.addNotification({
      title,
      description,
      targetType,
      targetUserIds: targetType === "all" ? [] : selectedUserIds,
      isActive: true,
      createdBy: currentUserId,
    });

    if (!result) {
      alert("Failed to save notification. Please create the notifications table in Supabase.");
      return;
    }

    onSaved();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Notification Title</label>
        <input
          className="form-input"
          placeholder="e.g. Water supply delayed"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea
          className="form-textarea"
          placeholder="Message for users..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Recipients</label>
        <select
          className="form-select"
          value={targetType}
          onChange={(e) => setTargetType(e.target.value as "all" | "selected")}
        >
          <option value="all">All users</option>
          <option value="selected">Selected users</option>
        </select>
      </div>

      {targetType === "selected" && (
        <div className="form-group">
          <label>Select Users</label>
          <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 10 }}>
            {profiles.length === 0 ? (
              <div style={{ fontSize: 12, color: "#94a3b8" }}>No users available.</div>
            ) : (
              profiles.map((profile) => (
                <label
                  key={profile.id}
                  style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13, color: "#f1f5f9" }}
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(profile.id)}
                    onChange={() => toggleUserSelection(profile.id)}
                  />
                  <span>{profile.full_name || profile.email}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-submit">
          Send Notification
        </button>
      </div>
    </form>
  );
}

function EventForm({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await store.addEvent({ title, description, date, time, location });
    if (!result) { alert("Failed to save! Please ensure the Supabase SQL tables were created and RLS is disabled."); return; }
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Event Title</label>
        <input className="form-input" placeholder="e.g. Pongal Celebration" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea className="form-textarea" placeholder="Event details..." value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Date</label>
          <input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Time</label>
          <input className="form-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
        </div>
      </div>
      <div className="form-group">
        <label>Location</label>
        <input className="form-input" placeholder="e.g. Village Temple Ground" value={location} onChange={(e) => setLocation(e.target.value)} required />
      </div>
      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-submit">Save Event</button>
      </div>
    </form>
  );
}

function LocationForm({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<any>("temple");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [description, setDescription] = useState("");
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);

  const villageCenter: [number, number] = [10.6049693, 77.1235782];

  useEffect(() => {
    // Load Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      const L = (window as any).L;
      if (!L) return;

      const leafletMap = L.map("map-picker-container", {
        center: villageCenter,
        zoom: 16,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(leafletMap);

      leafletMap.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        setLat(lat.toFixed(7));
        setLng(lng.toFixed(7));
      });

      setMap(leafletMap);
    };
    document.head.appendChild(script);

    return () => {
      link.remove();
      script.remove();
    };
  }, []);

  useEffect(() => {
    const L = (window as any).L;
    if (!map || !L || !lat || !lng) return;

    const pLat = parseFloat(lat);
    const pLng = parseFloat(lng);
    if (isNaN(pLat) || isNaN(pLng)) return;

    if (marker) {
      marker.setLatLng([pLat, pLng]);
    } else {
      const newMarker = L.marker([pLat, pLng], {
        draggable: true
      }).addTo(map);
      
      newMarker.on('dragend', (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        setLat(lat.toFixed(7));
        setLng(lng.toFixed(7));
      });

      setMarker(newMarker);
    }
  }, [map, lat, lng]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await store.addVillageLocation({ name, category, lat: parseFloat(lat), lng: parseFloat(lng), description });
    if (!result) { alert("Failed to save! Please ensure the village_locations table exists."); return; }
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Place Name</label>
        <input className="form-input" placeholder="e.g. Vinayagar Kovil" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Category</label>
          <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="temple">Temple</option>
            <option value="school">School</option>
            <option value="panchayat">Panchayat Office</option>
            <option value="vao">VAO Office</option>
            <option value="lake">Lake</option>
            <option value="shop">Shop</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      
      <div className="form-group">
        <label>Select Location on Map</label>
        <div className="admin-map-picker">
          <div className="map-picker-hint">Tap on map or drag marker to set location</div>
          <div id="map-picker-container" style={{ width: '100%', height: '100%' }}></div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Latitude</label>
            <input className="form-input" type="number" step="any" placeholder="Auto-filled" value={lat} onChange={(e) => setLat(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Longitude</label>
            <input className="form-input" type="number" step="any" placeholder="Auto-filled" value={lng} onChange={(e) => setLng(e.target.value)} required />
          </div>
        </div>
      </div>
      <div className="form-group">
        <label>Description (Optional)</label>
        <textarea className="form-textarea" placeholder="Details about this place..." value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-submit">Save Location</button>
      </div>
    </form>
  );
}
