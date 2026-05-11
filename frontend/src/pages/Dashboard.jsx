import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import { StatCards } from "../components/dashboard/StatCards";
import { CalendarCard } from "../components/dashboard/CalendarCard";
import { AnalyticsCard } from "../components/dashboard/AnalyticsCard";
import { DonutCard } from "../components/dashboard/DonutCard";
import { QuickActions } from "../components/dashboard/QuickActions";

export default function Dashboard() {
  // Shared selected date state (YYYY-MM-DD) — drives both calendar highlight and bar chart data
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);

  return (
    <Layout>
      {/* Top spacing */}
      <div className="h-2" />

      {/* KPI Stats Panel - Sits elegantly at the top */}
      <StatCards />

      {/* Quick Actions Section - Placed right below the top cards panel */}
      <div className="mt-6">
        <QuickActions />
      </div>

      {/* Main Grid: Left column has stacked Analytics and Donut cards, Right column has Calendar card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-stretch">
        {/* Left Column: Stacked Bar Chart & Donut Chart */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <AnalyticsCard selectedDate={selectedDate} />
          <DonutCard />
        </div>
        
        {/* Right Column: Calendar Widget */}
        <div className="lg:col-span-5">
          <CalendarCard selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        </div>
      </div>
    </Layout>
  );
}
