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

  const calculateNext = async () => {
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
        <div className="segmented-tabs">
          {["all", "transport", "water"].map((tab) => (
            <button 
              key={tab}
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {(activeTab === "all" || activeTab === "transport") && nextBus && (
        <div className="live-widget-card card-bus" style={{"--accent-rgb": "16, 185, 129"} as any}>
          <div className="aura-glow aura-bus"></div>
          <div className="widget-icon-container">
            <Bus size={22} className="icon-inner" />
          </div>
          <div className="widget-info">
            <div className="widget-title-row">
              <span className="widget-name">{nextBus.item.routeNumber} Service</span>
              <span className="status-badge-mini">Live</span>
            </div>
            <div className="widget-route">
              <span>{nextBus.item.from}</span>
              <ArrowRight size={12} opacity={0.5} />
              <span>{nextBus.item.to}</span>
            </div>
          </div>
          <div className="widget-time-section">
            <span className="main-time">{format12h(nextBus.item.departureTime)}</span>
            <span className="time-label-pill">{nextBus.relTime}</span>
          </div>
        </div>
      )}

      {(activeTab === "all" || activeTab === "transport") && nextTrain && (
        <div className="live-widget-card card-train" style={{"--accent-rgb": "99, 102, 241"} as any}>
          <div className="aura-glow aura-train"></div>
          <div className="widget-icon-container">
            <Train size={22} className="icon-inner" />
          </div>
          <div className="widget-info">
            <div className="widget-title-row">
              <span className="widget-name">{nextTrain.item.trainName}</span>
              <span className="status-badge-mini">On Time</span>
            </div>
            <div className="widget-route">
              <Clock size={12} opacity={0.6} />
              <span>{nextTrain.item.nearbyStation}</span>
            </div>
          </div>
          <div className="widget-time-section">
            <span className="main-time">{format12h(nextTrain.item.departureTime)}</span>
            <span className="time-label-pill">{nextTrain.relTime}</span>
          </div>
        </div>
      )}

      {(activeTab === "all" || activeTab === "water") && nextWater && (
        <div className="live-widget-card card-water" style={{"--accent-rgb": "6, 182, 212"} as any}>
          <div className="aura-glow aura-water"></div>
          <div className="widget-icon-container">
            <Droplets size={22} className="icon-inner" />
          </div>
          <div className="widget-info">
            <div className="widget-title-row">
              <span className="widget-name">{nextWater.item.zone} Zone</span>
              <span className="status-badge-mini">Active</span>
            </div>
            <div className="widget-route">
              <Sun size={12} opacity={0.6} />
              <span className="capitalize">{nextWater.item.session} session</span>
            </div>
          </div>
          <div className="widget-time-section">
            <span className="main-time">{format12h(nextWater.item.startTime)}</span>
            <span className="time-label-pill">{nextWater.relTime}</span>
          </div>
        </div>
      )}

      {(!nextBus && !nextTrain && !nextWater) && (
        <div className="widget-empty">
          <p>No live updates at the moment.</p>
        </div>
      )}
    </section>
  );
}
