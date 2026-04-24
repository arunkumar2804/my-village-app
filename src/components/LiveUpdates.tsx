"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, Clock, Sun, Bus, Users, TrainFront, Droplets } from "lucide-react";
import { getBusTimings, getTrainTimings, getWaterUpdates } from "@/lib/store";
import type { BusTiming, TrainTiming, WaterUpdate } from "@/lib/types";

// Helper to convert "HH:mm" to a target Date object, either today or tomorrow
function getNextOccurence(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  
  // If time has already passed today, it means next occurrence is tomorrow
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

// Converts diff in ms to a friendly string
function formatTimeRemaining(targetDate: Date): string {
  const diffMs = targetDate.getTime() - Date.now();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  
  if (diffMins === 0) return "Due";
  if (diffMins < 60) return `${diffMins} mins`;
  
  const hrs = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hrs} hr ${mins > 0 ? mins + " mins" : ""}`;
}

// Format 24h string to 12h AM/PM
function format12h(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const mStr = m.toString().padStart(2, "0");
  return `${h12}:${mStr} ${ampm}`;
}

export default function LiveUpdates() {
  const [nextBus, setNextBus] = useState<{ item: BusTiming; timeRemaining: string; date?: Date } | null>(null);
  const [nextTrain, setNextTrain] = useState<{ item: TrainTiming; timeRemaining: string; date?: Date } | null>(null);
  const [nextWater, setNextWater] = useState<{ item: WaterUpdate; timeRemaining: string; date?: Date } | null>(null);

  const calculateNext = async () => {
    // Bus
    const activeBuses = (await getBusTimings()).filter((b) => b.isActive);
    if (activeBuses.length > 0) {
      let closestBus = activeBuses[0];
      let minDiff = Infinity;
      let closestDate = new Date();
      activeBuses.forEach((b) => {
        const d = getNextOccurence(b.departureTime);
        const diff = d.getTime() - Date.now();
        if (diff < minDiff) {
          minDiff = diff;
          closestBus = b;
          closestDate = d;
        }
      });
      setNextBus({ item: closestBus, timeRemaining: formatTimeRemaining(closestDate), date: closestDate });
    } else {
      setNextBus(null);
    }

    // Train
    const activeTrains = (await getTrainTimings()).filter((t) => t.isActive);
    if (activeTrains.length > 0) {
      let closestTrain = activeTrains[0];
      let minDiff = Infinity;
      let closestDate = new Date();
      activeTrains.forEach((t) => {
        const d = getNextOccurence(t.departureTime);
        const diff = d.getTime() - Date.now();
        if (diff < minDiff) {
          minDiff = diff;
          closestTrain = t;
          closestDate = d;
        }
      });
      setNextTrain({ item: closestTrain, timeRemaining: formatTimeRemaining(closestDate), date: closestDate });
    } else {
      setNextTrain(null);
    }

    // Water
    const activeWater = (await getWaterUpdates()).filter((w) => w.isActive);
    if (activeWater.length > 0) {
      let closestWater = activeWater[0];
      let minDiff = Infinity;
      let closestDate = new Date();
      activeWater.forEach((w) => {
        const d = getNextOccurence(w.startTime);
        const diff = d.getTime() - Date.now();
        if (diff < minDiff) {
          minDiff = diff;
          closestWater = w;
          closestDate = d;
        }
      });
      setNextWater({ item: closestWater, timeRemaining: formatTimeRemaining(closestDate), date: closestDate });
    } else {
      setNextWater(null);
    }
  };

  useEffect(() => {
    // Initial calculate on mount (client-side)
    calculateNext();
    
    // Update every minute
    const intervalId = setInterval(calculateNext, 60000);
    return () => clearInterval(intervalId);
  }, []);

  if (!nextBus && !nextTrain && !nextWater) {
    return (
      <section>
        <h2 className="section-title">Live updates</h2>
        <div style={{ color: "var(--text-muted)", fontSize: 14 }}>No live updates currently available.</div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="section-title">Live updates</h2>

      {/* ─── Next Bus Card ─── */}
      {nextBus && (
        <div className="update-card-premium card-bus-premium">
          {/* Top Row: Label + Time Badge */}
          <div className="card-top-row">
            <div className="next-label-group">
              <Bus size={16} className="blue-bus-icon" />
              <span className="next-bus-text">Next Bus</span>
            </div>
            <div className="time-remaining-badge">
              {nextBus.timeRemaining}
            </div>
          </div>

          {/* Middle Row: Tile + Route Info */}
          <div className="card-middle-row">
            <div className="route-tile">
              {nextBus.item.routeNumber}
            </div>
            <div className="route-info-stack">
              <div className="route-path-line">
                <span className="path-stop">{nextBus.item.from}</span>
                <div className="dotted-connector">
                  <div className="dot-line" />
                  <Bus size={14} className="midpoint-bus-icon" />
                  <div className="dot-line" />
                </div>
                <span className="path-stop">{nextBus.item.to}</span>
              </div>
              <div className="departure-time-sub">
                Departs at {format12h(nextBus.item.departureTime)}
              </div>
            </div>
          </div>

          {/* Bottom Row: Chips + Crowd Badge */}
          <div className="card-bottom-row">
            <div className="tag-chips-group">
              <span className="tag-chip">{nextBus.item.operator || "TNSTC"}</span>
              <span className="tag-chip">Free Bus</span>
            </div>
            <div className="crowd-status-badge">
              <Users size={14} />
              <span>Mostly Crowded</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Next Train Card ─── */}
      {nextTrain && (
        <div className="update-card-premium card-train-premium">
          {/* Top Row: Label + Time Badge */}
          <div className="card-top-row">
            <div className="next-label-group">
              <TrainFront size={16} className="indigo-train-icon" />
              <span className="next-bus-text">Next Train</span>
            </div>
            <div className="time-remaining-badge">
              {nextTrain.timeRemaining}
            </div>
          </div>

          {/* Middle Row: Tile + Route Info */}
          <div className="card-middle-row">
            <div className="route-tile train-tile">
              {nextTrain.item.trainNumber.slice(-3)}
            </div>
            <div className="route-info-stack">
              <div className="route-path-line">
                <span className="path-stop">{nextTrain.item.from}</span>
                <div className="dotted-connector">
                  <div className="dot-line" />
                  <TrainFront size={14} className="midpoint-bus-icon" />
                  <div className="dot-line" />
                </div>
                <span className="path-stop">{nextTrain.item.to}</span>
              </div>
              <div className="departure-time-sub">
                Departs at {format12h(nextTrain.item.departureTime)}
              </div>
            </div>
          </div>

          {/* Bottom Row: Chips + Crowd Badge */}
          <div className="card-bottom-row">
            <div className="tag-chips-group">
              <span className="tag-chip">Unreserved</span>
              <span className="tag-chip">Daily</span>
            </div>
            <div className="status-badge-train">
              <div className="live-dot-green" />
              <span>On Time</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Water Timings Card ─── */}
      {nextWater && (
        <div className="update-card-premium card-water-premium">
          {/* Top Row: Label + Time Badge */}
          <div className="card-top-row">
            <div className="next-label-group">
              <Droplets size={16} className="cyan-water-icon" />
              <span className="next-bus-text">Water timings</span>
            </div>
            <div className="time-remaining-badge water-time-badge">
              {nextWater.timeRemaining}
            </div>
          </div>

          {/* Middle Row: Tile + Route Info */}
          <div className="card-middle-row">
            <div className="route-tile water-tile">
              {nextWater.item.zone.slice(0, 2)}
            </div>
            <div className="route-info-stack">
              <div className="route-path-line">
                <span className="path-stop">Supply</span>
                <div className="dotted-connector">
                  <div className="dot-line" />
                  <Droplets size={14} className="midpoint-bus-icon" />
                  <div className="dot-line" />
                </div>
                <span className="path-stop">{nextWater.item.zone}</span>
              </div>
              <div className="departure-time-sub">
                {format12h(nextWater.item.startTime)} — {format12h(nextWater.item.endTime)} ({nextWater.item.durationMins} mins)
              </div>
            </div>
          </div>

          {/* Bottom Row: Chips + Status */}
          <div className="card-bottom-row">
            <div className="tag-chips-group">
              <span className="tag-chip" style={{textTransform: 'capitalize'}}>{nextWater.item.session}</span>
              <span className="tag-chip">Filtered</span>
            </div>
            <div className="status-badge-water">
              <div className="live-dot-cyan" />
              <span>Active</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
