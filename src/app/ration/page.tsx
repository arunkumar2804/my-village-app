"use client";

import React from "react";
import { ArrowLeft, User, MapPin, Clock, Phone, Hash, CreditCard, Users, Box, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import "./ration.css";

export default function RationPage() {
  const router = useRouter();

  const stockData = [
    { name: "Rice - General", unit: "Kg", allotted: "1,026.00", available: "894.00", icon: "🍚" },
    { name: "Rice - AAY", unit: "Kg", allotted: "1,250.00", available: "854.06", icon: "🍚" },
    { name: "Rice - PHH", unit: "Kg", allotted: "646.00", available: "675.00", icon: "🍚" },
    { name: "Sugar", unit: "Kg", allotted: "173.00", available: "134.00", icon: "🍬" },
    { name: "AAY Sugar", unit: "Kg", allotted: "51.50", available: "37.50", icon: "🍬" },
    { name: "Wheat", unit: "Kg", allotted: "199.00", available: "50.00", icon: "🌾" },
    { name: "Kerosene", unit: "Litre", allotted: "0.00", available: "70.00", icon: "🛢️" },
    { name: "Toor Dhall", unit: "Kg", allotted: "166.00", available: "112.20", icon: "🍱" },
    { name: "Palm Oil", unit: "Packets", allotted: "153.00", available: "114.00", icon: "🛢️" },
    { name: "OAP Rice", unit: "Kg", allotted: "5.00", available: "18.00", icon: "🍚" },
  ];

  return (
    <div className="ration-page">
      <header className="ration-header">
        <button onClick={() => router.back()} className="back-button">
          <ArrowLeft size={20} />
        </button>
        <h1 className="ration-title">Fair Price Shop</h1>
      </header>

      <main className="ration-content scroll-area">
        <section className="ration-card info-card">
          <h2 className="card-heading">
            <Store size={18} className="heading-icon" /> Shop Profile
          </h2>
          <div className="info-grid">
            <div className="info-item full-width">
              <span className="info-label">Shop Name</span>
              <span className="info-value">Roja Msuk Panamarathupalayam</span>
            </div>
            <div className="info-item">
              <span className="info-label"><Hash size={14} className="inline-icon"/> Code</span>
              <span className="info-value">31GW006P1</span>
            </div>
            <div className="info-item">
              <span className="info-label">Type & Agency</span>
              <span className="info-value">Part Time (SHG)</span>
            </div>
            <div className="info-item full-width">
              <span className="info-label"><User size={14} className="inline-icon"/> Incharge</span>
              <span className="info-value">Manimekalai</span>
            </div>
            <div className="info-item full-width">
              <span className="info-label"><Phone size={14} className="inline-icon"/> Contact</span>
              <span className="info-value">90XXXXXX57</span>
            </div>
            <div className="info-item full-width">
              <span className="info-label"><MapPin size={14} className="inline-icon"/> Address</span>
              <span className="info-value">Near Vinayagar Kovil, Panamarathupalayam, Pollachi (Tk), Coimbatore - 642107</span>
            </div>
            <div className="info-item full-width">
              <span className="info-label"><Clock size={14} className="inline-icon"/> Operating Hours</span>
              <span className="info-value">Morning: 09:00 AM - 01:00 PM<br/>Afternoon: 02:00 PM - 06:00 PM</span>
            </div>
          </div>
        </section>

        <section className="ration-card stats-card">
          <h2 className="card-heading">
            <Users size={18} className="heading-icon" /> Beneficiary Stats
          </h2>
          <div className="stats-row">
            <div className="stat-box">
              <CreditCard size={20} className="stat-icon" />
              <div className="stat-number">204</div>
              <div className="stat-text">Family Cards</div>
            </div>
            <div className="stat-box">
              <Users size={20} className="stat-icon" />
              <div className="stat-number">532</div>
              <div className="stat-text">Total Bene.</div>
            </div>
          </div>
          <p className="stat-subtext">Aadhaar Registered: 536 (101%) | Mobile Registered: 204 (100%)</p>
        </section>

        <section className="ration-card stock-card">
          <h2 className="card-heading">
            <Box size={18} className="heading-icon" /> Current Stock Levels
          </h2>
          <div className="stock-list">
            {stockData.map((item, index) => {
              const available = parseFloat(item.available.replace(",", ""));
              return (
                <div key={index} className="stock-row">
                  <div className="stock-icon-wrapper">{item.icon}</div>
                  <div className="stock-details">
                    <div className="stock-name">{item.name}</div>
                    <div className="stock-allocation">Allotted: {item.allotted} {item.unit}</div>
                  </div>
                  <div className={`stock-amount ${available > 0 ? "stock-in" : "stock-out"}`}>
                    <span className="amount-num">{item.available}</span>
                    <span className="amount-unit">{item.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        
        <div style={{ height: "40px" }}></div>
      </main>
    </div>
  );
}
