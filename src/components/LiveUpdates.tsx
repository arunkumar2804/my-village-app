"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Bus, Train, Droplets, MapPin, Clock, Sun, Navigation, Shield, Building2 } from "lucide-react";
import { getBusTimings, getTrainTimings, getWaterUpdates } from "@/lib/store";
import type { BusTiming, TrainTiming, WaterUpdate } from "@/lib/types";
import "./live-updates.css";

interface BusInfo {
  item: BusTiming;
  relTime: string;
  minutesLeft: number;
  date: Date;
  progress: number;
}

interface TrainInfo {
  item: TrainTiming;
  relTime: string;
  minutesLeft: number;
  date: Date;
}

interface WaterInfo {
  item: WaterUpdate;
  relTime: string;
  minutesLeft: number;
  date: Date;
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
  if (diffMins === 1) return { text: "1 min", minutes: 1 };
  if (diffMins < 60) return { text: `${diffMins} mins`, minutes: diffMins };
  const hrs = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return { text: `${hrs}h ${mins}m`, minutes: diffMins };
}

function format12h(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const mStr = m.toString().padStart(2, "0");
  return `${h12}:${mStr} ${ampm}`;
}

function getProgress(minutesLeft: number): number {
  if (minutesLeft <= 5) return 95;
  if (minutesLeft <= 10) return 85;
  if (minutesLeft <= 15) return 70;
  if (minutesLeft <= 30) return 50;
  if (minutesLeft <= 45) return 35;
  if (minutesLeft <= 60) return 20;
  return 10;
}

