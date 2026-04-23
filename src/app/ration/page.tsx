"use client";

import React from "react";
import { ArrowLeft, User, MapPin, Clock, Phone, Hash, CreditCard, Users, Box, Store, Info, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import "./ration.css";

export default function RationPage() {
  const router = useRouter();

  const stockData = [
    { name: "Rice - General", unit: "Kg", allotted: 1026.00, available: 894.00, icon: "🍚" },
    { name: "Rice - AAY", unit: "Kg", allotted: 1250.00, available: 854.06, icon: "🍚" },
    { name: "Rice - PHH", unit: "Kg", allotted: 646.00, available: 675.00, icon: "🍚" },
    { name: "Sugar", unit: "Kg", allotted: 173.00, available: 134.00, icon: "🍬" },
    { name: "AAY Sugar", unit: "Kg", allotted: 51.50, available: 37.50, icon: "🍬" },
    { name: "Wheat", unit: "Kg", allotted: 199.00, available: 50.00, icon: "🌾" },
    { name: "Kerosene", unit: "Litre", allotted: 100.00, available: 70.00, icon: "🛢️" },
    { name: "Toor Dhall", unit: "Kg", allotted: 166.00, available: 112.20, icon: "🍱" },
    { name: "Palm Oil", unit: "Packets", allotted: 153.00, available: 114.00, icon: "🛢️" },
    { name: "OAP Rice", unit: "Kg", allotted: 20.00, available: 18.00, icon: "🍚" },
  ];

  return (
    <div className="ration-container">
      {/* Dynamic Background Elements */}
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      <header className="premium-header">
        <button onClick={() => router.back()} className="glass-back-btn">
          <ArrowLeft size={22} />
        </button>
        <div className="header-text">
          <h1 className="premium-title">Ration Center</h1>
          <p className="premium-subtitle">Digital Inventory & Info</p>
        </div>
      </header>

      <main className="premium-content scroll-area">
        {/* Shop Hero Section */}
        <section className="shop-hero-card">
          <div className="hero-gradient-overlay"></div>
          <div className="hero-content">
            <div className="hero-top">
              <div className="hero-avatar">
                <Store size={32} />
              </div>
              <div className="hero-status-pill">
                <div className="status-dot"></div>
                Open Now
              </div>
            </div>
            
            <h2 className="hero-shop-name">Roja Msuk Panamarathupalayam</h2>
            <div className="hero-shop-id">
              <Hash size={14} /> 31GW006P1 <span className="id-separator">|</span> <span className="id-type">Part Time (SHG)</span>
            </div>

            <div className="hero-quick-info">
              <div className="q-info-item">
                <User size={16} />
                <span>Manimekalai</span>
              </div>
              <div className="q-info-item">
                <Phone size={16} />
                <span>90XXXXXX57</span>
              </div>
            </div>
          </div>
          
          <div className="hero-bottom-info">
            <div className="hero-address">
              <MapPin size={18} />
              <p>Near Vinayagar Kovil, Panamarathupalayam, Pollachi (Tk), Coimbatore</p>
            </div>
            <div className="hero-timing">
              <Clock size={18} />
              <div className="time-slots">
                <span>09:00 AM - 01:00 PM</span>
                <span>02:00 PM - 06:00 PM</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="stats-grid-premium">
          <div className="stat-card-glass">
            <div className="stat-icon-wrap blue">
              <CreditCard size={20} />
            </div>
            <div className="stat-data">
              <span className="stat-value">204</span>
              <span className="stat-label">Family Cards</span>
            </div>
            <TrendingUp size={14} className="trend-icon" />
          </div>
          
          <div className="stat-card-glass">
            <div className="stat-icon-wrap green">
              <Users size={20} />
            </div>
            <div className="stat-data">
              <span className="stat-value">532</span>
              <span className="stat-label">Beneficiaries</span>
            </div>
            <TrendingUp size={14} className="trend-icon" />
          </div>
        </section>

        {/* Stock Inventory Section */}
        <section className="inventory-section">
          <div className="section-header-premium">
            <div className="header-left">
              <Box size={20} />
              <h3>Stock Inventory</h3>
            </div>
            <button className="info-btn">
              <Info size={16} />
            </button>
          </div>

          <div className="inventory-list-premium">
            {stockData.map((item, index) => {
              const percentage = Math.min(Math.round((item.available / item.allotted) * 100), 100);
              const isLow = percentage < 25;
              const isOverStock = item.available > item.allotted;

              return (
                <div key={index} className="inventory-item-glass">
                  <div className="item-header">
                    <div className="item-icon-box">{item.icon}</div>
                    <div className="item-main-info">
                      <div className="item-name-row">
                        <h4>{item.name}</h4>
                        {isLow && <span className="status-badge low">Low Stock</span>}
                        {isOverStock && <span className="status-badge high">Surplus</span>}
                      </div>
                      <p className="item-unit">{item.unit}</p>
                    </div>
                    <div className="item-value-box">
                      <span className="current-val">{item.available.toLocaleString()}</span>
                      <span className="allotted-val">/ {item.allotted.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="progress-container-premium">
                    <div 
                      className={`progress-bar-premium ${isLow ? 'low' : percentage > 70 ? 'high' : 'normal'}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    >
                      <div className="progress-shimmer"></div>
                    </div>
                  </div>
                  
                  <div className="item-footer">
                    <span className="percentage-text">{percentage}% Available</span>
                    <span className="update-tag">Updated 2h ago</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="safe-bottom-area"></div>
      </main>
    </div>
  );
}
