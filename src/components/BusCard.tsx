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
      <div className="bus-card-header">
        <div className="bus-card-badge-row">
          <span className={`bus-card-tag ${ownershipType.toLowerCase() === 'government' ? 'govt' : 'private'}`}>
            {ownershipType}
          </span>
          <span className={`bus-card-crowd-tag ${crowdInfo.status}`}>
            <Users size={12} style={{ marginRight: 4 }} />
            {crowdInfo.label}
          </span>
          {timeInfo.minutes <= 5 && <span className="bus-card-tag urgent">Arriving soon</span>}
        </div>
        <div className="bus-card-route-num">#{routeNumber}</div>
      </div>

      <div className="bus-card-path">
        <div className="bus-card-stop">
          <div className="bus-card-stop-dot"></div>
          <span>{fromLocation}</span>
        </div>
        <div className="bus-card-journey">
          <div className="bus-card-track">
            <div className="bus-card-progress" style={{ width: '65%' }}>
              <div className="bus-card-icon-wrap">
                <Bus size={16} />
              </div>
            </div>
          </div>
          <div className="bus-card-journey-dots">
            <span>•</span><span>•</span><span>•</span><span>•</span>
          </div>
        </div>
        <div className="bus-card-stop">
          <div className="bus-card-stop-dot end"></div>
          <span>{toLocation}</span>
        </div>
      </div>

      <div className="bus-card-timing">
        <div className="bus-card-remain-chip">
          <Clock size={16} style={{ marginRight: 6 }} />
          <span>{timeInfo.formattedText}</span>
        </div>
        <div className="bus-card-depart-info">
          <span className="bus-card-depart-label">Departure</span>
          <span className="bus-card-depart-time">{formatDepartureTime(departureTime)}</span>
        </div>
      </div>
    </div>
  );
}