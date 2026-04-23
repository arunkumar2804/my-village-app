"use client";

import React, { useEffect, useState, useRef } from "react";
import { ArrowRight, Clock, Sun, Bus, Train, Droplets, Zap, TrendingUp } from "lucide-react";
import { getBusTimings, getTrainTimings, getWaterUpdates } from "@/lib/store";
import type { BusTiming, TrainTiming, WaterUpdate } from "@/lib/types";
import "./live-updates.css";

interface TimeItem {
  type: "bus" | "train" | "water";
  item: BusTiming | TrainTiming | WaterUpdate;
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
  
  if (diffMins === 0) return { text: "Due now", minutes: 0 };
  if (diffMins < 60) return { text: `in ${diffMins}m`, minutes: diffMins };
  const hrs = Math.floor(diffMins / 60);
  return { text: `in ${hrs}h ${diffMins % 60}m`, minutes: diffMins };
}

function format12h(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const mStr = m.toString().padStart(2, "0");
  return `${h12}:${mStr} ${ampm}`;
}

function getProgressWidth(minutesLeft: number, maxMinutes: number = 120): number {
  return Math.min(100, Math.max(5, (1 - minutesLeft / maxMinutes) * 100));
}

function getIcon(type: "bus" | "train" | "water", size: number = 24) {
  const iconClass = "live-card-icon";
  switch (type) {
    case "bus": return <Bus size={size} className={iconClass} />;
    case "train": return <Train size={size} className={iconClass} />;
    case "water": return <Droplets size={size} className={iconClass} />;
  }
}

export default function LiveUpdates() {
  const [items, setItems] = useState<TimeItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const calculateNext = async () => {
    const allItems: TimeItem[] = [];
    
    const buses = (await getBusTimings()).filter((b) => b.isActive);
    buses.forEach((b) => {
      const d = getNextOccurrence(b.departureTime);
      const { text, minutes } = getTimeData(d);
      allItems.push({ type: "bus", item: b, relTime: text, minutesLeft: minutes, date: d });
    });
    
    const trains = (await getTrainTimings()).filter((t) => t.isActive);
    trains.forEach((t) => {
      const d = getNextOccurrence(t.departureTime);
      const { text, minutes } = getTimeData(d);
      allItems.push({ type: "train", item: t, relTime: text, minutesLeft: minutes, date: d });
    });
    
    const water = (await getWaterUpdates()).filter((w) => w.isActive);
    water.forEach((w) => {
      const d = getNextOccurrence(w.startTime);
      const { text, minutes } = getTimeData(d);
      allItems.push({ type: "water", item: w, relTime: text, minutesLeft: minutes, date: d });
    });
    
    allItems.sort((a, b) => a.minutesLeft - b.minutesLeft);
    setItems(allItems.slice(0, 6));
  };

  useEffect(() => {
    calculateNext();
    const intervalId = setInterval(calculateNext, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const getCardLabel = (item: TimeItem): string => {
    if (item.type === "bus") return (item.item as BusTiming).routeNumber + " Service";
    if (item.type === "train") return (item.item as TrainTiming).trainName;
    return (item.item as WaterUpdate).zone + " Zone";
  };

  const getCardSubtitle = (item: TimeItem): string => {
    if (item.type === "bus") return `${(item.item as BusTiming).from} → ${(item.item as BusTiming).to}`;
    if (item.type === "train") return (item.item as TrainTiming).nearbyStation;
    return (item.item as WaterUpdate).session + " session";
  };

  const getTime = (item: TimeItem): string => {
    if (item.type === "bus") return (item.item as BusTiming).departureTime;
    if (item.type === "train") return (item.item as TrainTiming).departureTime;
    return (item.item as WaterUpdate).startTime;
  };

  const isUrgent = (minutes: number) => minutes <= 10;
  const isSoon = (minutes: number) => minutes <= 30;

  if (items.length === 0) {
    return (
      <section className="live-updates-container">
        <div className="live-updates-header">
          <div className="live-title-group">
            <div className="live-indicator">
              <span className="live-dot"></span>
              <span className="live-text">Live</span>
            </div>
            <h2>Updates</h2>
          </div>
        </div>
        <div className="live-empty-state">
          <div className="empty-icon-wrap">
            <Zap size={32} />
          </div>
          <p>No upcoming schedules</p>
          <span>Check back soon for updates</span>
        </div>
      </section>
    );
  }

  return (
    <section className="live-updates-container">
      <div className="live-updates-header">
        <div className="live-title-group">
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span className="live-text">Live</span>
          </div>
          <h2>Updates</h2>
        </div>
        <div className="live-count-badge">
          <TrendingUp size={14} />
          <span>{items.length} upcoming</span>
        </div>
      </div>

      <div className="live-scroll-container" ref={scrollRef}>
        <div className="live-cards-track">
          {items.map((item, index) => {
            const progress = getProgressWidth(item.minutesLeft);
            const urgent = isUrgent(item.minutesLeft);
            const soon = isSoon(item.minutesLeft);
            
            return (
              <div 
                key={`${item.type}-${index}`}
                className={`live-card live-card-${item.type} ${urgent ? "is-urgent" : ""} ${soon ? "is-soon" : ""}`}
              >
                <div className="live-card-bg-accent"></div>
                
                <div className="live-card-header">
                  <div className="live-card-icon-wrap">
                    {getIcon(item.type)}
                  </div>
                  <div className="live-card-badge-group">
                    {urgent && <span className="live-card-alert">⚡ Due soon</span>}
                    {!urgent && <span className="live-card-status">On time</span>}
                  </div>
                </div>
                
                <div className="live-card-body">
                  <h3 className="live-card-title">{getCardLabel(item)}</h3>
                  <div className="live-card-route">
                    {item.type === "bus" ? (
                      <><span>{(item.item as BusTiming).from}</span><ArrowRight size={12} /><span>{(item.item as BusTiming).to}</span></>
                    ) : item.type === "train" ? (
                      <><Clock size={12} /><span>{(item.item as TrainTiming).nearbyStation}</span></>
                    ) : (
                      <><Sun size={12} /><span>{(item.item as WaterUpdate).session} session</span></>
                    )}
                  </div>
                </div>
                
                <div className="live-card-timeline">
                  <div className="timeline-track">
                    <div 
                      className="timeline-progress"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="live-card-footer">
                  <div className="live-card-time">
                    <span className="live-card-time-value">{format12h(getTime(item))}</span>
                    <span className="live-card-time-label">{item.relTime}</span>
                  </div>
                  <div className="live-card-arrow">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="live-timeline-dots">
        {items.map((_, i) => (
          <span key={i} className={`timeline-dot ${i === 0 ? "active" : ""}`}></span>
        ))}
      </div>
    </section>
  );
}