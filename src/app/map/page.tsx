"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, School, Landmark, Waves, Store, Church, X, Navigation } from "lucide-react";
import "./map.css";
import * as store from "@/lib/store";
import type { VillageLocation } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

import Head from "next/head";

const CATEGORIES = [
  { id: "temple", label: "Temples", icon: <Church size={18} />, emoji: "🛕", color: "#f59e0b" },
  { id: "school", label: "Schools", icon: <School size={18} />, emoji: "🏫", color: "#10b981" },
  { id: "panchayat", label: "Panchayat", icon: <Landmark size={18} />, emoji: "🏛️", color: "#3b82f6" },
  { id: "vao", label: "VAO Office", icon: <Landmark size={18} />, emoji: "🏢", color: "#8b5cf6" },
  { id: "lake", label: "Lakes", icon: <Waves size={18} />, emoji: "🌊", color: "#06b6d4" },
  { id: "shop", label: "Shops", icon: <Store size={18} />, emoji: "🛍️", color: "#ec4899" },
];

export default function MapPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<VillageLocation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<VillageLocation[]>([]);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);

  // Panaimarathupalayam Center
  const villageCenter: [number, number] = [10.6049693, 77.1235782];

  useEffect(() => {
    // Fetch locations from store
    store.getVillageLocations().then((data) => {
      setLocations(data);
    });

    // Load Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      initMap();
    };
    document.head.appendChild(script);

    return () => {
      link.remove();
      script.remove();
    };
  }, []);

  const initMap = () => {
    const L = (window as any).L;
    if (!L || map) return;

    const leafletMap = L.map("map-container", {
      center: villageCenter,
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(leafletMap);

    setMap(leafletMap);
  };

  // Add markers when locations or map is ready
  useEffect(() => {
    const L = (window as any).L;
    if (!map || !L) return;

    // Clear old markers
    markers.forEach(m => map.removeLayer(m));
    
    const newMarkers = locations.map(loc => {
      const cat = CATEGORIES.find(c => c.id === loc.category);
      const icon = L.divIcon({
        className: 'custom-marker-icon',
        html: `<div style="background-color: ${cat?.color || '#333'}; padding: 8px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.2); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 16px;">${cat?.emoji || '📍'}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([loc.lat, loc.lng], { icon })
        .addTo(map)
        .on('click', () => {
          setSelectedCategory(loc.category);
          setFilteredLocations([loc]);
          setShowSheet(true);
        });

      return marker;
    });

    setMarkers(newMarkers);
  }, [map, locations]);

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    const filtered = locations.filter(loc => loc.category === catId);
    setFilteredLocations(filtered);
    setShowSheet(true);

    if (map && filtered.length > 0) {
        // Zoom to first marker in category
        map.setView([filtered[0].lat, filtered[0].lng], 17);
    }
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
        <div id="map-container" style={{ width: '100%', height: '100%' }}></div>
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