export default function LiveUpdates() {
  const [buses, setBuses] = useState<BusInfo[]>([]);
  const [trains, setTrains] = useState<TrainInfo[]>([]);
  const [water, setWater] = useState<WaterInfo[]>([]);
  const [, setTick] = useState(0);

  const calculateNext = async () => {
    const busList: BusInfo[] = [];
    const trainList: TrainInfo[] = [];
    const waterList: WaterInfo[] = [];
    
    const activeBuses = (await getBusTimings()).filter((b) => b.isActive);
    activeBuses.forEach((b) => {
      const d = getNextOccurrence(b.departureTime);
      const { text, minutes } = getTimeData(d);
      busList.push({ item: b, relTime: text, minutesLeft: minutes, date: d, progress: getProgress(minutes) });
    });
    busList.sort((a, b) => a.minutesLeft - b.minutesLeft);
    
    const activeTrains = (await getTrainTimings()).filter((t) => t.isActive);
    activeTrains.forEach((t) => {
      const d = getNextOccurrence(t.departureTime);
      const { text, minutes } = getTimeData(d);
      trainList.push({ item: t, relTime: text, minutesLeft: minutes, date: d });
    });
    trainList.sort((a, b) => a.minutesLeft - b.minutesLeft);
    
    const activeWater = (await getWaterUpdates()).filter((w) => w.isActive);
    activeWater.forEach((w) => {
      const d = getNextOccurrence(w.startTime);
      const { text, minutes } = getTimeData(d);
      waterList.push({ item: w, relTime: text, minutesLeft: minutes, date: d });
    });
    waterList.sort((a, b) => a.minutesLeft - b.minutesLeft);
    
    setBuses(busList);
    setTrains(trainList);
    setWater(waterList);
  };

  useEffect(() => {
    calculateNext();
    const interval = setInterval(() => {
      calculateNext();
      setTick(t => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (buses.length === 0 && trains.length === 0 && water.length === 0) {
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
        <span className="lu-count">{buses.length + trains.length + water.length} upcoming</span>
      </div>

      <div className="lu-cards">
        {buses.map((bus, i) => {
          const isGovt = bus.item.operatorType === "government";
          const isUrgent = bus.minutesLeft <= 5;
          const isSoon = bus.minutesLeft <= 15;
          
          return (
            <div key={bus.item.id || i} className={`lu-bus-card ${isUrgent ? "urgent" : ""} ${isSoon ? "soon" : ""}`}>
              <div className="lu-bus-card-bg"></div>
              
              <div className="lu-bus-top">
                <div className="lu-bus-badge-row">
                  <span className={`lu-bus-tag ${isGovt ? "govt" : "private"}`}>
                    {isGovt ? <Shield size={10} /> : <Building2 size={10} />}
                    {isGovt ? "Government" : "Private"}
                  </span>
                  {isUrgent && <span className="lu-urgent-tag">⚡ Arriving</span>}
                </div>
                <span className="lu-bus-route">{bus.item.routeNumber}</span>
              </div>

              <div className="lu-bus-route-display">
                <div className="lu-route-stop start">
                  <div className="lu-stop-dot"></div>
                  <span>{bus.item.from}</span>
                </div>
                
                <div className="lu-route-journey">
                  <div className="lu-journey-track">
                    <div className="lu-journey-progress" style={{ width: `${bus.progress}%` }}>
                      <div className="lu-bus-icon-anim">
                        <Bus size={16} />
                      </div>
                    </div>
                  </div>
                  <div className="lu-journey-stops">
                    <MapPin size={10} />
                    <MapPin size={10} />
                    <MapPin size={10} />
                    <MapPin size={10} />
                  </div>
                </div>
                
                <div className="lu-route-stop end">
                  <div className="lu-stop-dot end-dot"></div>
                  <span>{bus.item.to}</span>
                </div>
              </div>

              <div className="lu-bus-timing">
                <div className="lu-timing-main">
                  <Clock size={20} className="lu-timing-icon" />
                  <div className="lu-timing-text">
                    <span className="lu-timing-remain">{bus.relTime}</span>
                    <span className="lu-timing-label">Remaining</span>
                  </div>
                </div>
                <div className="lu-timing-divider"></div>
                <div className="lu-timing-depart">
                  <span className="lu-depart-label">Departs at</span>
                  <span className="lu-depart-time">{format12h(bus.item.departureTime)}</span>
                </div>
              </div>
            </div>
          );
        })}

        {trains.map((train, i) => (
          <div key={train.item.id || i} className="lu-train-card">
            <div className="lu-train-card-bg"></div>
            <div className="lu-train-header">
              <div className="lu-train-icon-wrap">
                <Train size={22} />
              </div>
              <div className="lu-train-info">
                <span className="lu-train-name">{train.item.trainName}</span>
                <div className="lu-train-route">
                  <MapPin size={11} />
                  <span>{train.item.nearbyStation}</span>
                </div>
              </div>
            </div>
            <div className="lu-train-timing">
              <div className="lu-tm-remain">
                <span className="lu-tm-value">{train.relTime}</span>
                <span className="lu-tm-label">remaining</span>
              </div>
              <div className="lu-tm-depart">
                <span className="lu-td-value">{format12h(train.item.departureTime)}</span>
                <span className="lu-td-label">departure</span>
              </div>
            </div>
          </div>
        ))}

        {water.map((w, i) => (
          <div key={w.item.id || i} className="lu-water-card">
            <div className="lu-water-card-bg"></div>
            <div className="lu-water-header">
              <div className="lu-water-icon-wrap">
                <Droplets size={22} />
              </div>
              <div className="lu-water-info">
                <span className="lu-water-zone">{w.item.zone} Zone</span>
                <div className="lu-water-session">
                  <Sun size={11} />
                  <span className="capitalize">{w.item.session} session</span>
                </div>
              </div>
            </div>
            <div className="lu-water-timing">
              <div className="lu-wt-remain">
                <span className="lu-wt-value">{w.relTime}</span>
                <span className="lu-wt-label">remaining</span>
              </div>
              <div className="lu-wt-starts">
                <span className="lu-ws-value">{format12h(w.item.startTime)}</span>
                <span className="lu-ws-label">starts</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}