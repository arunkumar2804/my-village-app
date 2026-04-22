"use client";
import React, { useEffect, useState } from "react";
import {
  MapPin,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
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
import AnnouncementTicker from "@/components/AnnouncementTicker";
import * as store from "@/lib/store";
import { AdBanner } from "@/lib/types";

export default function Home() {
  const [userName, setUserName] = useState<string>("User");
  const [weatherData, setWeatherData] = useState<{ temp: number; code: number } | null>(null);
  const [adBanner, setAdBanner] = useState<AdBanner | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
       if (data.session?.user?.user_metadata?.full_name) {
          setUserName(data.session.user.user_metadata.full_name.split(" ")[0]);
       } else if (data.session?.user?.email) {
          setUserName(data.session.user.email.split("@")[0]);
       }
    });

    const loadData = async () => {
      // Load Ad Banner
      const ads = await store.getAdBanners();
      if (ads.length > 0) {
        setAdBanner(ads[0]);
      }

      // Load Weather
      try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=10.662&longitude=77.006&current_weather=true");
        const data = await res.json();
        if (data.current_weather) {
          setWeatherData({
            temp: Math.round(data.current_weather.temperature),
            code: data.current_weather.weathercode
          });
        }
      } catch (err) {
        console.error("Failed to fetch weather", err);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code <= 1) return <Sun size={16} />;
    if (code <= 3) return <Cloud size={16} />;
    if (code >= 51 && code <= 67) return <CloudRain size={16} />;
    if (code >= 80 && code <= 82) return <CloudRain size={16} />;
    if (code >= 95) return <CloudLightning size={16} />;
    return <Cloud size={16} />;
  };

  const services = [
    { iconSrc: "/icons/bus-icon.svg", label: "Bus\nSchedule", link: "/buses", class: "pill-bus" },
    { iconSrc: "/icons/train-icon.svg", label: "Train\nSchedule", link: "/trains", class: "pill-train" },
    { iconSrc: "/icons/panchayat-icon.svg", label: "Panchayat", class: "pill-panchayat" },
    { iconSrc: "/icons/water-tap-icon.svg", label: "Water\nTimings", class: "pill-water" },
    { iconSrc: "/icons/ration-icon.svg", label: "Ration\nStore", link: "/ration", class: "pill-ration" },
  ];

  return (
    <main className="scroll-area" style={{ padding: 0 }}>
      {/* Premium Header Section */}
      <header className="home-header">
        <div className="user-welcome-row">
          <div className="user-avatar">
            <span role="img" aria-label="user">👤</span>
          </div>
          <div className="welcome-text">
            <h2>Welcome, {userName}</h2>
            <div className="location-chip">
              <MapPin size={14} />
              <span>Panaimarathupalayam</span>
            </div>
          </div>
        </div>

        <div className="header-badges">
          <div className="header-badge" style={{ color: '#10b981' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }}></span>
            Live
          </div>
          <div className="header-badge">
            {weatherData ? getWeatherIcon(weatherData.code) : <Sun size={16} />}
            {weatherData ? `${weatherData.temp}°C` : "..."}
          </div>
        </div>

        {/* Dynamic Ad Banner Space */}
        <div className="ad-placeholder">
          {adBanner ? (
            <a href={adBanner.linkUrl || "#"} target="_blank" rel="noopener noreferrer" style={{ width: '100%', height: '100%' }}>
              <Image src={adBanner.imageUrl} alt="Advertisement" fill style={{ objectFit: 'cover' }} />
            </a>
          ) : (
            <div style={{ opacity: 0.3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Megaphone size={32} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>Your Ad Here</span>
            </div>
          )}
        </div>

        <div className="announcement-bar-minimal">
          <Megaphone size={16} />
          <span>No new announcements</span>
        </div>
      </header>

      {/* Services Horizontal Scroll */}
      <div className="home-services-scroll">
        {services.map((service, index) => {
          const Content = (
            <>
              <div className="pill-icon-circle">
                <div style={{ position: 'relative', width: 24, height: 24 }}>
                  <Image src={service.iconSrc} alt={service.label} fill style={{ objectFit: 'contain' }} />
                </div>
              </div>
              <span className="pill-label-text">{service.label}</span>
            </>
          );
          
          return service.link ? (
            <Link href={service.link} key={index} className={`service-pill ${service.class}`}>
              {Content}
            </Link>
          ) : (
            <div key={index} className={`service-pill ${service.class}`}>
              {Content}
            </div>
          );
        })}
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Live Updates</h3>
        <LiveUpdates />
      </div>

      <BottomNav />
    </main>
  );
}
