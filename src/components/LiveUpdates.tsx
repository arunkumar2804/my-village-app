"use client";

import React, { useEffect, useState } from "react";
import { Bus, MapPin, Clock, Shield, Building2, Train, Droplets, Sun } from "lucide-react";
import { getBusTimings, getTrainTimings, getWaterUpdates } from "@/lib/store";
import type { BusTiming, TrainTiming, WaterUpdate } from "@/lib/types";
import "./live-updates.css";

interface BusInfo {
  item: BusTiming;
  relTime: string;
  minutesLeft: number;
}

interface TrainInfo {
  item: TrainTiming;
  relTime: string;
  minutesLeft: number;
}

interface WaterInfo {
  item: WaterUpdate;
  relTime: string;
  minutesLeft: number;
}

function getNextOccurrence(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return target;
}

function getTimeData(targetDate: Date): { text: string; minutes: number } {
  const diffMs = targetDate.getTime() - Date.now();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  
  if (diffMins === 0) return { text: "Arriving", minutes: 0 };
  if (diffMins === 1) return { text: "Arriving", minutes: 1 };
  if (diffMins < 60) return { text: `${diffMins} mins`, minutes: diffMins };
  const hrs = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return { text: mins > 0 ? `${hrs} hrs ${mins} mins` : `${hrs} hrs`, minutes: diffMins };
}

function format12h(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const mStr = m.toString().padStart(2, "0");
  return `${h12}:${mStr} ${ampm}`;
}

function getCrowdStatus(timeStr: string): { status: "crowded" | "less"; label: string } {
  const [h, m] = timeStr.split(":").map(Number);
  const totalMins = h * 60 + m;
  const morningPeakStart = 7 * 60;
  const morningPeakEnd = 9 * 60;
  const eveningPeakStart = 16 * 60;
  const eveningPeakEnd = 18 * 60 + 30;

  if (
    (totalMins >= morningPeakStart && totalMins <= morningPeakEnd) ||
    (totalMins >= eveningPeakStart && totalMins <= eveningPeakEnd)
  ) {
    return { status: "crowded", label: "Mostly crowded" };
  }
  return { status: "less", label: "Less crowded" };
}

