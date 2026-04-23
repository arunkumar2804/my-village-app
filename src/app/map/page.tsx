"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MapPin, 
  School, 
  Landmark, 
  Waves, 
  Store, 
  Church, 
  X, 
  Navigation,
  Search,
  Crosshair,
  Layers,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  Compass
} from "lucide-react";
import "./map.css";
import * as store from "@/lib/store";
import type { VillageLocation } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

const CATEGORIES = [
  { id: "temple", label: "Temples", icon: <Church size={18} />, emoji: "🛕", color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" },
  { id: "school", label: "Schools", icon: <School size={18} />, emoji: "🏫", color: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
  { id: "panchayat", label: "Panchayat", icon: <Landmark size={18} />, emoji: "🏛️", color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" },
  { id: "vao", label: "VAO Office", icon: <Landmark size={18} />, emoji: "🏢", color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" },
  { id: "lake", label: "Lakes", icon: <Waves size={18} />, emoji: "🌊", color: "#06b6d4", gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)" },
  { id: "shop", label: "Shops", icon: <Store size={18} />, emoji: "🛍️", color: "#ec4899", gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)" },
];

export default function MapPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<VillageLocation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<VillageLocation[]>([]);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [userMarker, setUserMarker] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const userLocationInterval = useRef<NodeJS.Timeout | null>(null);

  const villageCenter: [number, number] = [10.6049693, 77.1235782];

  useEffect(() => {
    store.getVillageLocations().then((data) => {
      setLocations(data);
    });

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.id = "leaflet-css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.id = "leaflet-js";
    script.onload = () => {
      initMap();
    };
    document.head.appendChild(script);

    return () => {
      const existingLink = document.getElementById("leaflet-css");
      const existingScript = document.getElementById("leaflet-js");
      if (existingLink) existingLink.remove();
      if (existingScript) existingScript.remove();
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

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(leafletMap);

    // Add custom zoom control
    const zoomControl = L.control({ position: "topright" });
    zoomControl.onAdd = () => {
      const container = L.DomUtil.create("div", "premium-zoom-control");
      container.innerHTML = `
        <button class="zoom-btn zoom-in" title="Zoom in">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button class="zoom-btn zoom-out" title="Zoom out">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      `;
      container.querySelector(".zoom-in")?.addEventListener("click", () => leafletMap.zoomIn());
      container.querySelector(".zoom-out")?.addEventListener("click", () => leafletMap.zoomOut());
      return container;
    };
    zoomControl.addTo(leafletMap);

    setMap(leafletMap);
  };

  const getUserLocation = useCallback(() => {
    const L = (window as any).L;
    if (!L || !map) return;

    setIsLocating(true);

    if (!navigator.geolocation) {
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userPos: [number, number] = [latitude, longitude];
        setUserLocation(userPos);
        setIsLocating(false);

        if (userMarker) {
          map.removeLayer(userMarker);
        }

        const pulseIcon = L.divIcon({
          className: 'user-location-marker',
          html: `
            <div class="user-marker-container">
              <div class="user-marker-pulse"></div>
              <div class="user-marker-dot"></div>
            </div>
          `,
          iconSize: [50, 50],
          iconAnchor: [25, 25]
        });

        const marker = L.marker(userPos, { icon: pulseIcon }).addTo(map);
        setUserMarker(marker);

        map.setView(userPos, 17, { animate: true, duration: 0.8 });
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [map, userMarker]);

  useEffect(() => {
    if (map) {
      getUserLocation();
    }
  }, [map]);

  useEffect(() => {
    const L = (window as any).L;
    if (!map || !L) return;

    markers.forEach(m => map.removeLayer(m));

    const newMarkers = locations.map(loc => {
      const cat = CATEGORIES.find(c => c.id === loc.category);
      const isSelected = selectedMarker === loc.id;

      const icon = L.divIcon({
        className: 'premium-marker-icon',
        html: `
          <div class="marker-wrapper ${isSelected ? 'selected' : ''}" style="--marker-color: ${cat?.color || '#333'}">
            <div class="marker-bounce"></div>
            <div class="marker-content">
              <span class="marker-emoji">${cat?.emoji || '📍'}</span>
            </div>
            <div class="marker-glow"></div>
          </div>
        `,
        iconSize: [48, 56],
        iconAnchor: [24, 56],
        popupAnchor: [0, -56]
      });

      const marker = L.marker([loc.lat, loc.lng], { icon })
        .addTo(map)
        .on('click', () => {
          setSelectedMarker(loc.id);
setSelectedCategory(loc.category);
          setFilteredLocations([loc]);
          setShowSheet(true);
        });

      return marker;
    });

    setMarkers(newMarkers);
  }, [map, locations, selectedMarker]);

  const handleCategoryClick = (catId: string) => {
    const isActive = selectedCategory === catId;
    setSelectedCategory(isActive ? null : catId);
    const filtered = locations.filter(loc => loc.category === catId);
    setFilteredLocations(filtered);
    setShowSheet(true);

    if (map && filtered.length > 0) {
      const bounds = filtered.map(loc => [loc.lat, loc.lng] as [number, number]);
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 17, animate: true });
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      const filtered = locations.filter(loc => 
        loc.name.toLowerCase().includes(query.toLowerCase()) ||
        loc.description?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredLocations(filtered);
      setShowSheet(true);
    } else {
      setShowSheet(false);
    }
  };

  const openInGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  const resetMapView = () => {
    if (map) {
      map.setView(villageCenter, 16, { animate: true, duration: 0.8 });
    }
  };

  return (
    <div className="map-page-container">
      {/* Premium Header */}
      <header className="map-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => router.back()}>
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <div className="header-title">
            <h1>Village Map</h1>
            <span className="header-subtitle">Panaimarathupalayam</span>
          </div>
        </div>
        <button className="locate-btn" onClick={getUserLocation} disabled={isLocating}>
          <Crosshair size={18} className={isLocating ? "locating" : ""} />
        </button>
      </header>

      {/* Search Bar */}
      <div className="map-search-container">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search places, locations..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => handleSearch("")}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Map View */}
      <div className="map-view-area" ref={mapRef}>
        <div id="map-container" style={{ width: '100%', height: '100%' }}></div>

        {/* Map Overlay Controls */}
        <div className="map-overlay-controls">
          <button className="overlay-btn" onClick={resetMapView} title="Reset view">
            <Compass size={20} />
          </button>
        </div>

        {/* Location Counter Badge */}
        <div className="location-count-badge">
          <span className="count-number">{locations.length}</span>
          <span className="count-label">places</span>
        </div>
      </div>

      {/* Premium Category Chips */}
      <div className="map-category-container">
        <div className="category-scroll">
          {CATEGORIES.map((cat) => {
            const count = locations.filter(l => l.category === cat.id).length;
            return (
              <button
                key={cat.id}
                className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat.id)}
                style={{ "--cat-color": cat.color, "--cat-gradient": cat.gradient } as React.CSSProperties}
              >
                <div className="chip-icon">
                  {cat.icon}
                </div>
                <div className="chip-content">
                  <span className="chip-label">{cat.label}</span>
                  <span className="chip-count">{count}</span>
                </div>
                {selectedCategory === cat.id && <div className="chip-indicator" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Premium Bottom Sheet */}
      {showSheet && (
        <div className="location-sheet-overlay" onClick={() => {
          setShowSheet(false);
          setSelectedMarker(null);
        }}>
          <div className="location-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            
            <div className="sheet-header">
              <div className="sheet-title-section">
                <div 
                  className="sheet-icon"
                  style={{ background: CATEGORIES.find(c => c.id === selectedCategory)?.gradient }}
                >
                  {CATEGORIES.find(c => c.id === selectedCategory)?.icon}
                </div>
                <div className="sheet-title-content">
                  <h2>{CATEGORIES.find(c => c.id === selectedCategory)?.label}</h2>
                  <span className="sheet-count">{filteredLocations.length} {filteredLocations.length === 1 ? 'location' : 'locations'}</span>
                </div>
              </div>
              <button className="close-sheet" onClick={() => {
                setShowSheet(false);
                setSelectedMarker(null);
              }}>
                <X size={20} />
              </button>
            </div>

            <div className="location-list">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((loc) => (
                  <div 
                    key={loc.id} 
                    className="location-item"
                    onClick={() => {
                      setSelectedMarker(loc.id);
                      if (map) {
                        map.setView([loc.lat, loc.lng], 18, { animate: true });
                      }
                    }}
                  >
                    <div className="location-content">
                      <div className="location-header">
                        <span className="loc-name">{loc.name}</span>
                        <span className="loc-distance">
                          <MapPin size={12} /> 0.5 km
                        </span>
                      </div>
                      <p className="loc-desc">{loc.description || "No description available"}</p>
                      <div className="loc-footer">
                        <span className="loc-coords">
                          {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                        </span>
                      </div>
                    </div>
                    <button 
                      className="navigate-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInGoogleMaps(loc.lat, loc.lng);
                      }}
                    >
                      <Navigation size={16} />
                      <span>Navigate</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon-wrapper">
                    <MapPin size={40} />
                  </div>
                  <h3>No Locations Found</h3>
                  <p>No {selectedCategory}s marked yet in Panaimarathupalayam.</p>
                  <button className="add-location-btn">
                    <span>Add First Location</span>
                    <ChevronRight size={16} />
                  </button>
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
