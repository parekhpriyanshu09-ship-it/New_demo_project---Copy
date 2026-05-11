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
  const [selectedDateHasPatraks, setSelectedDateHasPatraks] = useState(false);
  const showSelectedPatrak = selectedDate && selectedDateHasPatraks;

  const handleDateSelect = (dateStr) => {
    setSelectedDate((current) => (current === dateStr ? null : dateStr));
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-stretch">
        <div className="lg:col-span-7">
          <AnalyticsCard selectedDate={selectedDate} />
        </div>

        <div className={`lg:col-span-5 ${showSelectedPatrak ? "lg:row-span-2" : ""}`}>
          <CalendarCard
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onSelectedDateHasPatraksChange={setSelectedDateHasPatraks}
          />
        </div>

        <div className={showSelectedPatrak ? "lg:col-span-7" : "lg:col-span-12"}>
          <DonutCard />
        </div>
      </div>
    </Layout>
  );
}
