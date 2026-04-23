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

  const renderTrainCard = (train: any, idx: number) => {
    const isApi = "live" in train;
    const trainNumber = isApi ? train.train.number : train.trainNumber;
    const trainName = isApi ? train.train.name : train.trainName;
    const fromLoc = isApi ? train.train.source?.name : train.from;
    const toLoc = isApi ? train.train.destination?.name : train.to;
    const time = isApi ? (train.live.expectedDeparture || train.live.expectedArrival) : train.departureTime;
    const delay = isApi ? train.live.departureDelayDisplay || train.live.arrivalDelayDisplay : null;
    const isCancelled = isApi ? train.status.isCancelled : false;
    const nearby = isApi ? null : train.nearbyStation;

    const matchesSearch = 
      trainName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fromLoc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      toLoc?.toLowerCase().includes(searchQuery.toLowerCase());

    if (searchQuery && !matchesSearch) return null;

    return (
      <div key={train.id || idx} className={`train-item-card ${isCancelled ? "cancelled" : ""}`}>
        <div className="train-item-header">
          <div className="train-icon-wrap">
            <Train size={20} />
          </div>
          <div className="train-info">
            <div className="train-badges">
              <span className="train-num-chip">{trainNumber}</span>
              <span className="train-name-chip">{trainName}</span>
            </div>
          </div>
          {isCancelled && <span className="cancelled-badge">Cancelled</span>}
        </div>

        <div className="train-route-visual">
          <div className="train-station-chip start">
            <MapPin size={12} />
            <span>{fromLoc}</span>
          </div>
          
          <div className="train-track-container">
            <div className="train-track-line">
              <div className="track-dots"></div>
            </div>
            {nearby && (
              <div className="train-nearby-chip">
                <span>{nearby}</span>
              </div>
            )}
          </div>
          
          <div className="train-station-chip end">
            <MapPin size={12} />
            <span>{toLoc}</span>
          </div>
        </div>

        <div className="train-item-footer">
          <div className="train-schedule-info">
            <div className="schedule-chip depart">
              <Clock size={12} />
              <span>{isApi && typeof time === "string" && !time.includes(":") ? time : format12h(time)}</span>
            </div>
            {nearby && (
              <div className="schedule-chip nearby">
                <MapPin size={12} />
                <span>Platform {train.platform || "?"}</span>
              </div>
            )}
          </div>
          <button className="train-action-btn">
            <Navigation size={16} />
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
      <header className="trains-header">
        <div className="header-top">
          <Link href="/" className="back-button">
            <ArrowLeft size={24} />
          </Link>
          <div className="header-title-center">
            <h1>Train Schedules</h1>
          </div>
          <button className="refresh-btn" onClick={fetchRailRadarLiveAPI}>
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
        </div>
        
        <div className="search-bar-container">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search train name or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="connection-status">
          {isLiveApi ? (
            <span className="status-online"><span className="status-dot"></span> LIVE</span>
          ) : (
            <span className="status-offline"><AlertCircle size={12} /> Offline Mode</span>
          )}
        </div>
      </header>

      <div className="trains-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Scanning station...</p>
          </div>
        ) : filteredTrains.length === 0 ? (
          <div className="empty-state">
            <div className="empty-emoji">🚆</div>
            <h3>No trains found</h3>
            <p>Try adjusting your search.</p>
          </div>
        ) : (
          <div className="train-list">
            {filteredTrains.map((t, idx) => renderTrainCard(t, idx))}
          </div>
        )}
      </div>

      <div className="trains-bottom-nav-spacer" />
    </div>
  );
}