export default function LiveUpdates() {
  const [nextBus, setNextBus] = useState<BusInfo | null>(null);
  const [nextTrain, setNextTrain] = useState<TrainInfo | null>(null);
  const [nextWater, setNextWater] = useState<WaterInfo | null>(null);
  const [, setTick] = useState(0);

  const calculateNext = async () => {
    const activeBuses = (await getBusTimings()).filter((b) => b.isActive);
    if (activeBuses.length > 0) {
      let closest = activeBuses[0], minDiff = Infinity;
      activeBuses.forEach((b) => {
        const d = getNextOccurrence(b.departureTime);
        const diff = d.getTime() - Date.now();
        if (diff > 0 && diff < minDiff) { minDiff = diff; closest = b; }
      });
      const d = getNextOccurrence(closest.departureTime);
      const { text, minutes } = getTimeData(d);
      setNextBus({ item: closest, relTime: text, minutesLeft: minutes });
    } else {
      setNextBus(null);
    }

    const activeTrains = (await getTrainTimings()).filter((t) => t.isActive);
    if (activeTrains.length > 0) {
      let closest = activeTrains[0], minDiff = Infinity;
      activeTrains.forEach((t) => {
        const d = getNextOccurrence(t.departureTime);
        const diff = d.getTime() - Date.now();
        if (diff > 0 && diff < minDiff) { minDiff = diff; closest = t; }
      });
      const d = getNextOccurrence(closest.departureTime);
      const { text, minutes } = getTimeData(d);
      setNextTrain({ item: closest, relTime: text, minutesLeft: minutes });
    } else {
      setNextTrain(null);
    }

    const activeWater = (await getWaterUpdates()).filter((w) => w.isActive);
    if (activeWater.length > 0) {
      let closest = activeWater[0], minDiff = Infinity;
      activeWater.forEach((w) => {
        const d = getNextOccurrence(w.startTime);
        const diff = d.getTime() - Date.now();
        if (diff > 0 && diff < minDiff) { minDiff = diff; closest = w; }
      });
      const d = getNextOccurrence(closest.startTime);
      const { text, minutes } = getTimeData(d);
      setNextWater({ item: closest, relTime: text, minutesLeft: minutes });
    } else {
      setNextWater(null);
    }
  };

  useEffect(() => {
    calculateNext();
    const interval = setInterval(() => {
      calculateNext();
      setTick(t => t + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!nextBus && !nextTrain && !nextWater) {
    return (
      <section className="lu-section">
        <div className="lu-header">
          <div className="lu-title-wrap">
            <span className="lu-live-pill">
              <span className="lu-live-dot"></span>
              Live
            </span>
            <h2 className="lu-title">Updates</h2>
          </div>
        </div>
        <div className="lu-empty">
          <div className="lu-empty-icon"><Bus size={28} /></div>
          <p>No upcoming schedules</p>
          <span>Check back soon</span>
        </div>
      </section>
    );
  }

  return (
    <section className="lu-section">
      <div className="lu-header">
        <div className="lu-title-wrap">
          <span className="lu-live-pill">
            <span className="lu-live-dot"></span>
            Live
          </span>
          <h2 className="lu-title">Updates</h2>
        </div>
      </div>

      <div className="lu-cards">
        {nextBus && (
          <div className={`lu-bus-card ${nextBus.minutesLeft <= 5 ? 'urgent' : ''}`}>
            <div className="lu-bus-card-bg"></div>
            <div className="lu-bus-top">
              <div className="lu-bus-badge-row">
                <span className={`lu-bus-tag ${nextBus.item.operatorType === 'government' ? 'govt' : 'private'}`}>
                  {nextBus.item.operatorType === 'government' ? 'Government' : 'Private'}
                </span>
                {nextBus.minutesLeft <= 5 && <span className="lu-urgent-tag">Arriving soon</span>}
                <div className={`lu-bus-tag ${getCrowdStatus(nextBus.item.departureTime).status}`} 
                     style={{ 
                       background: getCrowdStatus(nextBus.item.departureTime).status === 'crowded' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                       color: getCrowdStatus(nextBus.item.departureTime).status === 'crowded' ? '#ef4444' : '#10b981',
                       marginLeft: 'auto'
                     }}>
                  <span style={{ fontSize: '9px', opacity: 0.8, marginRight: '4px' }}>CROWD:</span>
                  {getCrowdStatus(nextBus.item.departureTime).label}
                </div>
              </div>
              <div className="lu-bus-route">#{nextBus.item.routeNumber}</div>
            </div>

            <div className="lu-bus-route-display">
              <div className="lu-route-stop">
                <div className="lu-stop-dot"></div>
                <span>{nextBus.item.from}</span>
              </div>
              <div className="lu-route-journey">
                <div className="lu-journey-track">
                  <div className="lu-journey-progress" style={{ width: '65%' }}>
                    <div className="lu-bus-icon-anim">
                      <Bus size={16} />
                    </div>
                  </div>
                </div>
                <div className="lu-journey-stops">
                  <span>•</span><span>•</span><span>•</span>
                </div>
              </div>
              <div className="lu-route-stop">
                <div className="lu-stop-dot end-dot"></div>
                <span>{nextBus.item.to}</span>
              </div>
            </div>

            <div className="lu-bus-timing">
              <div className="lu-bus-remain-chip">
                <Clock size={16} />
                <span>{nextBus.relTime}</span>
              </div>
              <div className="lu-bus-depart-info">
                <span className="lu-depart-label">Departure</span>
                <span className="lu-depart-time">{format12h(nextBus.item.departureTime)}</span>
              </div>
            </div>
          </div>
        )}

        {nextTrain && (
          <div className="lu-train-card">
            <div className="lu-train-card-bg"></div>
            <div className="lu-train-header">
              <div className="lu-train-icon-wrap">
                <Train size={22} />
              </div>
              <div className="lu-train-info">
                <div className="lu-train-badges">
                  <span className="lu-train-num-badge">{nextTrain.item.trainNumber}</span>
                  <span className="lu-train-name-text">{nextTrain.item.trainName}</span>
                </div>
              </div>
            </div>
            
            <div className="lu-train-route-line">
              <div className="lu-station-chip start-chip">
                <MapPin size={12} />
                <span>{nextTrain.item.from}</span>
              </div>
              <div className="lu-dotted-track">
                <div className="lu-track-dots"></div>
                <div className="lu-nearby-stop-chip">
                  <span>{nextTrain.item.nearbyStation}</span>
                </div>
                <div className="lu-track-dots"></div>
              </div>
              <div className="lu-station-chip end-chip">
                <MapPin size={12} />
                <span>{nextTrain.item.to}</span>
              </div>
            </div>

            <div className="lu-train-timing">
              <div className="lu-train-remain-chip">
                <Clock size={14} />
                <span>{nextTrain.relTime}</span>
              </div>
              <div className="lu-train-depart-info">
                <span className="lu-depart-label">Departure</span>
                <span className="lu-depart-time">{format12h(nextTrain.item.departureTime)}</span>
              </div>
            </div>
          </div>
        )}

        {nextWater && (
          <div className="lu-water-card">
            <div className="lu-water-card-bg"></div>
            <div className="lu-water-header">
              <div className="lu-water-icon-wrap">
                <Droplets size={22} />
              </div>
              <div className="lu-water-info">
                <span className="lu-water-zone">{nextWater.item.zone} Zone</span>
                <div className="lu-water-session">
                  <Sun size={11} />
                  <span className="capitalize">{nextWater.item.session} session</span>
                </div>
              </div>
            </div>
            <div className="lu-water-timing">
              <div className="lu-water-remain-chip">
                <Clock size={14} />
                <span>{nextWater.relTime}</span>
              </div>
              <div className="lu-water-start-info">
                <span className="lu-depart-label">Starts at</span>
                <span className="lu-depart-time">{format12h(nextWater.item.startTime)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}