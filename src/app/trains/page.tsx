"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, TrainFront, AlertCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { getTrainTimings } from "@/lib/store";
import type { TrainTiming } from "@/lib/types";
import "./trains.css";

// Interface for RailRadar API response
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
  const [errorObj, setErrorObj] = useState<string | null>(null);
  const [isLiveApi, setIsLiveApi] = useState(true);

  const fetchRailRadarLiveAPI = async () => {
    try {
      setLoading(true);
      setErrorObj(null);
      
      const apiKey = process.env.NEXT_PUBLIC_RAIL_RADAR_KEY;
      if (!apiKey) {
        throw new Error("Missing NEXT_PUBLIC_RAIL_RADAR_KEY");
      }

      // Using the RailRadar endpoint
      const res = await fetch("https://api.railradar.org/api/v1/stations/GMGM/live?hours=8", {
        headers: {
          "x-api-key": apiKey
        }
      });
      
      if (!res.ok) throw new Error("API Connection Failed");

      const data = await res.json();
      if (data && data.trains) {
        // Filter out trains that don't have expected time
        setTrains(data.trains);
        setIsLiveApi(true);
      } else {
        throw new Error(data.message || "No live trains available");
      }
    } catch (e: any) {
      console.warn("Falling back to Supabase database:", e.message);
      setIsLiveApi(false);
      setErrorObj(`API Error: ${e.message}. Showing scheduled village timetable instead.`);
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
    if (isNaN(h)) return timeStr; // For things like "10:00" from API
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
    
    // For live API use expectedDeparture (or expectedArrival if destination)
    const time = isApi ? (train.live.expectedDeparture || train.live.expectedArrival) : train.departureTime;
    
    const delay = isApi ? train.live.departureDelayDisplay || train.live.arrivalDelayDisplay : null;
    const isCancelled = isApi ? train.status.isCancelled : false;
    const platform = isApi ? train.platform : "N/A";

    return (
      <div key={train.id || idx} className="train-card-modern">
        <div className="train-route-circle">
          <TrainFront size={28} />
        </div>

        <div className="train-card-body">
          <div className="train-main-info">
            <div className="train-header-row">
              <span className="train-num-badge">{trainNumber}</span>
              <span className="train-name-text">{trainName}</span>
            </div>
            
            <div className="train-locations">
              <div className="station-node">
                <div className="node-dot"></div>
                <span className="station-text">{fromLoc}</span>
              </div>
              <div className="track-connector"></div>
              <div className="station-node endpoint">
                <div className="node-dot"></div>
                <span className="station-text">{toLoc}</span>
              </div>
            </div>
            
            <div className="train-time-wrapper">
              <Clock size={14} className="time-icon" />
              <span className="train-time-text">{isApi && typeof time === "string" && !time.includes(":") ? time : format12h(time)}</span>
            </div>
          </div>
          
          <div className="train-card-footer">
            <span className="platform-chip">Platform {platform || "?"}</span>
            
            {isCancelled ? (
              <span className="status-chip delayed" style={{color: '#dc2626'}}>Cancelled</span>
            ) : delay && delay !== "On Time" && delay !== "0" && delay !== "" && delay !== "RT" && delay !== "Right Time" ? (
              <span className="status-chip delayed">Delayed {delay}</span>
            ) : (
              <span className="status-chip active">On Time</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="trains-page">
      <header className="trains-header">
        <div className="header-top">
          <Link href="/" className="back-button">
            <ArrowLeft size={24} />
          </Link>
          <h1>Train Schedules</h1>
          <button className="refresh-button" onClick={fetchRailRadarLiveAPI}>
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
        </div>
      </header>

      <div className={`connection-strip ${isLiveApi ? "live" : "fallback"}`}>
        {isLiveApi ? (
          <><TrainFront size={14} /> LIVE: RailRadar Connected (GMGM Station)</>
        ) : (
          <><AlertCircle size={14} /> Offline: Showing local standard timetable</>
        )}
      </div>

      {errorObj && (
        <div className="api-warning">
          <AlertTriangle size={16} />
          <span>{errorObj}</span>
        </div>
      )}

      <div className="trains-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Scanning Gomangalam Station...</p>
          </div>
        ) : trains.length === 0 ? (
          <div className="empty-state">
            <div className="empty-emoji">🚆</div>
            <h3>No trains right now</h3>
            <p>Gomangalam station is currently clear for the next 8 hours.</p>
          </div>
        ) : (
          <div className="train-cards">
            {trains.map((t, idx) => renderTrainCard(t, idx))}
          </div>
        )}
      </div>
    </div>
  );
}
