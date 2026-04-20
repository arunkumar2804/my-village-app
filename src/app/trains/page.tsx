"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, TrainFront, AlertCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { getTrainTimings } from "@/lib/store";
import type { TrainTiming } from "@/lib/types";
import "./trains.css";

// Example interface for Indian Rail API response
interface LiveTrainData {
  TrainNo: string;
  TrainName: string;
  Source: string;
  Destination: string;
  ExpectedArrival: string;
  ExpectedDeparture: string;
  Delay: string;
}

export default function TrainSchedules() {
  const [trains, setTrains] = useState<(TrainTiming | LiveTrainData)[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorObj, setErrorObj] = useState<string | null>(null);
  const [isLiveApi, setIsLiveApi] = useState(true);

  const fetchIndianRailwaysLiveAPI = async () => {
    try {
      setLoading(true);
      setErrorObj(null);
      
      // Get your API Key from environment variables (fallback logic to avoid crashing)
      const apiKey = process.env.NEXT_PUBLIC_RAIL_API_KEY;
      if (!apiKey) {
        throw new Error("Missing NEXT_PUBLIC_RAIL_API_KEY");
      }

      const res = await fetch(`https://indianrailapi.com/api/v2/livestation/apikey/${apiKey}/stationcode/GMGM/hours/4/`);
      if (!res.ok) throw new Error("API Connection Failed");

      const data = await res.json();
      if (data.ResponseCode === "200" && data.Trains) {
        setTrains(data.Trains);
        setIsLiveApi(true);
      } else {
        throw new Error(data.Message || "No live trains available");
      }
    } catch (e: any) {
      console.warn("Falling back to Supabase database:", e.message);
      // Fallback to Supabase
      setIsLiveApi(false);
      setErrorObj("Live API key requested. Showing scheduled village timetable instead.");
      const dbTrains = await getTrainTimings();
      setTrains(dbTrains.filter((t) => t.isActive));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndianRailwaysLiveAPI();
  }, []);

  function format12h(timeStr: string) {
    if (!timeStr) return "";
    const [hStr, mStr] = timeStr.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr || "0", 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
  }

  // Render a Train object from either Supabase (TrainTiming) or API (LiveTrainData)
  const renderTrainCard = (train: any, idx: number) => {
    // If it comes from API:
    const isApi = "TrainNo" in train;
    const trainNumber = isApi ? train.TrainNo : train.trainNumber;
    const trainName = isApi ? train.TrainName : train.trainName;
    const fromLoc = isApi ? train.Source : train.from;
    const toLoc = isApi ? train.Destination : train.to;
    const time = isApi ? train.ExpectedDeparture || train.ScheduleDeparture : train.departureTime;
    const delay = isApi ? train.Delay : null;

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
              <span className="train-time-text">{format12h(time)}</span>
            </div>
          </div>
          
          <div className="train-card-footer">
            <span className="platform-chip">Gomangalam (GMGM)</span>
            
            {delay && delay !== "On Time" && delay !== "0" && delay !== "" ? (
              <span className="status-chip delayed">Delayed {delay} mins</span>
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
          <button className="refresh-button" onClick={fetchIndianRailwaysLiveAPI}>
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
        </div>
      </header>

      {/* API Warning / Live Status Strip */}
      <div className={`connection-strip ${isLiveApi ? "live" : "fallback"}`}>
        {isLiveApi ? (
          <><TrainFront size={14} /> LIVE: Indian Railways GMGM Station Data</>
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
            <p>Fetching Gomangalam Station...</p>
          </div>
        ) : trains.length === 0 ? (
          <div className="empty-state">
            <div className="empty-emoji">🚆</div>
            <h3>No trains right now</h3>
            <p>Gomangalam station is currently clear for the next 4 hours.</p>
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
