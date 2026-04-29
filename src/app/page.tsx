"use client";
import React, { useEffect, useState } from "react";
import {
  MapPin,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  ChevronRight,
  Bus,
  Train,
  Droplets,
  Landmark,
  Ticket,
  CalendarDays,
  Waves,
  Megaphone,
} from "lucide-react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import LiveUpdates from "@/components/LiveUpdates";
import AnnouncementTicker from "@/components/AnnouncementTicker";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [userName, setUserName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [weatherData, setWeatherData] = useState<{ temp: number; code: number } | null>(null);
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    // Determine greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    supabase.auth.getSession().then(({ data }) => {
       if (data.session?.user?.user_metadata?.full_name) {
          setUserName(data.session.user.user_metadata.full_name.split(" ")[0]);
       } else if (data.session?.user?.email) {
          setUserName(data.session.user.email.split("@")[0]);
       }
       if (data.session?.user?.user_metadata?.avatar_url) {
          setAvatarUrl(data.session.user.user_metadata.avatar_url);
       }
    });

    const fetchWeather = async () => {
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

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
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

  const quickServices = [
    { icon: Bus, label: "Bus", link: "/buses", color: "#10b981", bg: "#ecfdf5" },
    { icon: Train, label: "Train", link: "/trains", color: "#6366f1", bg: "#eef2ff" },
    { icon: Droplets, label: "Water", link: "/water", color: "#06b6d4", bg: "#ecfeff" },
    { icon: Ticket, label: "Ration", link: "/ration", color: "#ec4899", bg: "#fdf2f8" },
  ];

  const moreServices = [
    { icon: Landmark, label: "Panchayat", color: "#8b5cf6", bg: "#f5f3ff" },
    { icon: CalendarDays, label: "Events", color: "#f59e0b", bg: "#fffbeb" },
    { icon: Waves, label: "Canal", color: "#0ea5e9", bg: "#f0f9ff" },
    { icon: Megaphone, label: "News", color: "#ef4444", bg: "#fef2f2" },
  ];

  return (
    <main className="scroll-area home-page">
      {/* ─── Premium Hero Header ─── */}
      <header className="hero-header">
        <div className="hero-header-bg" />
        <div className="hero-content">
          <div className="hero-top-row">
            <div className="hero-user-info">
              <div className="hero-avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" />
                ) : (
                  <span>👤</span>
                )}
              </div>
              <div>
                <p className="hero-greeting">{greeting}</p>
                <h1 className="hero-name">{userName || "There"}</h1>
              </div>
            </div>
            <div className="hero-weather-pill">
              {weatherData ? getWeatherIcon(weatherData.code) : <Sun size={16} />}
              <span>{weatherData ? `${weatherData.temp}°` : "..."}</span>
            </div>
          </div>

          <div className="hero-location-row">
            <div className="hero-location-pill">
              <MapPin size={13} />
              <span>Panaimarathupalayam</span>
            </div>
            <div className="hero-live-badge">
              <span className="hero-live-dot" />
              Live
            </div>
          </div>
        </div>
      </header>

      {/* ─── Announcement Ticker ─── */}
      <AnnouncementTicker />

      {/* ─── Quick Access Services ─── */}
      <section className="quick-access-section">
        <div className="section-header">
          <h2 className="section-heading">Quick Access</h2>
        </div>
        <div className="quick-access-grid">
          {quickServices.map((service, index) => {
            const Icon = service.icon;
            const inner = (
              <div className="qa-card" key={index}>
                <div className="qa-icon-ring" style={{ background: service.bg, borderColor: service.color + '20' }}>
                  <Icon size={24} style={{ color: service.color }} />
                </div>
                <span className="qa-label">{service.label}</span>
              </div>
            );
            return service.link ? (
              <Link href={service.link} key={index} className="qa-link">{inner}</Link>
            ) : (
              <div key={index} className="qa-link">{inner}</div>
            );
          })}
        </div>
      </section>

      {/* ─── More Services ─── */}
      <section className="more-services-section">
        <div className="section-header">
          <h2 className="section-heading">Explore</h2>
        </div>
        <div className="more-services-scroll">
          {moreServices.map((service, index) => {
            const Icon = service.icon;
            const inner = (
              <div className="ms-chip" style={{ background: service.bg }}>
                <div className="ms-chip-icon">
                  <Icon size={18} style={{ color: service.color }} />
                </div>
                <span className="ms-chip-label" style={{ color: service.color }}>{service.label}</span>
                <ChevronRight size={14} style={{ color: service.color, opacity: 0.5 }} />
              </div>
            );
            return service.link ? (
              <Link href={service.link} key={index} className="ms-chip-link">{inner}</Link>
            ) : (
              <div key={index} className="ms-chip-link">{inner}</div>
            );
          })}
        </div>
      </section>

      {/* ─── Live Updates ─── */}
      <section className="live-updates-section">
        <LiveUpdates />
      </section>

      <BottomNav />
    </main>
  );
}
