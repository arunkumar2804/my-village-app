import React from "react";
import BottomNav from "@/components/BottomNav";

export default function MapPage() {
  return (
    <main className="scroll-area">
      <div className="empty-page">
        <div className="empty-icon">🗺️</div>
        <h2>Map</h2>
        <p>Village map coming soon</p>
      </div>
      <BottomNav />
    </main>
  );
}
