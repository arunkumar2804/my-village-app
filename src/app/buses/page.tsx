"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Shield, Building2 } from "lucide-react";
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
      </div>

      <div className="buses-bottom-nav-spacer" />
    </div>
  );
}