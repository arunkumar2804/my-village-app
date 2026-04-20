"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, MapPin, Search } from "lucide-react";
import { getBusTimings } from "@/lib/store";
import type { BusTiming } from "@/lib/types";
import "./buses.css";

export default function BusSchedules() {
  const [buses, setBuses] = useState<BusTiming[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchBuses = async () => {
      const data = await getBusTimings();
      // Only show active buses
      setBuses(data.filter((b) => b.isActive));
      setLoading(false);
    };
    fetchBuses();
  }, []);

  const filteredBuses = buses.filter(
    (b) =>
      b?.to?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b?.routeNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function format12h(timeStr: string) {
    if (!timeStr) return "";
    const [hStr, mStr] = timeStr.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr || "0", 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
  }

  return (
    <div className="buses-page">
      <header className="buses-header">
        <div className="header-top">
          <Link href="/" className="back-button">
            <ArrowLeft size={24} />
          </Link>
          <h1>Bus Schedules</h1>
          <div style={{ width: 24 }} /> {/* alignment spacer */}
        </div>
        
        <div className="search-bar-container">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by destination or route number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="buses-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading timetables...</p>
          </div>
        ) : filteredBuses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-emoji">🚌</div>
            <h3>No buses found</h3>
            <p>We couldn't find any active schedules matching your search.</p>
          </div>
        ) : (
          <div className="bus-cards">
            {filteredBuses.map((bus) => (
              <div key={bus.id} className="bus-card-modern">
                <div className="bus-route-circle">
                  <span>{bus.routeNumber}</span>
                </div>

                <div className="bus-card-body">
                  <div className="bus-main-info">
                    <div className="bus-locations">
                      <span className="from-loc">{bus.from}</span>
                      <ArrowRight size={14} className="arrow-icon" />
                      <span className="to-loc">{bus.to}</span>
                    </div>
                    <div className="bus-time-wrapper">
                      <Clock size={14} className="time-icon" />
                      <span className="bus-time-text">{format12h(bus.departureTime)}</span>
                    </div>
                  </div>
                  
                  <div className="bus-card-footer">
                    <span className={`operator-chip ${bus.operator === "Private" ? "private" : "govt"}`}>
                      {bus.operator || "Government"}
                    </span>
                    <span className="status-chip active">On Schedule</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
