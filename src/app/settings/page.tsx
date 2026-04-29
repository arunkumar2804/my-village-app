"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/lib/store";
import BottomNav from "@/components/BottomNav";
import { User, Mail, Shield, Bell, Moon, Info, LogOut, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [canSeeAdminConsole, setCanSeeAdminConsole] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    name: string;
    email: string;
    avatar: string;
    id: string;
  } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        const isMasterAdmin = session.user.email === "arunkumail29@gmail.com";
        const isAdminUser = profile?.role === "admin" || profile?.is_admin;
        setCanSeeAdminConsole(Boolean(isMasterAdmin || isAdminUser));
        setUserInfo({
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          avatar: session.user.user_metadata?.avatar_url || "",
          id: session.user.id
        });
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserInfo({
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          avatar: session.user.user_metadata?.avatar_url || "",
          id: session.user.id
        });
        getProfile(session.user.id).then((profile) => {
          const isMasterAdmin = session.user.email === "arunkumail29@gmail.com";
          const isAdminUser = profile?.role === "admin" || profile?.is_admin;
          setCanSeeAdminConsole(Boolean(isMasterAdmin || isAdminUser));
        });
      } else {
        setUserInfo(null);
        setCanSeeAdminConsole(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <main className="scroll-area">
      <div className="settings-page">
        <h1 className="settings-heading">Settings</h1>

        {/* ─── Profile Header ─── */}
        <div className="settings-profile-card">
          <div className="profile-avatar-wrap">
            {userInfo?.avatar ? (
              <img src={userInfo.avatar} alt="Profile" />
            ) : (
              <div className="profile-placeholder">
                <User size={32} />
              </div>
            )}
          </div>
          <div className="profile-info">
            <h2>{userInfo?.name || "Loading..."}</h2>
            <div className="profile-email">
              <Mail size={14} />
              <span>{userInfo?.email || "..."}</span>
            </div>
          </div>
        </div>

        {canSeeAdminConsole && (
          <div className="settings-group">
            <div className="settings-group-label">Management</div>
            <Link href="/admin" className="settings-row">
              <div className="settings-row-icon admin-icon">
                <Shield size={20} color="white" />
              </div>
              <div className="settings-row-body">
                <div className="settings-row-title">Admin Console</div>
                <div className="settings-row-desc">Manage bus, train, water & more</div>
              </div>
              <ChevronRight className="settings-row-arrow" size={20} />
            </Link>
          </div>
        )}

        <div className="settings-group">
          <div className="settings-group-label">App</div>
          <Link href="/notifications" className="settings-row">
            <div className="settings-row-icon">
              <Bell size={20} />
            </div>
            <div className="settings-row-body">
              <div className="settings-row-title">Notifications</div>
              <div className="settings-row-desc">View admin notifications</div>
            </div>
            <ChevronRight className="settings-row-arrow" size={20} />
          </Link>
          <div className="settings-row">
            <div className="settings-row-icon">
              <Moon size={20} />
            </div>
            <div className="settings-row-body">
              <div className="settings-row-title">Appearance</div>
              <div className="settings-row-desc">Coming soon</div>
            </div>
            <ChevronRight className="settings-row-arrow" size={20} />
          </div>
          <div className="settings-row">
            <div className="settings-row-icon">
              <Info size={20} />
            </div>
            <div className="settings-row-body">
              <div className="settings-row-title">About</div>
              <div className="settings-row-desc">My Village App v1.2</div>
            </div>
            <ChevronRight className="settings-row-arrow" size={20} />
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-group-label">Account</div>
          <div className="settings-row logout" onClick={handleLogout} style={{ cursor: "pointer" }}>
            <div className="settings-row-icon logout-icon">
              <LogOut size={20} color="#ef4444" />
            </div>
            <div className="settings-row-body">
              <div className="settings-row-title" style={{ color: "#ef4444" }}>Log Out</div>
              <div className="settings-row-desc">Sign out of your account</div>
            </div>
          </div>
        </div>

        <div className="settings-credits">
          <p>Made with ❤️ by Arun Kumar</p>
          <span>Panaimarathupalayam Community</span>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
