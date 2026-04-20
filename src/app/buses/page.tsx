"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, MapPin, Search } from "lucide-react";
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
      b.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.routeNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <div key={bus.id} className="bus-card-detailed">
                <div className="bus-card-time-column">
                  <div className="time-badge">
                    {bus.departureTime}
                  </div>
                  <div className="route-badge">
                    Route {bus.routeNumber}
                  </div>
                </div>

                <div className="bus-card-info-column">
                  <div className="bus-card-route">
                    <div className="route-point">
                      <div className="node start"></div>
                      <span className="location-name">{bus.from}</span>
                    </div>
                    <div className="route-line"></div>
                    <div className="route-point">
                      <div className="node end"></div>
                      <span className="location-name destination">{bus.to}</span>
                    </div>
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
