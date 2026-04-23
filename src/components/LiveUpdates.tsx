"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Clock, Sun, Bus, Train, Droplets, Info, RefreshCcw } from "lucide-react";
import { getBusTimings, getTrainTimings, getWaterUpdates } from "@/lib/store";
import type { BusTiming, TrainTiming, WaterUpdate } from "@/lib/types";
import "./live-updates.css";

function getNextOccurence(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return target;
}

function getTimeData(targetDate: Date) {
  const diffMs = targetDate.getTime() - Date.now();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  
  if (diffMins === 0) return "Due";
  if (diffMins < 60) return `in ${diffMins}m`;
  const hrs = Math.floor(diffMins / 60);
  return `in ${hrs}h ${diffMins % 60}m`;
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
  const [nextBus, setNextBus] = useState<{ item: BusTiming; relTime: string; date: Date } | null>(null);
  const [nextTrain, setNextTrain] = useState<{ item: TrainTiming; relTime: string; date: Date } | null>(null);
  const [nextWater, setNextWater] = useState<{ item: WaterUpdate; relTime: string; date: Date } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const calculateNext = async () => {
    setIsRefreshing(true);
    
    // Bus
    const activeBuses = (await getBusTimings()).filter((b) => b.isActive);
    if (activeBuses.length > 0) {
      let closest = activeBuses[0], minDiff = Infinity, closestDate = new Date();
      activeBuses.forEach((b) => {
        const d = getNextOccurence(b.departureTime), diff = d.getTime() - Date.now();
        if (diff < minDiff) { minDiff = diff; closest = b; closestDate = d; }
      });
      setNextBus({ item: closest, relTime: getTimeData(closestDate), date: closestDate });
    }

    // Train
    const activeTrains = (await getTrainTimings()).filter((t) => t.isActive);
    if (activeTrains.length > 0) {
      let closest = activeTrains[0], minDiff = Infinity, closestDate = new Date();
      activeTrains.forEach((t) => {
        const d = getNextOccurence(t.departureTime), diff = d.getTime() - Date.now();
        if (diff < minDiff) { minDiff = diff; closest = t; closestDate = d; }
      });
      setNextTrain({ item: closest, relTime: getTimeData(closestDate), date: closestDate });
    }

    // Water
    const activeWater = (await getWaterUpdates()).filter((w) => w.isActive);
    if (activeWater.length > 0) {
      let closest = activeWater[0], minDiff = Infinity, closestDate = new Date();
      activeWater.forEach((w) => {
        const d = getNextOccurence(w.startTime), diff = d.getTime() - Date.now();
        if (diff < minDiff) { minDiff = diff; closest = w; closestDate = d; }
      });
      setNextWater({ item: closest, relTime: getTimeData(closestDate), date: closestDate });
    }
    setTimeout(() => setIsRefreshing(false), 600);
  };

  useEffect(() => {
    calculateNext();
    const intervalId = setInterval(calculateNext, 60000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <section className="live-updates-container">
      <div className="live-updates-header">
        <h2>Live Updates</h2>
        <div className="live-filter-tabs">
          {["all", "transport", "water"].map((tab) => (
            <button 
              key={tab}
              className={`filter-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {(activeTab === "all" || activeTab === "transport") && nextBus && (
        <div className="high-impact-card card-bus">
          <div className="mesh-bg"></div>
          <div className="card-top-section">
            <div className="service-badge-large">
              <div className="icon-wrapper-large">
                <Bus size={28} />
              </div>
              <div className="service-title-info">
                <span className="operator-label">{nextBus.item.operator || "Public Transit"}</span>
                <span className="service-name-bold">{nextBus.item.routeNumber} Service</span>
              </div>
            </div>
            <div className="status-pill-premium">
              <div className="pulse-dot-large"></div>
              Live
            </div>
          </div>

          <div className="route-visualization">
            <div className="route-point">
              <span className="point-label">From</span>
              <span className="point-name">{nextBus.item.from}</span>
            </div>
            <div className="route-line-visual"></div>
            <div className="route-point" style={{textAlign: 'right'}}>
              <span className="point-label">Destination</span>
              <span className="point-name">{nextBus.item.to}</span>
            </div>
          </div>

          <div className="card-details-grid">
            <div className="detail-item">
              <span className="detail-label">Type</span>
              <span className="detail-val">AC Express</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Frequency</span>
              <span className="detail-val">Every 30m</span>
            </div>
          </div>

          <div className="card-footer-section">
            <div className="big-time-display">
              <span className="big-time-val">{format12h(nextBus.item.departureTime)}</span>
              <span className="big-time-label">Scheduled Departure</span>
            </div>
            <div className="rel-time-tag">
              {nextBus.relTime}
            </div>
          </div>
        </div>
      )}

      {(activeTab === "all" || activeTab === "transport") && nextTrain && (
        <div className="high-impact-card card-train">
          <div className="mesh-bg"></div>
          <div className="card-top-section">
            <div className="service-badge-large">
              <div className="icon-wrapper-large">
                <Train size={28} />
              </div>
              <div className="service-title-info">
                <span className="operator-label">Indian Railways</span>
                <span className="service-name-bold">{nextTrain.item.trainName}</span>
              </div>
            </div>
            <div className="status-pill-premium">
              <div className="pulse-dot-large"></div>
              On Time
            </div>
          </div>

          <div className="route-visualization">
            <div className="route-point">
              <span className="point-label">Origin</span>
              <span className="point-name">{nextTrain.item.from}</span>
            </div>
            <div className="route-line-visual"></div>
            <div className="route-point" style={{textAlign: 'right'}}>
              <span className="point-label">Terminus</span>
              <span className="point-name">{nextTrain.item.to}</span>
            </div>
          </div>

          <div className="card-details-grid">
            <div className="detail-item">
              <span className="detail-label">Train No</span>
              <span className="detail-val">#{nextTrain.item.trainNumber}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Nearby</span>
              <span className="detail-val">{nextTrain.item.nearbyStation}</span>
            </div>
          </div>

          <div className="card-footer-section">
            <div className="big-time-display">
              <span className="big-time-val">{format12h(nextTrain.item.departureTime)}</span>
              <span className="big-time-label">Station Departure</span>
            </div>
            <div className="rel-time-tag">
              {nextTrain.relTime}
            </div>
          </div>
        </div>
      )}

      {(activeTab === "all" || activeTab === "water") && nextWater && (
        <div className="high-impact-card card-water">
          <div className="mesh-bg"></div>
          <div className="card-top-section">
            <div className="service-badge-large">
              <div className="icon-wrapper-large">
                <Droplets size={28} />
              </div>
              <div className="service-title-info">
                <span className="operator-label">Municipal Supply</span>
                <span className="service-name-bold">{nextWater.item.zone} Zone</span>
              </div>
            </div>
            <div className="status-pill-premium">
              <div className="pulse-dot-large"></div>
              Active
            </div>
          </div>

          <div className="card-details-grid">
            <div className="detail-item">
              <span className="detail-label">Session</span>
              <span className="detail-val capitalize">{nextWater.item.session} Supply</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Duration</span>
              <span className="detail-val">{nextWater.item.durationMins} Minutes</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">End Time</span>
              <span className="detail-val">{format12h(nextWater.item.endTime)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className="detail-val">High Pressure</span>
            </div>
          </div>

          <div className="card-footer-section">
            <div className="big-time-display">
              <span className="big-time-val">{format12h(nextWater.item.startTime)}</span>
              <span className="big-time-label">Flow Starts At</span>
            </div>
            <div className="rel-time-tag">
              {nextWater.relTime}
            </div>
          </div>
        </div>
      )}

      {(!nextBus && !nextTrain && !nextWater) && (
        <div className="high-impact-empty">
          <p>No live updates currently available.</p>
        </div>
      )}
    </section>
  );
}
