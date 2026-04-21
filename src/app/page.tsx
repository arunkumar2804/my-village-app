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
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [userName, setUserName] = useState<string>("");
  const [weatherData, setWeatherData] = useState<{ temp: number; code: number } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
       if (data.session?.user?.user_metadata?.full_name) {
          setUserName(data.session.user.user_metadata.full_name.split(" ")[0]);
       } else if (data.session?.user?.email) {
          setUserName(data.session.user.email.split("@")[0]);
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
    // Refresh weather every 30 mins
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code <= 1) return <Sun size={14} />;
    if (code <= 3) return <Cloud size={14} />;
    if (code >= 51 && code <= 67) return <CloudRain size={14} />;
    if (code >= 80 && code <= 82) return <CloudRain size={14} />;
    if (code >= 95) return <CloudLightning size={14} />;
    return <Cloud size={14} />;
  };

  const services = [
    { iconSrc: "/icons/bus-icon.svg", label: "Bus Schedules", link: "/buses" },
    { iconSrc: "/icons/train-icon.svg", label: "Train Schedules", link: "/trains" },
    { iconSrc: "/icons/water-tap-icon.svg", label: "Water timings" },
    { iconSrc: "/icons/panchayat-icon.svg", label: "Panchayat" },
    { iconSrc: "/icons/events-icon.svg", label: "Events" },
    { iconSrc: "/icons/canal-icon.svg", label: "PAP Canal info" },
    { iconSrc: "/icons/ration-icon.svg", label: "Ration Store", link: "/ration" },
    { iconSrc: "/icons/announcement-icon.svg", label: "Announcements" },
  ];

  return (
    <main className="scroll-area">
      {/* Header */}
      <header className="location-header">
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {userName && (
            <div style={{ fontSize: "10px", color: "var(--text-light)", fontStyle: "italic", marginLeft: "28px" }}>
              Welcome {userName},
            </div>
          )}
          <div className="location-title">
            <MapPin size={20} />
            <h1 className="village-name">Panaimarathupalayam</h1>
          </div>
        </div>
        <div className="badge-container">
          <div className="badge live">
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', marginRight: '6px' }}></span>
            Live
          </div>
          <div className="badge">
            {weatherData ? getWeatherIcon(weatherData.code) : <Sun size={14} />}
            {weatherData ? `${weatherData.temp}°C` : "..."}
          </div>
        </div>
      </header>

      {/* Announcements */}
      <AnnouncementTicker />

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
