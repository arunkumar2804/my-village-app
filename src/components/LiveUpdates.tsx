"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, Clock, Sun } from "lucide-react";
import "./live-updates.css";
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
        <div className="update-card card-bus">
          <div className="card-accent-strip accent-bus"></div>
          <div className="card-inner">
            <div className="card-header">
              <div className="card-type">
                <div className="card-type-icon icon-bg-bus">
                  <div style={{ position: 'relative', width: 14, height: 14 }}>
                    <Image src="/icons/bus-icon.svg" alt="Bus" fill style={{ objectFit: 'contain' }} />
                  </div>
                </div>
                <span>Next Bus</span>
              </div>
              <div className="time-badge badge-bus">
                <span className="pulse-dot dot-bus"></span>
                {nextBus.timeRemaining}
              </div>
            </div>

            <div className="bus-route-row">
              <div className="route-number-box">{nextBus.item.routeNumber}</div>
              <div className="bus-route-detail">
                <div className="route-names">
                  <span>{nextBus.item.from}</span>
                  <ArrowRight size={14} className="route-arrow arrow-bus" />
                  <span>{nextBus.item.to}</span>
                </div>
                <div className="bus-departure">
                  <Clock size={11} />
                  <span>Departs at {format12h(nextBus.item.departureTime)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Next Train Card ─── */}
      {nextTrain && (
        <div className="update-card card-train">
          <div className="card-accent-strip accent-train"></div>
          <div className="card-inner">
            <div className="card-header">
              <div className="card-type">
                <div className="card-type-icon icon-bg-train">
                  <div style={{ position: 'relative', width: 14, height: 14 }}>
                    <Image src="/icons/train-icon.svg" alt="Train" fill style={{ objectFit: 'contain' }} />
                  </div>
                </div>
                <span>Next Train</span>
              </div>
              <div className="time-badge badge-train">
                <span className="pulse-dot dot-train"></span>
                {nextTrain.timeRemaining}
              </div>
            </div>

            <div className="train-info-row">
              <div className="train-name">{nextTrain.item.trainName}</div>
              <div className="train-meta-row">
                <div className="train-number-badge">{nextTrain.item.trainNumber}</div>
                <div className="train-depart-text">
                  <Clock size={11} />
                  <span>Departs {format12h(nextTrain.item.departureTime)}</span>
                </div>
              </div>
            </div>

            <div className="train-route-visual">
              <div className="train-station station-origin">
                <div className="station-dot dot-origin"></div>
                <span>{nextTrain.item.from}</span>
              </div>
              <div className="train-track">
                <div className="track-line"></div>
                <div className="nearby-station-chip">
                  <span className="nearby-label">Nearby</span>
                  <strong>{nextTrain.item.nearbyStation}</strong>
                </div>
              </div>
              <div className="train-station station-dest">
                <div className="station-dot dot-dest"></div>
                <span>{nextTrain.item.to}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Water Timings Card ─── */}
      {nextWater && (
        <div className="update-card card-water">
          <div className="card-accent-strip accent-water"></div>
          <div className="card-inner">
            <div className="card-header">
              <div className="card-type">
                <div className="card-type-icon icon-bg-water">
                  <div style={{ position: 'relative', width: 14, height: 14 }}>
                    <Image src="/icons/water-tap-icon.svg" alt="Water" fill style={{ objectFit: 'contain' }} />
                  </div>
                </div>
                <span>Water timings</span>
              </div>
              <div className="time-badge badge-water">
                <span className="pulse-dot dot-water"></span>
                {nextWater.timeRemaining}
              </div>
            </div>

            <div className="water-detail-row">
              <div className="water-info-block">
                <div className="water-session" style={{textTransform: "capitalize"}}>
                  <Sun size={12} />
                  <span>{nextWater.item.session}</span>
                </div>
                <div className="water-zone">{nextWater.item.zone}</div>
                <div className="water-time-range">
                  <Clock size={11} />
                  <span>{format12h(nextWater.item.startTime)} — {format12h(nextWater.item.endTime)}</span>
                </div>
              </div>
              <div className="water-duration-chip">
                <div className="duration-value">{nextWater.item.durationMins}</div>
                <div className="duration-unit">mins</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
