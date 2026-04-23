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
} {
  const departure = new Date(departureTime);
  const now = new Date();
  const diffMs = departure.getTime() - now.getTime();
  const diffMinutes = Math.ceil(diffMs / 60000);

  return {
    minutes: Math.max(0, diffMinutes),
    status: diffMinutes <= 1 ? "arriving" : "normal",
  };
}

function calculateCrowdStatus(departureTime: Date | string): {
  status: "crowded" | "less";
  label: string;
} {
  const departure = new Date(departureTime);
  const hours = departure.getHours();
  const minutes = departure.getMinutes();
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
  const date = new Date(departureTime);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
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
    <div className="bus-card">
      <div className="bus-card-header">
        <div className="bus-card-header-left">
          <Bus size={18} className="bus-icon" />
          <span className="bus-card-header-label">Next Bus</span>
        </div>
        <div
          className={`bus-card-time-chip ${
            timeInfo.status === "arriving" ? "arriving" : "normal"
          }`}
        >
          {timeInfo.status === "arriving" ? (
            "Arriving"
          ) : (
            <>
              <Clock size={12} />
              <span>{timeInfo.minutes} mins</span>
            </>
          )}
        </div>
      </div>

      <div className="bus-card-main">
        <div className="bus-card-main-top">
          <div className="bus-card-route-badge">{routeNumber}</div>
          <div className="bus-card-route-path">
            <div className="bus-card-destination">
              <span className="destination-from">{fromLocation}</span>
              <div className="path-connector">
                <span className="connector-line"></span>
                <Bus size={14} className="connector-bus" />
                <span className="connector-line"></span>
              </div>
              <span className="destination-to">{toLocation}</span>
            </div>
            <div className="bus-card-departure">
              Departs at {formatDepartureTime(departureTime)}
            </div>
          </div>
          <div
            className={`bus-card-crowd-chip ${crowdInfo.status}`}
          >
            <Users size={12} />
            <span>{crowdInfo.label}</span>
          </div>
        </div>
      </div>

      <div className="bus-card-footer">
        <div className="bus-card-tag service-tag">
          <span className="tag-label">Service</span>
          <span className="tag-value">{serviceName}</span>
        </div>
        <div className="bus-card-tag ownership-tag">
          <span className="tag-label">Ownership</span>
          <span className="tag-value">{ownershipType}</span>
        </div>
        <div className="bus-card-tag fare-tag">
          <span className="tag-label">Fare</span>
          <span className="tag-value">{fareType}</span>
        </div>
      </div>
    </div>
  );
}