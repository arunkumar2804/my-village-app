"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const BottomNav = () => {
  const pathname = usePathname();

  const navItems = [
    { iconSrc: "/icons/Home-icon.svg", label: "Home", href: "/" },
    { iconSrc: "/icons/map-icon.svg", label: "Map", href: "/map" },
    { iconSrc: "/icons/village-info-icon.svg", label: "Village info", href: "/info" },
    { iconSrc: "/icons/settings-icon.svg", label: "Settings", href: "/settings" },
  ];

  return (
    <div className="bottom-nav-container">
      <nav className="bottom-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <div className={`nav-icon-wrapper ${isActive ? "nav-icon-active" : ""}`}>
                <div style={{ position: 'relative', width: 22, height: 22 }}>
                   <Image src={item.iconSrc} alt={item.label} fill style={{ objectFit: 'contain' }} />
                </div>
              </div>
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
