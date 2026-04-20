"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getProfile, upsertProfile } from "@/lib/store";
import type { Profile } from "@/lib/types";
import { Phone, ArrowRight, ShieldCheck, MapPin } from "lucide-react";
import "./auth.css";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 1. Check current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionUser(session.user);
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen to login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSessionUser(session.user);
        fetchProfile(session.user);
      } else {
        setSessionUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (user: User) => {
    setLoading(true);
    const existing = await getProfile(user.id);
    if (existing) {
      setProfile(existing);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // This makes it instantly redirect back to our app securely
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
        },
      });
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const processOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionUser) return;
    if (phone.length < 10) return alert("Please enter a valid mobile number.");

    setSaving(true);
    const newDoc: Profile = {
      id: sessionUser.id,
      email: sessionUser.email as string,
      full_name: sessionUser.user_metadata?.full_name || "Resident",
      avatar_url: sessionUser.user_metadata?.avatar_url || "",
      phone_number: phone,
    };

    const saved = await upsertProfile(newDoc);
    if (saved) {
      setProfile(saved);
    } else {
      alert("Failed to save profile. Did you run the SQL to create the profiles table?");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="auth-fullscreen flex-center flex-col gap-4">
        <div className="spinner-large"></div>
        <p style={{ color: "var(--text-light)" }}>Loading My Village...</p>
      </div>
    );
  }

  // State A: Not logged in at all (Show Google Sign In)
  if (!sessionUser) {
    return (
      <div className="auth-fullscreen flex-center">
        <div className="auth-card">
          <div className="auth-icon-box">
            <MapPin size={32} color="var(--primary)" />
          </div>
          <h1>Welcome to My Village</h1>
          <p>Join the community to get real-time bus schedules, water updates, and local announcements.</p>
          
          <button className="btn-google" onClick={handleGoogleLogin}>
            <div className="google-icon-wrapper">
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            Sign in with Google
          </button>
          
          <div className="auth-footer">
            <ShieldCheck size={14} />
            <span>Secure connection via Supabase Auth</span>
          </div>
        </div>
      </div>
    );
  }

  // State B: Logged in, but hasn't entered Phone Number (Onboarding)
  if (sessionUser && (!profile || !profile.phone_number)) {
    return (
      <div className="auth-fullscreen flex-center">
        <div className="auth-card">
          <div className="auth-avatar-box">
            {sessionUser.user_metadata?.avatar_url ? (
              <img src={sessionUser.user_metadata.avatar_url} alt="Profile" className="auth-avatar" />
            ) : (
              <div className="auth-avatar-placeholder">{sessionUser.email?.slice(0, 1).toUpperCase()}</div>
            )}
          </div>
          <h1>Almost done!</h1>
          <p>Hi {sessionUser.user_metadata?.full_name?.split(" ")[0] || "there"}! Please provide your WhatsApp number for community announcements.</p>
          
          <form className="onboarding-form" onSubmit={processOnboarding}>
            <div className="onboarding-input-wrap">
              <Phone size={18} className="input-icon" />
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                minLength={10}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Creating Profile..." : "Complete Setup"}
              {!saving && <ArrowRight size={18} />}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // State C: Fully authenticated and onboarded! Render the actual App!
  return <>{children}</>;
}
