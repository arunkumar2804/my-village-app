"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, Clock, Sun } from "lucide-react";
import "./live-updates.css";
import { getTrainTimings, getWaterUpdates } from "@/lib/store";
import { getActiveBusSchedules } from "@/lib/bus-schedules";
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

function getTimeOnDate(timeStr: string, baseDate: Date): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hours, minutes, 0);
}

function addMinutes(date: Date, mins: number): Date {
  return new Date(date.getTime() + mins * 60000);
}

function formatBusBadgeTime(departureDate: Date): string {
  const nowMs = Date.now();
  const departureMs = departureDate.getTime();

  if (nowMs < departureMs) return formatTimeRemaining(departureDate);

  const minsSinceDeparture = Math.floor((nowMs - departureMs) / 60000);
  if (minsSinceDeparture <= 0) return "Departing now";
  if (minsSinceDeparture <= 25) return `On route ${minsSinceDeparture} mins`;
  return "On schedule";
}

type LiveBusData = { item: BusTiming; timeRemaining: string; date: Date };

function getNextDeparture(timeStr: string, now: Date): Date {
  const departureToday = getTimeOnDate(timeStr, now);
  if (departureToday.getTime() > now.getTime()) return departureToday;
  return addMinutes(departureToday, 24 * 60);
}

function getPreviousDeparture(nextDeparture: Date): Date {
  return addMinutes(nextDeparture, -24 * 60);
}

function getBusCardSelections(activeBuses: BusTiming[]): { nextBus: LiveBusData | null; previousBus: LiveBusData | null } {
  if (activeBuses.length === 0) return { nextBus: null, previousBus: null };

  const now = new Date();
  const nowMs = now.getTime();

  const candidates = activeBuses.map((bus) => {
    const nextDeparture = getNextDeparture(bus.departureTime, now);
    const previousDeparture = getPreviousDeparture(nextDeparture);
    const previousJourneyEnd = addMinutes(previousDeparture, 25);
    const isPreviousBusOnRoute = nowMs >= previousDeparture.getTime() && nowMs <= previousJourneyEnd.getTime();

    return { bus, nextDeparture, previousDeparture, isPreviousBusOnRoute };
  });

  const nearestUpcomingBus = candidates.reduce((prev, current) => {
    const prevDiff = prev.nextDeparture.getTime() - nowMs;
    const currentDiff = current.nextDeparture.getTime() - nowMs;
    return currentDiff < prevDiff ? current : prev;
  });

  const busesOnRoute = candidates.filter((candidate) => candidate.isPreviousBusOnRoute);
  const latestOnRouteBus =
    busesOnRoute.length > 0
      ? busesOnRoute.reduce((prev, current) => {
          const prevDiff = nowMs - prev.previousDeparture.getTime();
          const currentDiff = nowMs - current.previousDeparture.getTime();
          return currentDiff < prevDiff ? current : prev;
        })
      : null;

  const nextBus: LiveBusData = {
    item: nearestUpcomingBus.bus,
    timeRemaining: formatBusBadgeTime(nearestUpcomingBus.nextDeparture),
    date: nearestUpcomingBus.nextDeparture,
  };

  const previousBus: LiveBusData | null = latestOnRouteBus
    ? {
        item: latestOnRouteBus.bus,
        timeRemaining: formatBusBadgeTime(latestOnRouteBus.previousDeparture),
        date: latestOnRouteBus.previousDeparture,
      }
    : null;

  return { nextBus, previousBus };
}

function getBusJourneyProgress(departureDate?: Date): number | null {
  if (!departureDate) return null;

  const nowMs = Date.now();
  const departureMs = departureDate.getTime();
  const journeyStartMs = departureMs - 30 * 60000;
  const journeyCenterMs = departureMs;
  const journeyEndMs = departureMs + 25 * 60000;

  if (nowMs < journeyStartMs || nowMs > journeyEndMs) return null;

  if (nowMs <= journeyCenterMs) {
    const firstHalfProgress = (nowMs - journeyStartMs) / (journeyCenterMs - journeyStartMs);
    return firstHalfProgress * 50;
  }

  const secondHalfProgress = (nowMs - journeyCenterMs) / (journeyEndMs - journeyCenterMs);
  return 50 + secondHalfProgress * 50;
}

function isPeakTimeNow(): boolean {
  const now = new Date();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const morningPeak = minutesNow >= 8 * 60 && minutesNow < 9 * 60;
  const eveningPeak = minutesNow >= 16 * 60 && minutesNow <= 18 * 60 + 30;
  return morningPeak || eveningPeak;
}

function getCrowdStatus(): { label: "Mostly crowded" | "Less crowded"; toneClass: string } {
  if (isPeakTimeNow()) {
    return { label: "Mostly crowded", toneClass: "crowd-peak" };
  }
  return { label: "Less crowded", toneClass: "crowd-low" };
}

function getOperatorLabel(bus: BusTiming): string {
  const service = bus.serviceName?.trim();
  if (service) return service;
  return bus.operatorType === "government" ? "Government Transport" : "Private Operator";
}

