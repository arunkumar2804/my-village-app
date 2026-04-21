"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

export default function SettingsPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <main className="scroll-area">
      <div className="settings-page">
        <h1 className="settings-heading">Settings</h1>

        <div className="settings-group">
          <div className="settings-group-label">Management</div>
          <Link href="/admin" className="settings-row">
            <div className="settings-row-icon admin-icon">🛠</div>
            <div className="settings-row-body">
              <div className="settings-row-title">Admin Console</div>
              <div className="settings-row-desc">Manage bus, train, water & more</div>
            </div>
            <span className="settings-row-arrow">›</span>
          </Link>
        </div>

        <div className="settings-group">
          <div className="settings-group-label">App</div>
          <div className="settings-row">
            <div className="settings-row-icon">🔔</div>
            <div className="settings-row-body">
              <div className="settings-row-title">Notifications</div>
              <div className="settings-row-desc">Coming soon</div>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-icon">🌙</div>
            <div className="settings-row-body">
              <div className="settings-row-title">Appearance</div>
              <div className="settings-row-desc">Coming soon</div>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-icon">ℹ️</div>
            <div className="settings-row-body">
              <div className="settings-row-title">About</div>
              <div className="settings-row-desc">My Village App v1.0</div>
            </div>
          </div>
          <div className="settings-row" onClick={handleLogout} style={{ cursor: "pointer" }}>
            <div className="settings-row-icon">🚪</div>
            <div className="settings-row-body">
              <div className="settings-row-title" style={{ color: "var(--danger, #ef4444)" }}>Log Out</div>
              <div className="settings-row-desc">Sign out of your account</div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
