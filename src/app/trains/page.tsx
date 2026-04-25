"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Train, Clock, MapPin, Navigation, RefreshCw, AlertCircle } from "lucide-react";
import { getTrainTimings } from "@/lib/store";
import type { TrainTiming } from "@/lib/types";
import "./trains.css";

interface RailRadarTrain {
  train: {
    number: string;
    name: string;
    source: { code: string; name: string };
    destination: { code: string; name: string };
  };
  live: {
    expectedArrival: string;
    expectedDeparture: string;
    arrivalDelayDisplay: string;
    departureDelayDisplay: string;
  };
  status: {
    isCancelled: boolean;
    hasDeparted: boolean;
  };
  platform: string;
}

import BottomNav from "@/components/BottomNav";

export default function TrainSchedules() {
  const [trains, setTrains] = useState<(TrainTiming | RailRadarTrain)[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveApi, setIsLiveApi] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRailRadarLiveAPI = async () => {
    try {
      setLoading(true);
      const apiKey = process.env.NEXT_PUBLIC_RAIL_RADAR_KEY;
      if (!apiKey) throw new Error("Missing API Key");

      const res = await fetch("https://api.railradar.org/api/v1/stations/GMGM/live?hours=8", {
        headers: { "x-api-key": apiKey }
      });
      
      if (!res.ok) throw new Error("API Failed");

      const data = await res.json();
      if (data && data.trains) {
        setTrains(data.trains);
        setIsLiveApi(true);
      }
    } catch {
      setIsLiveApi(false);
      const dbTrains = await getTrainTimings();
      setTrains(dbTrains.filter((t) => t.isActive));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRailRadarLiveAPI();
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

  const renderTrainCard = (train: any, idx: number) => {
    const isApi = "live" in train;
    const trainNumber = isApi ? train.train.number : train.trainNumber;
    const trainName = isApi ? train.train.name : train.trainName;
    const fromLoc = isApi ? train.train.source?.name : train.from;
    const toLoc = isApi ? train.train.destination?.name : train.to;
    const time = isApi ? (train.live.expectedDeparture || train.live.expectedArrival) : train.departureTime;
    const delay = isApi ? train.live.departureDelayDisplay || train.live.arrivalDelayDisplay : null;
    const isCancelled = isApi ? train.status.isCancelled : false;
    const platform = isApi ? train.platform : train.platform;

    const matchesSearch = 
      trainName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fromLoc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      toLoc?.toLowerCase().includes(searchQuery.toLowerCase());

    if (searchQuery && !matchesSearch) return null;

    const isLate = delay && !delay.includes("On Time");

    return (
      <div key={train.id || idx} className={`premium-train-card ${isCancelled ? "cancelled" : ""}`}>
        <div className="card-top">
          <div className="train-meta">
            <div className="train-id-badge">{trainNumber}</div>
            <h3 className="train-title">{trainName}</h3>
          </div>
          {isCancelled ? (
             <div className="status-tag cancelled">Cancelled</div>
          ) : isLate ? (
             <div className="status-tag delayed">{delay}</div>
          ) : (
             <div className="status-tag on-time">On Time</div>
          )}
        </div>

        <div className="route-container">
          <div className="route-visual">
            <div className="route-dot start" />
            <div className="route-line" />
            <div className="route-dot end" />
          </div>
          <div className="route-details">
            <div className="station-info">
              <span className="station-name">{fromLoc}</span>
              <span className="station-time">{isApi && typeof time === "string" && !time.includes(":") ? time : format12h(time)}</span>
            </div>
            <div className="station-info">
              <span className="station-name">{toLoc}</span>
            </div>
          </div>
        </div>

        <div className="card-footer">
          <div className="platform-info">
             <span className="platform-label">Platform</span>
             <span className="platform-val">{platform || "TBA"}</span>
          </div>
          <button className="navigate-button" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${trainName}+Train`, '_blank')}>
            <Navigation size={16} />
            <span>Track</span>
          </button>
        </div>
      </div>
    );
  };

  const filteredTrains = trains.filter(t => {
    if (!searchQuery) return true;
    const isApi = "live" in t;
    const name = isApi ? t.train.name : t.trainName;
    const num = isApi ? t.train.number : t.trainNumber;
    return name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           num?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="trains-page">
      <header className="premium-header">
        <div className="header-bg" />
        <div className="header-nav">
          <button className="back-btn" onClick={() => window.history.back()}>
            <ArrowLeft size={22} />
          </button>
          <div className="header-title">
            <h1>Rail Tracker</h1>
            <span className="header-subtitle">Pollachi Junction (POY)</span>
          </div>
          <button className="refresh-pill" onClick={fetchRailRadarLiveAPI}>
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            <span>Live</span>
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
            <div className={`status-orb ${isLiveApi ? 'online' : 'offline'}`} />
            <span>{isLiveApi ? 'Real-time Data' : 'Cached Schedule'}</span>
          </div>
        </div>
      </header>

      <main className="trains-list-container">
        {loading ? (
          <div className="loading-state">
            <div className="premium-spinner" />
            <p>Syncing rail traffic...</p>
          </div>
        ) : filteredTrains.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚂</div>
            <h3>No Trains Found</h3>
            <p>Try a different search term</p>
          </div>
        ) : (
          <div className="train-list">
            {filteredTrains.map((t, idx) => renderTrainCard(t, idx))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}