"use client";

import { ReactNode, useState } from "react";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({
  children,
}: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Fixed sidebar */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Main application area */}
      <div
        className={`
          min-h-screen
          transition-[margin] duration-300
          ${sidebarCollapsed ? "lg:ml-[76px]" : "lg:ml-[238px]"}
        `}
      >
        {/* Sticky navbar */}
        <Navbar
          onMenuClick={() =>
            setSidebarCollapsed((current) => !current)
          }
        />

        {/* Scrollable page content */}
        <main className="min-h-[calc(100vh-72px)] px-5 py-7 md:px-7 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}