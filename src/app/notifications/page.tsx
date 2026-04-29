"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bell, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getNotifications } from "@/lib/store";
import type { NotificationEntry } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

export default function NotificationsPage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState("");
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      const [{ data }, rows] = await Promise.all([supabase.auth.getSession(), getNotifications()]);
      const userId = data.session?.user?.id || "";
      setCurrentUserId(userId);
      setNotifications(rows.filter((entry) => entry.isActive));
      setLoading(false);
    };

    void load();
  }, []);

  const visibleNotifications = useMemo(() => {
    return notifications.filter((entry) => {
      const recipientMatch =
        entry.targetType === "all" || (currentUserId && Array.isArray(entry.targetUserIds) && entry.targetUserIds.includes(currentUserId));
      const search = query.toLowerCase();
      const contentMatch =
        entry.title.toLowerCase().includes(search) || entry.description.toLowerCase().includes(search);
      return recipientMatch && contentMatch;
    });
  }, [notifications, currentUserId, query]);

  return (
    <main className="scroll-area">
      <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderRadius: 16,
            background: "var(--card-bg)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              border: "1px solid var(--glass-border)",
              background: "transparent",
              color: "var(--foreground)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Notifications</h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
              Alerts from admin console
            </p>
          </div>
          <Bell size={18} color="var(--primary)" />
        </div>

        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Search size={16} style={{ position: "absolute", left: 12, color: "var(--text-muted)" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notifications"
            style={{
              width: "100%",
              borderRadius: 12,
              border: "1px solid var(--glass-border)",
              background: "var(--card-bg)",
              color: "var(--foreground)",
              fontSize: 14,
              fontWeight: 600,
              padding: "10px 12px 10px 36px",
            }}
          />
        </div>

        {loading ? (
          <div style={{ color: "var(--text-muted)", fontWeight: 600, padding: "16px 2px" }}>Loading notifications...</div>
        ) : visibleNotifications.length === 0 ? (
          <div
            style={{
              borderRadius: 16,
              background: "var(--card-bg)",
              border: "1px solid var(--glass-border)",
              padding: 16,
              color: "var(--text-muted)",
              fontWeight: 600,
            }}
          >
            No notifications for you right now.
          </div>
        ) : (
          visibleNotifications.map((item) => (
            <article
              key={item.id}
              style={{
                borderRadius: 16,
                background: "var(--card-bg)",
                border: "1px solid var(--glass-border)",
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--foreground)" }}>{item.title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>{item.description}</p>
            </article>
          ))
        )}
      </section>
      <BottomNav />
    </main>
  );
}
