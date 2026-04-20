"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import "./admin.css";
import type {
  BusTiming,
  TrainTiming,
  WaterUpdate,
  CanalUpdate,
  Announcement,
  VillageEvent,
  DataCategory,
} from "@/lib/types";
import * as store from "@/lib/store";

// ─── Tab definitions ───
const TABS: { key: DataCategory; label: string; emoji: string }[] = [
  { key: "bus", label: "Bus", emoji: "🚌" },
  { key: "train", label: "Train", emoji: "🚆" },
  { key: "water", label: "Water", emoji: "💧" },
  { key: "canal", label: "Canal", emoji: "🌊" },
  { key: "announcement", label: "Announce", emoji: "📢" },
  { key: "event", label: "Events", emoji: "📅" },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<DataCategory>("bus");
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

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
          <h2>{TABS.find((t) => t.key === activeTab)?.emoji} {TABS.find((t) => t.key === activeTab)?.label} Timings</h2>
          <button className="btn-add" onClick={() => setShowForm(true)}>
            + Add
          </button>
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
      const counts: Record<DataCategory, () => Promise<any[]>> = {
        bus: store.getBusTimings,
        train: store.getTrainTimings,
        water: store.getWaterUpdates,
        canal: store.getCanalUpdates,
        announcement: store.getAnnouncements,
        event: store.getEvents,
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
        event: store.getEvents,
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
      event: store.deleteEvent,
    };
    await deleters[category](id);
    onRefresh();
    onToast("Deleted!");
  };

  if (items.length === 0) {
    const emptyMessages: Record<DataCategory, string> = {
      bus: "No bus timings added yet",
      train: "No train timings added yet",
      water: "No water updates added yet",
      canal: "No canal updates added yet",
      announcement: "No announcements yet",
      event: "No events added yet",
    };
    return (
      <div className="admin-empty">
        <div className="empty-emoji">{TABS.find((t) => t.key === category)?.emoji}</div>
        <h3>{emptyMessages[category]}</h3>
        <p>Click &quot;+ Add&quot; to create one</p>
      </div>
    );
  }

  return (
    <div className="data-list">
      {items.map((item: any) => (
        <div key={item.id} className="data-card">
          <div className="data-card-body">
            {category === "bus" && <BusCard item={item as BusTiming} />}
            {category === "train" && <TrainCard item={item as TrainTiming} />}
            {category === "water" && <WaterCard item={item as WaterUpdate} />}
            {category === "canal" && <CanalCard item={item as CanalUpdate} />}
            {category === "announcement" && <AnnouncementCard item={item as Announcement} />}
            {category === "event" && <EventCard item={item as VillageEvent} />}
          </div>
          <div className="data-card-actions">
            <button className="btn-icon delete" title="Delete" onClick={() => handleDelete(item.id)}>🗑</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// Individual Card Renderers
// ═══════════════════════════════════════════

function BusCard({ item }: { item: BusTiming }) {
  return (
    <>
      <div className="data-card-title">{item.routeNumber} — {item.from} → {item.to}</div>
      <div className="data-card-subtitle">Departs at {item.departureTime}</div>
      <div className="data-card-meta">
        <span className={`data-chip ${item.isActive ? "active" : "inactive"}`}>
          {item.isActive ? "Active" : "Inactive"}
        </span>
      </div>
    </>
  );
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
      <div className="data-card-title">{item.title}</div>
      <div className="data-card-subtitle">{item.description}</div>
      <div className="data-card-meta">
        <span className={`data-chip ${item.priority}`}>{item.priority}</span>
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
        {category === "event" && <EventForm onSaved={onSaved} onClose={onClose} />}
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await store.addBusTiming({ routeNumber, from, to, departureTime, isActive: true });
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Route Number</label>
        <input className="form-input" placeholder="e.g. 3A" value={routeNumber} onChange={(e) => setRouteNumber(e.target.value)} required />
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
    await store.addTrainTiming({ trainName, trainNumber, from, to, departureTime, nearbyStation, isActive: true });
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
    await store.addWaterUpdate({ session, zone, startTime, endTime, durationMins, isActive: true });
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
    await store.addCanalUpdate({ title, description, status, waterLevel, updatedAt: new Date().toISOString() });
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"normal" | "important" | "urgent">("normal");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await store.addAnnouncement({ title, description, priority });
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Title</label>
        <input className="form-input" placeholder="Announcement title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
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

function EventForm({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await store.addEvent({ title, description, date, time, location });
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
