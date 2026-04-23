"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Bus, Clock, MapPin, Shield, Building2, Navigation, ChevronRight, Filter } from "lucide-react";
import { getBusTimings } from "@/lib/store";
import type { BusTiming } from "@/lib/types";
import "./buses.css";

export default function BusSchedules() {
  const [buses, setBuses] = useState<BusTiming[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "government" | "private">("all");

  useEffect(() => {
    const fetchBuses = async () => {
      const data = await getBusTimings();
      setBuses(data.filter((b) => b.isActive));
      setLoading(false);
    };
    fetchBuses();
  }, []);

  const filteredBuses = buses.filter((b) => {
    const matchesSearch = 
      b.to?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.routeNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filterType === "all" || 
      b.operatorType === filterType;
    return matchesSearch && matchesFilter;
  });

  function format12h(timeStr: string) {
    if (!timeStr) return "";
    const [hStr, mStr] = timeStr.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr || "0", 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
  }

  function getNextDeparture(timeStr: string): string {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
    const diffMs = target.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `in ${diffMins}m`;
    const hrs = Math.floor(diffMins / 60);
    return `in ${hrs}h ${diffMins % 60}m`;
  }

  const govtCount = buses.filter(b => b.operatorType === "government").length;
  const privateCount = buses.filter(b => b.operatorType === "private").length;

  return (
    <div className="buses-page">
      <header className="buses-header">
        <div className="header-top">
          <Link href="/" className="back-button">
            <ArrowLeft size={24} />
          </Link>
          <div className="header-title-center">
            <h1>Bus Schedules</h1>
          </div>
          <div style={{ width: 40 }} />
        </div>
        
        <div className="search-bar-container">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search route, destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All <span className="tab-count">{buses.length}</span>
          </button>
          <button 
            className={`filter-tab ${filterType === "government" ? "active govt" : ""}`}
            onClick={() => setFilterType("government")}
          >
            <Shield size={12} /> Govt <span className="tab-count">{govtCount}</span>
          </button>
          <button 
            className={`filter-tab ${filterType === "private" ? "active private" : ""}`}
            onClick={() => setFilterType("private")}
          >
            <Building2 size={12} /> Private <span className="tab-count">{privateCount}</span>
          </button>
        </div>
      </header>

      <div className="buses-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading schedules...</p>
          </div>
        ) : filteredBuses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-emoji">🚌</div>
            <h3>No buses found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="bus-list">
            {filteredBuses.map((bus, index) => (
              <div key={bus.id} className="bus-item-card">
                <div className="bus-item-header">
                  <div className="bus-number-badge">{bus.routeNumber}</div>
                  <span className={`bus-type-chip ${bus.operatorType === "government" ? "govt" : "private"}`}>
                    {bus.operatorType === "government" ? <Shield size={10} /> : <Building2 size={10} />}
                    {bus.operatorType === "government" ? "Govt" : "Private"}
                  </span>
                </div>

                <div className="bus-route-visual">
                  <div className="bus-stop-point start">
                    <div className="stop-marker"></div>
                    <span>{bus.from}</span>
                  </div>
                  <div className="bus-route-line">
                    <div className="route-progress" style={{ width: "60%" }}>
                      <Bus size={14} className="route-bus-icon" />
                    </div>
                  </div>
                  <div className="bus-stop-point end">
                    <div className="stop-marker end-marker"></div>
                    <span>{bus.to}</span>
                  </div>
                </div>

                <div className="bus-item-footer">
                  <div className="bus-schedule-info">
                    <div className="schedule-chip depart">
                      <Clock size={12} />
                      <span>{format12h(bus.departureTime)}</span>
                    </div>
                    <div className="schedule-chip next">
                      <MapPin size={12} />
                      <span>{getNextDeparture(bus.departureTime)}</span>
                    </div>
                  </div>
                  <button className="bus-action-btn">
                    <Navigation size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="buses-bottom-nav-spacer" />
    </div>
  );
}