"use client";

import { Bus, Users, Clock } from "lucide-react";
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
    formattedText = m > 0 ? `${h} hrs ${m} mins` : `${h} hrs`;
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

  // Arrival chip logic
  const arrivalStatus = timeInfo.minutes < 1 ? "arriving" : timeInfo.minutes <= 5 ? "soon" : "later";
  const arrivalText = timeInfo.minutes < 1 ? "Arriving" : `${timeInfo.minutes} mins`;

  return (
    <div className={`bus-card-v2 ${timeInfo.minutes <= 1 ? 'urgent' : ''}`}>
      {/* Top Section */}
      <div className="bus-card-main-row">
        {/* Left Block: Route Number */}
        <div className="bus-left-block">
          <div className="route-num-box">
            {routeNumber}
          </div>
        </div>

        {/* Center Block: Route Info */}
        <div className="bus-center-block">
          <div className="route-visual-row">
            <span className="location-name">{fromLocation}</span>
            <div className="route-path-visual">
              <div className="path-dot"></div>
              <div className="path-line-dashed">
                <Bus size={12} className="bus-icon-small" />
              </div>
              <div className="path-dot"></div>
            </div>
            <span className="location-name">{toLocation}</span>
          </div>
          <div className="departure-time-row">
            Departs at {formatDepartureTime(departureTime)}
          </div>
        </div>

        {/* Right Block: Arrival Chip (and spacing buffer) */}
        <div className="bus-right-block">
          <div className={`arrival-status-pill ${arrivalStatus}`}>
            {arrivalText}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="bus-card-divider"></div>

      {/* Footer Row */}
      <div className="bus-card-footer-row">
        <div className="footer-left-tags">
          <span className="tag-chip tnstc">
            {ownershipType.toUpperCase() === 'GOVERNMENT' ? 'TNSTC' : serviceName}
          </span>
          {fareType === "Free" && (
            <span className="tag-chip free-bus">Free Bus</span>
          )}
        </div>
        <div className="footer-right-status">
          <span className={`crowd-status-pill ${crowdInfo.status}`}>
            <Users size={12} />
            {crowdInfo.label}
          </span>
        </div>
      </div>
    </div>
  );
}