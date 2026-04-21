"use client";

import React, { useEffect, useState } from "react";
import { Share, PlusSquare, MoreVertical } from "lucide-react";

export default function InstallPrompt({ children }: { children: React.ReactNode }) {
  const [isStandalone, setIsStandalone] = useState<boolean | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if running in standalone mode (PWA)
    const checkStandalone = () => {
      return (
        (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
        // @ts-ignore iOS Safari proprietary attribute
        window.navigator.standalone === true
      );
    };

    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const isDevPassed = window.location.search.includes("dev=true");

    if (isLocalhost || isDevPassed) {
      setIsStandalone(true);
    } else {
      setIsStandalone(checkStandalone());
    }

    // Optional: listen for display-mode change
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Don't override if dev mode bypass is active
      if (!isLocalhost && !isDevPassed) {
        setIsStandalone(e.matches);
      }
    };
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }
  }, []);

  // Prevent flicker
  if (isStandalone === null) {
      return null;
  }

  if (isStandalone) {
      return <>{children}</>;
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", backgroundColor: "var(--background, #f1f5f9)", color: "var(--foreground, #111)",
      padding: "20px", textAlign: "center", fontFamily: "var(--font-sans)"
    }}>
      <div style={{
        background: "var(--card-bg, #fff)", padding: "32px 24px", borderRadius: "24px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.1)", maxWidth: "400px", width: "100%"
      }}>
        <div style={{ 
          width: 80, height: 80, background: "linear-gradient(135deg, var(--primary, #10b981), #059669)", color: "#fff", 
          borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
        }}>
          <span style={{ fontSize: "40px", fontWeight: "bold" }}>V</span>
        </div>
        
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "12px", letterSpacing: "-0.5px" }}>Install App to Continue</h1>
        <p style={{ fontSize: "15px", color: "var(--text-muted, #6b7280)", marginBottom: "32px", lineHeight: 1.5 }}>
          For the best experience, My Village App needs to be installed on your home screen.
        </p>

        {isIOS ? (
          <div style={{ textAlign: "left", background: "var(--background, #f8fafc)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px", display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: "var(--foreground, #111)", color: "var(--background, #fff)", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", flexShrink: 0 }}>1</span>
              Tap the Share button below
              <Share size={18} style={{ marginLeft: "auto", color: "var(--primary)" }} />
            </p>
            <p style={{ fontSize: "14px", fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: "var(--foreground, #111)", color: "var(--background, #fff)", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", flexShrink: 0 }}>2</span>
              Select <strong>Add to Home Screen</strong>
              <PlusSquare size={18} style={{ marginLeft: "auto", color: "var(--primary)" }} />
            </p>
          </div>
        ) : (
          <div style={{ textAlign: "left", background: "var(--background, #f8fafc)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px", display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: "var(--foreground, #111)", color: "var(--background, #fff)", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", flexShrink: 0 }}>1</span>
              Tap the browser menu 
              <MoreVertical size={18} style={{ marginLeft: "auto", color: "var(--primary)" }} />
            </p>
            <p style={{ fontSize: "14px", fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: "var(--foreground, #111)", color: "var(--background, #fff)", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", flexShrink: 0 }}>2</span>
              Select <strong>Install app</strong>
              <PlusSquare size={18} style={{ marginLeft: "auto", color: "var(--primary)" }} />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
