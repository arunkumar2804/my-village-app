"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Shield, Building2, Info } from "lucide-react";
import { getBusTimings } from "@/lib/store";
import BusCard from "@/components/BusCard";
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

  const govtCount = buses.filter(b => b.operatorType === "government").length;
  const privateCount = buses.filter(b => b.operatorType === "private").length;

  return (
    <div className="buses-page">
      {/* Background Aura Glow */}
      <div className="buses-aura-glow"></div>

      <header className="buses-hero">
        <div className="buses-hero-top">
          <Link href="/" className="buses-back-btn">
            <ArrowLeft size={24} />
          </Link>
          <div className="buses-hero-info">
            <h1>Bus Schedules</h1>
            <p>Real-time timings for your village</p>
          </div>
        </div>

        <div className="buses-stats-row">
          <div className="stat-pill">
            <span className="stat-val">{buses.length}</span>
            <span className="stat-lbl">Routes</span>
          </div>
          <div className="stat-pill govt">
            <span className="stat-val">{govtCount}</span>
            <span className="stat-lbl">Govt</span>
          </div>
          <div className="stat-pill private">
            <span className="stat-val">{privateCount}</span>
            <span className="stat-lbl">Private</span>
          </div>
        </div>
      </header>

      <div className="buses-controls-sticky">
        <div className="buses-search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search route or destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="buses-filter-bar">
          <button 
            className={`buses-filter-btn ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All
          </button>
          <button 
            className={`buses-filter-btn ${filterType === "government" ? "active" : ""}`}
            onClick={() => setFilterType("government")}
          >
            <Shield size={14} /> Government
          </button>
          <button 
            className={`buses-filter-btn ${filterType === "private" ? "active" : ""}`}
            onClick={() => setFilterType("private")}
          >
            <Building2 size={14} /> Private
          </button>
        </div>
      </div>

      <main className="buses-main-content">
        {loading ? (
          <div className="buses-loading">
            <div className="buses-spinner"></div>
            <p>Fetching latest schedules...</p>
          </div>
        ) : filteredBuses.length === 0 ? (
          <div className="buses-empty">
            <div className="empty-icon-wrap">🚌</div>
            <h3>No results found</h3>
            <p>Try searching for a different route or filter</p>
          </div>
        ) : (
          <div className="buses-list-view">
            <div className="list-section-header">
              <span>{filteredBuses.length} AVAILABLE SERVICES</span>
              <div className="header-line"></div>
            </div>
            {filteredBuses.map((bus) => (
              <BusCard
                key={bus.id}
                routeNumber={bus.routeNumber}
                fromLocation={bus.from}
                toLocation={bus.to}
                departureTime={bus.departureTime}
                serviceName={bus.serviceName}
                ownershipType={bus.operatorType === "government" ? "Government" : "Private"}
                fareType={bus.fareType === "free" ? "Free" : "Paid"}
              />
            ))}
          </div>
        )}
      </main>

      <div className="buses-bottom-spacer" />
      
      <div className="buses-info-banner">
        <Info size={16} />
        <span>Timings are subject to traffic conditions</span>
      </div>
    </div>
  );
}