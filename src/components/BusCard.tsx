"use client";

import { Bus, Users } from "lucide-react";
import { useMemo } from "react";

interface BusCardProps {
  routeNumber: string;
  fromLocation: string;
  toLocation: string;
  departureTime: Date | string;
  serviceName: string;
  ownershipType: "Government" | "Private";
  fareType: "Free" | "Paid";
}

function calculateTimeRemaining(departureTime: Date | string): {
  minutes: number;
  status: "normal" | "arriving";
  formattedText: string;
} {
  let hours: number, minutes: number;
  
  if (typeof departureTime === "string" && departureTime.includes(":")) {
    const parts = departureTime.split(":").map(Number);
    hours = parts[0];
    minutes = parts[1];
  } else {
    const date = new Date(departureTime);
    hours = date.getHours();
    minutes = date.getMinutes();
  }
  
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  
  const diffMs = target.getTime() - now.getTime();
  const diffMinutes = Math.ceil(diffMs / 60000);
  const totalMins = Math.max(0, diffMinutes);

  let formattedText = "";
  if (totalMins <= 1) {
    formattedText = "Arriving";
  } else if (totalMins < 60) {
    formattedText = `${totalMins} mins`;
  } else {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    formattedText = m > 0 ? `${h} hr ${m} mins` : `${h} hr`;
  }

  return {
    minutes: totalMins,
    status: totalMins <= 1 ? "arriving" : "normal",
    formattedText,
  };
}

function calculateCrowdStatus(departureTime: Date | string): {
  status: "crowded" | "less";
  label: string;
} {
  let hours: number, minutes: number;
  
  if (typeof departureTime === "string" && departureTime.includes(":")) {
    const parts = departureTime.split(":").map(Number);
    hours = parts[0];
    minutes = parts[1];
  } else {
    const date = new Date(departureTime);
    hours = date.getHours();
    minutes = date.getMinutes();
  }
  
  const totalMinutes = hours * 60 + minutes;

  const morningPeakStart = 7 * 60;
  const morningPeakEnd = 9 * 60;
  const eveningPeakStart = 16 * 60;
  const eveningPeakEnd = 18 * 60 + 30;

  if (
    (totalMinutes >= morningPeakStart && totalMinutes <= morningPeakEnd) ||
    (totalMinutes >= eveningPeakStart && totalMinutes <= eveningPeakEnd)
  ) {
    return { status: "crowded", label: "Mostly crowded" };
  }
  return { status: "less", label: "Less crowded" };
}

function formatDepartureTime(departureTime: Date | string): string {
  let hours: number, minutes: number;
  
  if (typeof departureTime === "string" && departureTime.includes(":")) {
    const parts = departureTime.split(":").map(Number);
    hours = parts[0];
    minutes = parts[1];
  } else {
    const date = new Date(departureTime);
    hours = date.getHours();
    minutes = date.getMinutes();
  }
  
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

export default function BusCard({
  routeNumber,
  fromLocation,
  toLocation,
  departureTime,
  serviceName,
  ownershipType,
  fareType,
}: BusCardProps) {
  const timeInfo = useMemo(
    () => calculateTimeRemaining(departureTime),
    [departureTime]
  );
  const crowdInfo = useMemo(
    () => calculateCrowdStatus(departureTime),
    [departureTime]
  );

  return (
    <div className="bus-card-final">
      {/* Header Strip */}
      <div className="bus-header-strip">
        <div className="header-left">
          <Bus size={18} className="header-bus-icon" />
          <span className="next-bus-label">NEXT BUS</span>
        </div>
        <div className="header-right">
          <div className="arrives-pill">
            <span className="pulse-dot"></span>
            <span className="mins-val">{timeInfo.formattedText}</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="bus-body">
        <div className="route-row">
          <div className="route-badge">
            {routeNumber}
          </div>
          <div className="route-info-stack">
            <div className="stops-row">
              <span className="stop-name">{fromLocation}</span>
              <div className="path-visualizer">
                <div className="dot-start"></div>
                <div className="dashed-line-seg"></div>
                <Bus size={16} className="path-bus-icon" />
                <div className="dashed-line-seg"></div>
                <div className="dot-end"></div>
              </div>
              <span className="stop-name">{toLocation}</span>
            </div>
            <div className="depart-time-text">
              {formatDepartureTime(departureTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="bus-card-divider-final"></div>

      {/* Footer */}
      <div className="bus-footer-final">
        <div className="footer-tags-left">
          <span className="footer-tag-pill">
            {ownershipType.toUpperCase() === 'GOVERNMENT' ? 'TNSTC' : serviceName}
          </span>
          {fareType === "Free" && (
            <span className="footer-tag-pill">Free Bus</span>
          )}
        </div>
        <div className="footer-crowd-right">
          <div className={`crowd-badge-final ${crowdInfo.status}`}>
            <Users size={14} />
            <span>{crowdInfo.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
