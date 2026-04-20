"use client";
import React, { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { getAnnouncements } from "@/lib/store";
import type { Announcement } from "@/lib/types";
import "./ticker.css";

export default function AnnouncementTicker() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnnouncements().then((data) => {
      setAnnouncements(data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  return (
    <div className="ticker-wrapper">
      <div className="ticker-icon">
        <Megaphone size={16} />
      </div>
      <div className="ticker-content">
        {announcements.length === 0 ? (
          <span className="ticker-empty">No new announcements at this time.</span>
        ) : (
          <div className="ticker-scroll-container">
            <div className="ticker-scroll">
              {announcements.map((a) => (
                <span key={a.id} className="ticker-item">
                  <span className={`priority-dot ${a.priority}`}></span>
                  <span className="ticker-title">{a.title}</span>
                  <span className="ticker-desc">{a.description}</span>
                </span>
              ))}
              {/* Duplicate for seamless scrolling effect if needed */}
              {announcements.length > 0 && announcements.map((a) => (
                <span key={a.id + "-dup"} className="ticker-item">
                  <span className={`priority-dot ${a.priority}`}></span>
                  <span className="ticker-title">{a.title}</span>
                  <span className="ticker-desc">{a.description}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
