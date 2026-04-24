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

  return (
    <div className={`bus-card ${timeInfo.minutes <= 5 ? 'urgent' : ''}`}>
      <div className="bus-card-top-header">
        <span className="bus-card-label">Next Bus</span>
        <span className="bus-card-operator">{ownershipType.toUpperCase() === 'GOVERNMENT' ? 'TNSTC' : serviceName}</span>
      </div>

      <div className="bus-card-main-info">
        <div className="bus-card-number-box">
          <span>{routeNumber}</span>
        </div>
        <div className="bus-card-route-info">
          <div className="bus-card-route-names">
            <span className="route-from">{fromLocation}</span>
            <div className="route-arrow">
              <div className="arrow-line"></div>
              <div className="arrow-head"></div>
            </div>
            <span className="route-to">{toLocation}</span>
          </div>
        </div>
      </div>

      <div className="bus-card-tags">
        {fareType === "Free" && (
          <span className="bus-tag free">
            Free Bus
          </span>
        )}
        <span className={`bus-tag crowd ${crowdInfo.status}`}>
          <Users size={12} />
          {crowdInfo.label}
        </span>
      </div>

      <div className="bus-card-footer">
        <div className="footer-depart">
          <span className="depart-label">Departs at</span>
          <span className="depart-time">{formatDepartureTime(departureTime)}</span>
        </div>
        <div className="footer-remain">
          <span className="remain-time">{timeInfo.formattedText}</span>
        </div>
      </div>
    </div>
  );
}