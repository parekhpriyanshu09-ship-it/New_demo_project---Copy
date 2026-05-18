import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import { CalendarCard } from "../components/dashboard/CalendarCard";
import { AnalyticsCard } from "../components/dashboard/AnalyticsCard";
import { DonutCard } from "../components/dashboard/DonutCard";
import { DistrictUnitBarLineChart } from "../components/dashboard/DistrictUnitBarLineChart";

const dashboardTabs = [
  { id: "hod", label: "HOD wise tapal analysis" },
  { id: "day-month", label: "Day and month wise" },
  { id: "receiving-mode", label: "Mode of receiving" },
];

export default function Dashboard() {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedDateHasPatraks, setSelectedDateHasPatraks] = useState(false);
  const [activeTab, setActiveTab] = useState("hod");

  const handleDateSelect = (dateStr) => {
    setSelectedDate((current) => (current === dateStr ? null : dateStr));
  };

  return (
    <Layout>
      <style>{`
        .dashboard-blue-scope {
          --text-color: #FFFFFF;
          --primary-deep: #0d3d56;
          --secondary-blue: #11506f;
          --accent-primary: #006896;
          --accent-light: #1381ac;
          --hover-light: #23a3ca;
          --soft-highlight: #61c8e3;
          --dashboard-header-gradient: linear-gradient(135deg, #0d3d56 0%, #11506f 25%, #006896 50%, #1381ac 75%, #23a3ca 100%);
        }

        .dashboard-tab-shell {
          color: var(--text-color);
        }

        .dashboard-tabs {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          background: var(--primary-deep);
          border: 1px solid rgba(35, 163, 202, 0.75);
          border-bottom: 0;
          box-shadow: 0 18px 44px -32px rgba(13, 61, 86, 0.8);
        }

        .dashboard-tab {
          min-height: 76px;
          padding: 18px 20px;
          color: var(--text-color);
          font-size: 1.05rem;
          font-weight: 800;
          text-align: center;
          background: var(--primary-deep);
          border-right: 1px solid rgba(97, 200, 227, 0.32);
          transition: background 180ms ease, box-shadow 180ms ease, transform 180ms ease;
        }

        .dashboard-tab:last-child {
          border-right: 0;
        }

        .dashboard-tab:hover {
          background: var(--accent-light);
        }

        .dashboard-tab-active {
          background: var(--accent-primary);
          box-shadow: inset 0 4px 0 var(--soft-highlight), 0 -1px 0 var(--soft-highlight);
          transform: translateY(1px);
        }

        .dashboard-panel {
          min-height: 520px;
          padding: 28px;
          background: var(--dashboard-header-gradient);
          border: 1px solid rgba(35, 163, 202, 0.85);
          box-shadow: 0 22px 54px -34px rgba(13, 61, 86, 0.95);
        }

        .dashboard-blue-scope .glass-strong,
        .dashboard-blue-scope [class*="glass-strong"] {
          background: rgba(17, 80, 111, 0.92) !important;
          border-color: rgba(35, 163, 202, 0.7) !important;
          color: var(--text-color) !important;
          box-shadow: 0 0 0 1px rgba(35, 163, 202, 0.18), 0 18px 44px -28px rgba(35, 163, 202, 0.8) !important;
        }

        .dashboard-blue-scope .glass-strong:hover {
          border-color: var(--hover-light) !important;
        }

        .dashboard-blue-scope h3,
        .dashboard-blue-scope h4,
        .dashboard-blue-scope .text-brand-dark,
        .dashboard-blue-scope .text-slate-700,
        .dashboard-blue-scope .text-slate-800,
        .dashboard-blue-scope .text-slate-900 {
          color: var(--text-color) !important;
        }

        .dashboard-blue-scope .text-muted-foreground,
        .dashboard-blue-scope .text-brand-dark\\/50,
        .dashboard-blue-scope .text-brand-dark\\/55,
        .dashboard-blue-scope .text-brand-dark\\/60 {
          color: rgba(255, 255, 255, 0.72) !important;
        }

        .dashboard-blue-scope button:not(.dashboard-tab) {
          color: var(--text-color);
          background-color: var(--accent-primary);
          border-color: rgba(97, 200, 227, 0.42);
        }

        .dashboard-blue-scope button:not(.dashboard-tab):hover {
          background-color: var(--hover-light);
        }

        .dashboard-blue-scope [data-chart] {
          --color-inward: #0d3d56 !important;
          --color-outward: #61c8e3 !important;
        }

        .dashboard-blue-scope .recharts-cartesian-grid line {
          stroke: rgba(97, 200, 227, 0.28);
        }

        .dashboard-blue-scope .recharts-text,
        .dashboard-blue-scope .recharts-legend-item-text {
          fill: rgba(255, 255, 255, 0.78) !important;
          color: rgba(255, 255, 255, 0.78) !important;
        }

        .dashboard-blue-scope .recharts-line-curve {
          stroke: #61c8e3 !important;
        }

        .dashboard-blue-scope .recharts-dot {
          stroke: #61c8e3 !important;
          fill: #006896 !important;
        }

        .dashboard-blue-scope .recharts-bar-rectangle path,
        .dashboard-blue-scope .recharts-rectangle {
          stroke: rgba(97, 200, 227, 0.22);
        }

        .dashboard-selected-card {
          background: rgba(17, 80, 111, 0.92);
          border: 1px solid rgba(35, 163, 202, 0.75);
          color: var(--text-color);
          box-shadow: 0 0 0 1px rgba(35, 163, 202, 0.16), 0 18px 44px -28px rgba(13, 61, 86, 0.9);
        }

        @media (max-width: 768px) {
          .dashboard-tabs {
            grid-template-columns: 1fr;
          }

          .dashboard-tab {
            min-height: 58px;
            border-right: 0;
            border-bottom: 1px solid rgba(97, 200, 227, 0.28);
          }

          .dashboard-tab:last-child {
            border-bottom: 0;
          }

          .dashboard-panel {
            padding: 16px;
          }
        }
      `}</style>

      <div className="dashboard-blue-scope py-6">
        <section className="dashboard-tab-shell mx-auto w-full max-w-[1600px]">
          <div className="dashboard-tabs" role="tablist" aria-label="Dashboard analysis sections">
            {dashboardTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`dashboard-panel-${tab.id}`}
                className={`dashboard-tab ${activeTab === tab.id ? "dashboard-tab-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div id={`dashboard-panel-${activeTab}`} role="tabpanel" className="dashboard-panel">
            {activeTab === "hod" && (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <AnalyticsCard selectedDate={selectedDate} />
                <DistrictUnitBarLineChart />
              </div>
            )}

            {activeTab === "day-month" && (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                <div className="xl:col-span-8">
                  <CalendarCard
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    onSelectedDateHasPatraksChange={setSelectedDateHasPatraks}
                  />
                </div>
                <div className="xl:col-span-4">
                  <div className="dashboard-selected-card flex h-full min-h-[260px] flex-col justify-between rounded-2xl p-6">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-white/70">Selected Date</p>
                      <h3 className="mt-2 text-3xl font-black tracking-tight text-white">
                        {selectedDate
                          ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })
                          : "No date selected"}
                      </h3>
                    </div>
                    <div className="rounded-xl border border-[#23a3ca]/45 bg-[#006896]/45 p-4">
                      <p className="text-sm font-semibold text-white/75">Calendar status</p>
                      <p className="mt-1 text-xl font-black text-white">
                        {selectedDateHasPatraks ? "Patrak activity found" : "No patrak activity selected"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "receiving-mode" && (
              <div className="grid grid-cols-1">
                <DonutCard />
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