export default function LiveUpdates() {
  const [nextBus, setNextBus] = useState<{ item: BusTiming; timeRemaining: string; date?: Date } | null>(null);
  const [previousBus, setPreviousBus] = useState<{ item: BusTiming; timeRemaining: string; date?: Date } | null>(null);
  const [showPreviousBus, setShowPreviousBus] = useState(false);
  const [nextTrain, setNextTrain] = useState<{ item: TrainTiming; timeRemaining: string; date?: Date } | null>(null);
  const [nextWater, setNextWater] = useState<{ item: WaterUpdate; timeRemaining: string; date?: Date } | null>(null);
  const previousBusKeyRef = useRef("none");
  const busCrowdStatus = getCrowdStatus();
  const busJourneyProgress = getBusJourneyProgress(nextBus?.date);

  const calculateNext = async () => {
    // Bus
    const activeBuses = await getActiveBusSchedules();
    const { nextBus: selectedNextBus, previousBus: selectedPreviousBus } = getBusCardSelections(activeBuses);
    const newPreviousBusKey = selectedPreviousBus ? `${selectedPreviousBus.item.id}-${selectedPreviousBus.date?.getTime() ?? "na"}` : "none";
    if (newPreviousBusKey !== previousBusKeyRef.current) {
      previousBusKeyRef.current = newPreviousBusKey;
      setShowPreviousBus(false);
    }
    setNextBus(selectedNextBus);
    setPreviousBus(selectedPreviousBus);

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
    const runCalculateNext = () => {
      void calculateNext();
    };

    // Initial calculate on mount (client-side)
    const initialTimeoutId = setTimeout(runCalculateNext, 0);

    // Update every minute
    const intervalId = setInterval(runCalculateNext, 60000);
    return () => {
      clearTimeout(initialTimeoutId);
      clearInterval(intervalId);
    };
  }, []);

  if (!nextBus && !previousBus && !nextTrain && !nextWater) {
    return (
      <section className="live-updates-container">
        <h2 className="section-title">Live updates</h2>
        <div className="live-updates-empty">No live updates currently available.</div>
      </section>
    );
  }

  return (
    <section className="live-updates-container">
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

            <div className="bus-progress-visual">
              <div className="bus-progress-labels">
                <span className="progress-label-start">{nextBus.item.from}</span>
                <span className="progress-label-center">Panaimarathupalayam</span>
                <span className="progress-label-end">{nextBus.item.to}</span>
              </div>
              <div className="bus-progress-track">
                <span className="progress-dot progress-dot-start"></span>
                <span className="progress-dot progress-dot-center"></span>
                <span className="progress-destination-line"></span>
                {busJourneyProgress !== null && (
                  <span className="moving-bus-marker" style={{ left: `${busJourneyProgress}%` }}>
                    <span className="moving-bus-icon">
                      <Image src="/icons/bus-icon.svg" alt="Moving bus" fill style={{ objectFit: "contain" }} />
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="bus-footer-row">
              <div className="bus-footer-left">
                <div className="meta-chip chip-operator">Operator: {getOperatorLabel(nextBus.item)}</div>
                <div className={`meta-chip ${nextBus.item.fareType === "free" ? "chip-fare-free" : "chip-fare-paid"}`}>
                  {nextBus.item.fareType === "free" ? "Free" : "Paid"}
                </div>
              </div>
              <div className={`meta-chip chip-crowd ${busCrowdStatus.toneClass}`}>{busCrowdStatus.label}</div>
            </div>
          </div>
        </div>
      )}
      {previousBus && (
        <div className="previous-bus-block">
          <button
            type="button"
            className="previous-bus-toggle"
            onClick={() => setShowPreviousBus((prev) => !prev)}
          >
            {showPreviousBus ? "Hide previous bus" : "View previous bus"}
          </button>

          {showPreviousBus && (
            <div className="previous-bus-card">
              <div className="previous-bus-top-row">
                <span className="previous-bus-label">Previous bus on route</span>
                <span className="previous-bus-time">{previousBus.timeRemaining}</span>
              </div>
              <div className="previous-bus-route-row">
                <span className="previous-bus-route-number">{previousBus.item.routeNumber}</span>
                <span className="previous-bus-route-name">{previousBus.item.from}</span>
                <ArrowRight size={12} className="previous-bus-arrow" />
                <span className="previous-bus-route-name">{previousBus.item.to}</span>
              </div>
              <div className="previous-bus-meta">Departed at {format12h(previousBus.item.departureTime)}</div>
            </div>
          )}
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

            <div className="card-footer-row">
              <div className="meta-chip chip-subtle">Route: {nextTrain.item.from} to {nextTrain.item.to}</div>
              <div className="meta-chip chip-subtle">Nearby: {nextTrain.item.nearbyStation}</div>
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
                <div className="water-session" style={{ textTransform: "capitalize" }}>
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

            <div className="card-footer-row">
              <div className="meta-chip chip-subtle">Zone: {nextWater.item.zone}</div>
              <div className="meta-chip chip-subtle" style={{ textTransform: "capitalize" }}>
                {nextWater.item.session} supply
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
