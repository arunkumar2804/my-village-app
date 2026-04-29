"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Map, Info, Settings } from "lucide-react";

const BottomNav = () => {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Map, label: "Map", href: "/map" },
    { icon: Info, label: "Village info", href: "/info" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="bottom-nav-container">
      <nav className="bottom-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <div className={`nav-icon-wrapper ${isActive ? "nav-icon-active" : ""}`}>
                <div className="nav-icon-inner">
                  <Icon size={22} />
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
