import React from "react";
import {
  MapPin,
  Sun,
  Bus,
  TrainFront,
  Droplets,
  Landmark,
  Calendar,
  Waves,
  Store,
  Megaphone
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import LiveUpdates from "@/components/LiveUpdates";

export default function Home() {
  const services = [
    { iconSrc: "/icons/bus-icon.svg", label: "Bus Schedules", link: "/buses" },
    { iconSrc: "/icons/train-icon.svg", label: "Train Schedules" },
    { iconSrc: "/icons/water-tap-icon.svg", label: "Water timings" },
    { iconSrc: "/icons/panchayat-icon.svg", label: "Panchayat" },
    { iconSrc: "/icons/events-icon.svg", label: "Events" },
    { iconSrc: "/icons/canal-icon.svg", label: "PAP Canal info" },
    { iconSrc: "/icons/ration-icon.svg", label: "Ration Store" },
    { iconSrc: "/icons/announcement-icon.svg", label: "Announcements" },
  ];

  return (
    <main className="scroll-area">
      {/* Header */}
      <header className="location-header">
        <div className="location-title">
          <MapPin size={20} />
          <h1 className="village-name">Panaimarathupalayam</h1>
        </div>
        <div className="badge-container">
          <div className="badge live">
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', marginRight: '6px' }}></span>
            Live
          </div>
          <div className="badge">
            <Sun size={14} />
            33°C
          </div>
        </div>
      </header>

      {/* Services Grid */}
      <div className="service-grid">
        {services.map((service, index) => {
          const Content = (
            <>
              <div className="service-icon-box">
                <div style={{ position: 'relative', width: 28, height: 28 }}>
                  <Image src={service.iconSrc} alt={service.label} fill style={{ objectFit: 'contain' }} />
                </div>
              </div>
              <span className="service-label">{service.label}</span>
            </>
          );
          
          return service.link ? (
            <Link href={service.link} key={index} className="service-item" style={{ textDecoration: 'none' }}>
              {Content}
            </Link>
          ) : (
            <div key={index} className="service-item">
              {Content}
            </div>
          );
        })}
      </div>

      {/* Live Updates */}
      <LiveUpdates />

      <BottomNav />
    </main>
  );
}
