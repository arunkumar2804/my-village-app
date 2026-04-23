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
        <div className="premium-update-card card-bus">
          <div className="premium-icon-box">
            <Bus size={24} />
          </div>
          <div className="card-main-info">
            <div className="service-header-row">
              <span className="service-name-premium">{nextBus.item.routeNumber} Service</span>
              <div className="live-indicator-pill">
                <div className="live-pulse-dot"></div>
                Live
              </div>
            </div>
            <div className="route-text-premium">
              <span>{nextBus.item.from}</span>
              <ArrowRight size={14} className="opacity-40" />
              <span>{nextBus.item.to}</span>
            </div>
          </div>
          <div className="premium-time-box">
            <span className="time-val">{format12h(nextBus.item.departureTime).split(' ')[0]}</span>
            <span className="time-rel">{nextBus.relTime}</span>
          </div>
        </div>
      )}

      {(activeTab === "all" || activeTab === "transport") && nextTrain && (
        <div className="premium-update-card card-train">
          <div className="premium-icon-box">
            <Train size={24} />
          </div>
          <div className="card-main-info">
            <div className="service-header-row">
              <span className="service-name-premium">{nextTrain.item.trainName}</span>
              <div className="live-indicator-pill">
                <div className="live-pulse-dot"></div>
                On Time
              </div>
            </div>
            <div className="route-text-premium">
              <Clock size={12} className="opacity-50" />
              <span>Station: {nextTrain.item.nearbyStation}</span>
            </div>
          </div>
          <div className="premium-time-box">
            <span className="time-val">{format12h(nextTrain.item.departureTime).split(' ')[0]}</span>
            <span className="time-rel">{nextTrain.relTime}</span>
          </div>
        </div>
      )}

      {(activeTab === "all" || activeTab === "water") && nextWater && (
        <div className="premium-update-card card-water">
          <div className="premium-icon-box">
            <Droplets size={24} />
          </div>
          <div className="card-main-info">
            <div className="service-header-row">
              <span className="service-name-premium">{nextWater.item.zone} Supply</span>
              <div className="live-indicator-pill">
                <div className="live-pulse-dot"></div>
                Active
              </div>
            </div>
            <div className="route-text-premium">
              <Sun size={12} className="opacity-50" />
              <span className="capitalize">{nextWater.item.session} Session</span>
            </div>
          </div>
          <div className="premium-time-box">
            <span className="time-val">{format12h(nextWater.item.startTime).split(' ')[0]}</span>
            <span className="time-rel">{nextWater.relTime}</span>
          </div>
        </div>
      )}

      {(!nextBus && !nextTrain && !nextWater) && (
        <div className="premium-empty-state">
          <p>No live updates currently available.</p>
        </div>
      )}
    </section>
  );
}
