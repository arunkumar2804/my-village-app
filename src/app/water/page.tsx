"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Droplets, Search, Clock3, MapPin, Sunrise, Sunset } from "lucide-react";
import { useRouter } from "next/navigation";
import { getWaterUpdates } from "@/lib/store";
import type { WaterUpdate } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import "./water.css";

function format12h(timeStr: string): string {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  const hNum = Number(hStr);
  const mNum = Number(mStr ?? "0");
  if (Number.isNaN(hNum) || Number.isNaN(mNum)) return timeStr;
  const ampm = hNum >= 12 ? "PM" : "AM";
  const h12 = hNum % 12 || 12;
  return `${h12}:${mNum.toString().padStart(2, "0")} ${ampm}`;
}

function getTodayTime(timeStr: string): Date | null {
  const [hStr, mStr] = timeStr.split(":");
  const hNum = Number(hStr);
  const mNum = Number(mStr ?? "0");
  if (Number.isNaN(hNum) || Number.isNaN(mNum)) return null;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hNum, mNum, 0, 0);
}

function getWaterStatus(item: WaterUpdate): "running" | "upcoming" | "completed" {
  const now = new Date();
  const start = getTodayTime(item.startTime);
  const end = getTodayTime(item.endTime);
  if (!start || !end) return "upcoming";

  if (now >= start && now <= end) return "running";
  if (now < start) return "upcoming";
  return "completed";
}

export default function WaterSchedulePage() {
  const router = useRouter();
  const [updates, setUpdates] = useState<WaterUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionFilter, setSessionFilter] = useState<"all" | "morning" | "evening">("all");

  useEffect(() => {
    const load = async () => {
      const waterRows = await getWaterUpdates();
      setUpdates(waterRows.filter((item) => item.isActive));
      setLoading(false);
    };

    void load();
  }, []);

  const filteredUpdates = useMemo(() => {
    return updates
      .filter((item) => {
        const zoneMatch = item.zone.toLowerCase().includes(searchQuery.toLowerCase());
        const sessionMatch = sessionFilter === "all" || item.session === sessionFilter;
        return zoneMatch && sessionMatch;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [updates, searchQuery, sessionFilter]);

  return (
    <div className="water-page">
      <header className="water-header">
        <div className="water-header-row">
          <button className="water-back-btn" onClick={() => router.back()}>
            <ArrowLeft size={22} />
          </button>
          <div className="water-heading-wrap">
            <h1>Water Schedule</h1>
            <p>Admin updates for all zones</p>
          </div>
          <div className="water-pill">
            <Droplets size={16} />
            <span>{updates.length}</span>
          </div>
        </div>

        <div className="water-search-wrap">
          <Search size={18} className="water-search-icon" />
          <input
            type="text"
            placeholder="Search by zone"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="water-filter-row">
          <button
            className={`water-filter-btn ${sessionFilter === "all" ? "active" : ""}`}
            onClick={() => setSessionFilter("all")}
          >
            All
          </button>
          <button
            className={`water-filter-btn ${sessionFilter === "morning" ? "active" : ""}`}
            onClick={() => setSessionFilter("morning")}
          >
            <Sunrise size={14} /> Morning
          </button>
          <button
            className={`water-filter-btn ${sessionFilter === "evening" ? "active" : ""}`}
            onClick={() => setSessionFilter("evening")}
          >
            <Sunset size={14} /> Evening
          </button>
        </div>
      </header>

      <main className="water-content">
        {loading ? (
          <div className="water-state">
            <div className="water-spinner" />
            <p>Loading water schedule...</p>
          </div>
        ) : filteredUpdates.length === 0 ? (
          <div className="water-state">
            <Droplets size={38} />
            <h3>No water schedules found</h3>
            <p>Try another zone or session filter.</p>
          </div>
        ) : (
          <div className="water-list">
            {filteredUpdates.map((item) => {
              const status = getWaterStatus(item);
              return (
                <article key={item.id} className="water-card">
                  <div className="water-card-top">
                    <span className={`water-status ${status}`}>
                      {status === "running" ? "Running now" : status === "upcoming" ? "Upcoming" : "Completed"}
                    </span>
                    <span className="water-session">{item.session}</span>
                  </div>

                  <h3 className="water-zone">
                    <MapPin size={16} />
                    <span>{item.zone}</span>
                  </h3>

                  <div className="water-time-row">
                    <div className="water-time-item">
                      <Clock3 size={14} />
                      <span>{format12h(item.startTime)} - {format12h(item.endTime)}</span>
                    </div>
                    <div className="water-duration">{item.durationMins} mins</div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
