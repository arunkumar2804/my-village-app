"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { ArrowRight, Clock, Sun, Bus, Train, Droplets, Info, RefreshCcw } from "lucide-react";
import { getBusTimings, getTrainTimings, getWaterUpdates } from "@/lib/store";
import type { BusTiming, TrainTiming, WaterUpdate } from "@/lib/types";
import "./live-updates.css";

// Helper to convert "HH:mm" to a target Date object, either today or tomorrow
function getNextOccurence(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

// Converts diff in ms to a friendly string and raw minutes
function getTimeData(targetDate: Date) {
  const diffMs = targetDate.getTime() - Date.now();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  
  let label = "Due";
  if (diffMins > 0 && diffMins < 60) label = `${diffMins}m`;
  else if (diffMins >= 60) {
    const hrs = Math.floor(diffMins / 60);
    label = `${hrs}h`;
  }

  return { label, mins: diffMins };
}

function format12h(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const mStr = m.toString().padStart(2, "0");
  return `${h12}:${mStr} ${ampm}`;
}

export default function LiveUpdates() {
  const [activeTab, setActiveTab] = useState<"all" | "transport" | "water">("all");
  const [nextBus, setNextBus] = useState<{ item: BusTiming; time: string; mins: number; date: Date } | null>(null);
  const [nextTrain, setNextTrain] = useState<{ item: TrainTiming; time: string; mins: number; date: Date } | null>(null);
  const [nextWater, setNextWater] = useState<{ item: WaterUpdate; time: string; mins: number; date: Date } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const calculateNext = async () => {
    setIsRefreshing(true);
    
    // Bus
    const activeBuses = (await getBusTimings()).filter((b) => b.isActive);
    if (activeBuses.length > 0) {
      let closest = activeBuses[0];
      let minDiff = Infinity;
      let closestDate = new Date();
      activeBuses.forEach((b) => {
        const d = getNextOccurence(b.departureTime);
        const diff = d.getTime() - Date.now();
        if (diff < minDiff) { minDiff = diff; closest = b; closestDate = d; }
      });
      const { label, mins } = getTimeData(closestDate);
      setNextBus({ item: closest, time: label, mins, date: closestDate });
    }

    // Train
    const activeTrains = (await getTrainTimings()).filter((t) => t.isActive);
    if (activeTrains.length > 0) {
      let closest = activeTrains[0];
      let minDiff = Infinity;
      let closestDate = new Date();
      activeTrains.forEach((t) => {
        const d = getNextOccurence(t.departureTime);
        const diff = d.getTime() - Date.now();
        if (diff < minDiff) { minDiff = diff; closest = t; closestDate = d; }
      });
      const { label, mins } = getTimeData(closestDate);
      setNextTrain({ item: closest, time: label, mins, date: closestDate });
    }

    // Water
    const activeWater = (await getWaterUpdates()).filter((w) => w.isActive);
    if (activeWater.length > 0) {
      let closest = activeWater[0];
      let minDiff = Infinity;
      let closestDate = new Date();
      activeWater.forEach((w) => {
        const d = getNextOccurence(w.startTime);
        const diff = d.getTime() - Date.now();
        if (diff < minDiff) { minDiff = diff; closest = w; closestDate = d; }
      });
      const { label, mins } = getTimeData(closestDate);
      setNextWater({ item: closest, time: label, mins, date: closestDate });
    }

    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    calculateNext();
    const intervalId = setInterval(calculateNext, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const ProgressRing = ({ mins, colorClass }: { mins: number, colorClass: string }) => {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    // Calculate percentage based on 120 mins max for visual effect
    const percentage = Math.max(0, Math.min(100, (mins / 120) * 100));
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="time-remaining-visual">
        <svg className="progress-ring-svg" width="64" height="64">
          <circle
            className="progress-ring-bg"
            stroke="rgba(0,0,0,0.05)"
            strokeWidth="4"
            fill="transparent"
            r={radius}
            cx="32"
            cy="32"
          />
          <circle
            className={`progress-ring-circle ${colorClass}`}
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx="32"
            cy="32"
          />
        </svg>
        <div className="time-val-overlay">
          <span className="num">{mins > 60 ? Math.floor(mins/60) : mins}</span>
          <span className="unit">{mins > 60 ? 'hr' : 'min'}</span>
        </div>
      </div>
    );
  };

  return (
    <section className="live-updates-container">
      <div className="live-updates-header">
        <h2>Live Updates</h2>
        <div className="live-filter-tabs">
          <button 
            className={`filter-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >All</button>
          <button 
            className={`filter-tab ${activeTab === "transport" ? "active" : ""}`}
            onClick={() => setActiveTab("transport")}
          >Transport</button>
          <button 
            className={`filter-tab ${activeTab === "water" ? "active" : ""}`}
            onClick={() => setActiveTab("water")}
          >Water</button>
        </div>
      </div>

      {(activeTab === "all" || activeTab === "transport") && nextBus && (
        <div className="enhanced-update-card">
          <div className="card-bg-glow glow-bus"></div>
          <div className="card-top-section">
            <div className="service-meta">
              <div className="service-icon-wrapper icon-bus">
                <Bus size={20} />
              </div>
              <div className="service-labels">
                <span className="service-type-label">Next Bus</span>
                <span className="service-main-name">{nextBus.item.routeNumber} Service</span>
              </div>
            </div>
            <div className="status-badge-premium">
              <div className="status-dot-pulse dot-bus"></div>
              Live Tracking
            </div>
          </div>

          <div className="card-middle-section">
            <div className="route-info-enhanced">
              <div className="route-path-enhanced">
                <span>{nextBus.item.from}</span>
                <ArrowRight size={14} className="route-arrow-enhanced" />
                <span>{nextBus.item.to}</span>
              </div>
              <div className="departure-info-enhanced">
                <Clock size={12} />
                <span>Departs at {format12h(nextBus.item.departureTime)}</span>
              </div>
            </div>
            <ProgressRing mins={nextBus.mins} colorClass="text-emerald-500" />
          </div>

          <div className="card-bottom-section">
            <div className="service-extra-info">
              <span className="extra-tag">{nextBus.item.operator || "Public"}</span>
              <span className="extra-tag">AC Bus</span>
            </div>
            <div className="next-following">
              Next in <span>45m</span>
            </div>
          </div>
        </div>
      )}

      {(activeTab === "all" || activeTab === "transport") && nextTrain && (
        <div className="enhanced-update-card">
          <div className="card-bg-glow glow-train"></div>
          <div className="card-top-section">
            <div className="service-meta">
              <div className="service-icon-wrapper icon-train">
                <Train size={20} />
              </div>
              <div className="service-labels">
                <span className="service-type-label">Next Train</span>
                <span className="service-main-name">{nextTrain.item.trainName}</span>
              </div>
            </div>
            <div className="status-badge-premium">
              <div className="status-dot-pulse dot-train"></div>
              On Time
            </div>
          </div>

          <div className="card-middle-section">
            <div className="route-info-enhanced">
              <div className="route-path-enhanced">
                <span>{nextTrain.item.from}</span>
                <ArrowRight size={14} className="route-arrow-enhanced" />
                <span>{nextTrain.item.to}</span>
              </div>
              <div className="departure-info-enhanced">
                <Clock size={12} />
                <span>Station: {nextTrain.item.nearbyStation} • {format12h(nextTrain.item.departureTime)}</span>
              </div>
            </div>
            <ProgressRing mins={nextTrain.mins} colorClass="text-indigo-500" />
          </div>

          <div className="card-bottom-section">
            <div className="service-extra-info">
              <span className="extra-tag">#{nextTrain.item.trainNumber}</span>
              <span className="extra-tag">Express</span>
            </div>
            <div className="next-following">
              Platform <span>02</span>
            </div>
          </div>
        </div>
      )}

      {(activeTab === "all" || activeTab === "water") && nextWater && (
        <div className="enhanced-update-card">
          <div className="card-bg-glow glow-water"></div>
          <div className="card-top-section">
            <div className="service-meta">
              <div className="service-icon-wrapper icon-water">
                <Droplets size={20} />
              </div>
              <div className="service-labels">
                <span className="service-type-label">Water Supply</span>
                <span className="service-main-name">{nextWater.item.zone}</span>
              </div>
            </div>
            <div className="status-badge-premium">
              <div className="status-dot-pulse dot-water"></div>
              Scheduled
            </div>
          </div>

          <div className="card-middle-section">
            <div className="route-info-enhanced">
              <div className="route-path-enhanced">
                <Sun size={14} />
                <span style={{textTransform: 'capitalize'}}>{nextWater.item.session} Session</span>
              </div>
              <div className="departure-info-enhanced">
                <Clock size={12} />
                <span>{format12h(nextWater.item.startTime)} — {format12h(nextWater.item.endTime)}</span>
              </div>
            </div>
            <ProgressRing mins={nextWater.mins} colorClass="text-cyan-500" />
          </div>

          <div className="card-bottom-section">
            <div className="service-extra-info">
              <span className="extra-tag">{nextWater.item.durationMins} Mins Supply</span>
            </div>
            <div className="next-following">
              Pressure <span>Normal</span>
            </div>
          </div>
        </div>
      )}

      {(!nextBus && !nextTrain && !nextWater) && (
        <div className="empty-updates-premium">
          <div className="empty-icon-ring">
            <Info size={24} />
          </div>
          <h3 className="empty-title">All Quiet for Now</h3>
          <p className="empty-desc">No live updates currently available. Check back soon for transit & utility alerts.</p>
          <button className="glass-back-btn" onClick={calculateNext} style={{marginTop: '12px', width: 'auto', padding: '0 20px', gap: '8px'}}>
            <RefreshCcw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      )}
    </section>
  );
}
