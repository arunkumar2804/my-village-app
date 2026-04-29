"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, Navigation, RefreshCw } from "lucide-react";
import { getTrainTimings } from "@/lib/store";
import type { TrainTiming } from "@/lib/types";
import "./trains.css";

import BottomNav from "@/components/BottomNav";

export default function TrainSchedules() {
  const [trains, setTrains] = useState<TrainTiming[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTrainData = async () => {
    setLoading(true);
    const dbTrains = await getTrainTimings();
    setTrains(dbTrains.filter((t) => t.isActive));
    setLoading(false);
  };

  useEffect(() => {
    void fetchTrainData();
  }, []);

  function format12h(timeStr: string) {
    if (!timeStr) return "";
    const [hStr, mStr] = timeStr.split(":");
    if (!hStr || !mStr) return timeStr;
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr || "0", 10);
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
  }

  const filteredTrains = useMemo(() => {
    return trains.filter((t) => {
      if (!searchQuery) return true;
      const search = searchQuery.toLowerCase();
      return (
        t.trainName?.toLowerCase().includes(search) ||
        t.trainNumber?.toLowerCase().includes(search) ||
        t.from?.toLowerCase().includes(search) ||
        t.to?.toLowerCase().includes(search)
      );
    });
  }, [trains, searchQuery]);

  return (
    <div className="trains-page">
      <header className="premium-header">
        <div className="header-bg" />
        <div className="header-nav">
          <button className="back-btn" onClick={() => window.history.back()}>
            <ArrowLeft size={22} />
          </button>
          <div className="header-title">
            <h1>Train Schedules</h1>
            <span className="header-subtitle">Admin Console Entries</span>
          </div>
          <button className="refresh-pill" onClick={fetchTrainData}>
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="search-container">
          <div className="premium-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search train, number or station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-row">
          <div className="live-status-badge">
            <div className="status-orb online" />
            <span>Admin Data Source</span>
          </div>
        </div>
      </header>

      <main className="trains-list-container">
        {loading ? (
          <div className="loading-state">
            <div className="premium-spinner" />
            <p>Loading train schedules...</p>
          </div>
        ) : filteredTrains.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚂</div>
            <h3>No Trains Found</h3>
            <p>Try a different search term</p>
          </div>
        ) : (
          <div className="train-list">
            {filteredTrains.map((train) => (
              <div key={train.id} className="premium-train-card">
                <div className="card-top">
                  <div className="train-meta">
                    <div className="train-id-badge">{train.trainNumber}</div>
                    <h3 className="train-title">{train.trainName}</h3>
                  </div>
                  <div className="status-tag on-time">Scheduled</div>
                </div>

                <div className="route-container">
                  <div className="route-visual">
                    <div className="route-dot start" />
                    <div className="route-line" />
                    <div className="route-dot end" />
                  </div>
                  <div className="route-details">
                    <div className="station-info">
                      <span className="station-name">{train.from}</span>
                      <span className="station-time">{format12h(train.departureTime)}</span>
                    </div>
                    <div className="station-info">
                      <span className="station-name">{train.to}</span>
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <div className="platform-info">
                    <span className="platform-label">Nearby Station</span>
                    <span className="platform-val">{train.nearbyStation}</span>
                  </div>
                  <button
                    className="navigate-button"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          train.nearbyStation,
                        )}`,
                        "_blank",
                      )
                    }
                  >
                    <Navigation size={16} />
                    <span>Open map</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
