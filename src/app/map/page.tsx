"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, School, Landmark, Waves, Store, Church, X, Navigation } from "lucide-react";
import "./map.css";
import * as store from "@/lib/store";
import type { VillageLocation } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

const CATEGORIES = [
  { id: "temple", label: "Temples", icon: <Church size={18} />, emoji: "🛕" },
  { id: "school", label: "Schools", icon: <School size={18} />, emoji: "🏫" },
  { id: "panchayat", label: "Panchayat", icon: <Landmark size={18} />, emoji: "🏛️" },
  { id: "vao", label: "VAO Office", icon: <Landmark size={18} />, emoji: "🏢" },
  { id: "lake", label: "Lakes", icon: <Waves size={18} />, emoji: "🌊" },
  { id: "shop", label: "Shops", icon: <Store size={18} />, emoji: "🛍️" },
];

export default function MapPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<VillageLocation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<VillageLocation[]>([]);
  
  // Coordinates provided for Panaimarathupalayam: 10.6049693, 77.1235782
  const staticEmbed = "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d15671.1!2d77.1235782!3d10.6049693!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1713619200000!5m2!1sen!2sin";

  useEffect(() => {
    store.getVillageLocations().then(setLocations);
  }, []);

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    const filtered = locations.filter(loc => loc.category === catId);
    setFilteredLocations(filtered);
    setShowSheet(true);
  };

  const openInGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  return (
    <div className="map-page-container">
      <header className="map-header">
        <button className="back-btn" onClick={() => router.back()}>
          <ArrowLeft size={24} />
        </button>
        <h1>Village Map</h1>
      </header>

      <div className="map-view-area">
        <iframe
          src={staticEmbed}
          className="village-map-iframe"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>

      <div className="map-category-container">
        {CATEGORIES.map((cat) => (
          <div 
            key={cat.id} 
            className={`map-category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => handleCategoryClick(cat.id)}
          >
            {cat.icon}
            {cat.label}
          </div>
        ))}
      </div>

      {showSheet && (
        <div className="location-sheet-overlay" onClick={() => setShowSheet(false)}>
          <div className="location-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <h2>{CATEGORIES.find(c => c.id === selectedCategory)?.label}</h2>
              <button className="close-sheet" onClick={() => setShowSheet(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="location-list">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((loc) => (
                  <div key={loc.id} className="location-item">
                    <div className="location-info">
                      <div className="loc-name">{loc.name}</div>
                      <div className="loc-desc">{loc.description || "No description available"}</div>
                    </div>
                    <button 
                      className="view-on-map"
                      onClick={() => openInGoogleMaps(loc.lat, loc.lng)}
                    >
                      <Navigation size={14} style={{ marginRight: 4 }} />
                      Go
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                  <MapPin size={48} style={{ marginBottom: 12, margin: '0 auto' }} />
                  <p>No {selectedCategory}s marked yet in Panaimarathupalayam.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
