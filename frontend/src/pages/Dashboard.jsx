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

const formatTime = (isoString) => {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Dashboard() {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedDateHasPatraks, setSelectedDateHasPatraks] = useState(false);
  const [selectedPatrakDetails, setSelectedPatrakDetails] = useState({
    entries: [],
    loading: false,
    formattedDate: "",
  });
  const [activeTab, setActiveTab] = useState("hod");

  const handleDateSelect = (dateStr) => {
    setSelectedDate((current) => (current === dateStr ? null : dateStr));
  };

  return (
    <Layout>
      <style>{`
        .dashboard-blue-scope {
          --text-color: #FFFFFF;
          --primary-deep: #063d33;
          --secondary-blue: #087a63;
          --accent-primary: #00c896;
          --accent-light: #18d6a8;
          --hover-light: #3ee7bd;
          --soft-highlight: #a9f5e4;
          --dashboard-header-gradient: linear-gradient(135deg, #063d33 0%, #087a63 30%, #00c896 62%, #3ee7bd 100%);
        }

        .dashboard-tab-shell {
          color: var(--text-color);
        }

        .dashboard-tabs {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          padding: 0 18px;
          background: transparent;
          border: 0;
          margin-bottom: -1px;
        }

        .dashboard-tab {
          position: relative;
          flex: 1 1 0;
          min-height: 64px;
          padding: 16px 20px;
          color: var(--text-color);
          font-size: 1.05rem;
          font-weight: 800;
          text-align: center;
          background: var(--primary-deep);
          border: 1px solid rgba(0, 200, 150, 0.55);
          border-bottom: 0;
          border-radius: 14px 14px 0 0;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
          transition: background 180ms ease, box-shadow 180ms ease, min-height 180ms ease;
        }

        .dashboard-tab:last-child {
          border-right: 1px solid rgba(0, 200, 150, 0.55);
        }

        .dashboard-tab:hover {
          background: var(--accent-light);
        }

        .dashboard-tab-active {
          background: var(--accent-primary);
          min-height: 76px;
          z-index: 2;
          border-color: rgba(169, 245, 228, 0.9);
          box-shadow: inset 0 4px 0 var(--soft-highlight), 0 -1px 0 var(--soft-highlight), 0 18px 34px -28px rgba(13, 61, 86, 0.95);
        }

        .dashboard-panel {
          min-height: calc(100dvh - 176px);
          padding: 28px;
          background: var(--dashboard-header-gradient);
          border: 1px solid rgba(0, 200, 150, 0.85);
          border-radius: 18px;
          box-shadow: 0 22px 54px -34px rgba(13, 61, 86, 0.95);
        }

        .dashboard-content-fill {
          min-height: calc(100dvh - 240px);
        }

        .dashboard-content-fill > .glass-strong,
        .dashboard-content-fill > [class*="glass-strong"] {
          min-height: inherit;
        }

        .dashboard-content-grid {
          min-height: calc(100dvh - 240px);
        }

        .dashboard-graph-equal {
          min-height: calc(100dvh - 260px);
        }

        .dashboard-graph-equal > * {
          height: 100%;
          min-height: inherit;
        }

        .dashboard-blue-scope .glass-strong,
        .dashboard-blue-scope [class*="glass-strong"] {
          background: rgba(6, 61, 51, 0.88) !important;
          border-color: rgba(0, 200, 150, 0.7) !important;
          color: var(--text-color) !important;
          box-shadow: 0 0 0 1px rgba(0, 200, 150, 0.2), 0 18px 44px -28px rgba(0, 200, 150, 0.8) !important;
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
          border-color: rgba(169, 245, 228, 0.42);
        }

        .dashboard-blue-scope button:not(.dashboard-tab):hover {
          background-color: var(--hover-light);
        }

        .dashboard-blue-scope [data-chart] {
          --color-inward: #063d33 !important;
          --color-outward: #a9f5e4 !important;
        }

        .dashboard-blue-scope .recharts-cartesian-grid line {
          stroke: rgba(169, 245, 228, 0.28);
        }

        .dashboard-blue-scope .recharts-text,
        .dashboard-blue-scope .recharts-legend-item-text {
          fill: rgba(255, 255, 255, 0.78) !important;
          color: rgba(255, 255, 255, 0.78) !important;
        }

        .dashboard-blue-scope .recharts-line-curve {
          stroke: #a9f5e4 !important;
        }

        .dashboard-blue-scope .recharts-dot {
          stroke: #a9f5e4 !important;
          fill: #00c896 !important;
        }

        .dashboard-blue-scope .recharts-bar-rectangle path,
        .dashboard-blue-scope .recharts-rectangle {
          stroke: rgba(169, 245, 228, 0.22);
        }

        .dashboard-selected-card {
          background: rgba(6, 61, 51, 0.9);
          border: 1px solid rgba(0, 200, 150, 0.75);
          color: var(--text-color);
          box-shadow: 0 0 0 1px rgba(0, 200, 150, 0.18), 0 18px 44px -28px rgba(6, 61, 51, 0.9);
        }

        .dashboard-detail-item {
          border: 1px solid rgba(169, 245, 228, 0.22);
          background: linear-gradient(135deg, rgba(0, 200, 150, 0.18), rgba(6, 61, 51, 0.68));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        @media (max-width: 768px) {
          .dashboard-tabs {
            flex-direction: column;
            align-items: stretch;
            gap: 0;
            padding: 0;
          }

          .dashboard-tab {
            min-height: 58px;
            border-right: 1px solid rgba(0, 200, 150, 0.55);
            border-bottom: 1px solid rgba(169, 245, 228, 0.28);
            border-radius: 0;
          }

          .dashboard-tab:last-child {
            border-bottom: 1px solid rgba(169, 245, 228, 0.28);
          }

          .dashboard-tab:first-child {
            border-radius: 14px 14px 0 0;
          }

          .dashboard-tab-active {
            min-height: 58px;
          }

          .dashboard-panel {
            min-height: calc(100dvh - 190px);
            padding: 16px;
            border-radius: 0 0 16px 16px;
          }

          .dashboard-content-fill,
          .dashboard-content-grid {
            min-height: calc(100dvh - 250px);
          }

          .dashboard-graph-equal {
            min-height: 420px;
          }
        }
      `}</style>

      <div className="dashboard-blue-scope flex min-h-[calc(100dvh-72px)] py-6">
        <section className="dashboard-tab-shell flex w-full flex-1 flex-col">
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

          <div id={`dashboard-panel-${activeTab}`} role="tabpanel" className="dashboard-panel flex-1">
            {activeTab === "hod" && (
              <div className="dashboard-content-grid grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="dashboard-graph-equal">
                  <AnalyticsCard selectedDate={selectedDate} />
                </div>
                <div className="dashboard-graph-equal">
                  <DistrictUnitBarLineChart />
                </div>
              </div>
            )}

            {activeTab === "day-month" && (
              <div className="dashboard-content-grid grid grid-cols-1 gap-6 xl:grid-cols-12">
                <div className="dashboard-content-fill xl:col-span-8">
                  <CalendarCard
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    onSelectedDateHasPatraksChange={setSelectedDateHasPatraks}
                    onSelectedDateEntriesChange={setSelectedPatrakDetails}
                    showInlineDetails={false}
                  />
                </div>
                <div className="dashboard-content-fill xl:col-span-4">
                  <div className="dashboard-selected-card flex h-full min-h-[260px] flex-col rounded-2xl p-6">
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

                    <div className="mt-5 rounded-xl border border-[#a9f5e4]/25 bg-[#00c896]/15 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white/75">Tapal details</p>
                        <span className="rounded-full bg-[#00c896] px-3 py-1 text-xs font-black text-[#063d33]">
                          {selectedPatrakDetails.entries.length} found
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-white/70">
                        {selectedPatrakDetails.formattedDate || "Select a date with an activity dot"}
                      </p>
                    </div>

                    <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
                      {selectedPatrakDetails.loading ? (
                        <div className="rounded-2xl border border-[#a9f5e4]/20 bg-white/10 p-4 text-sm font-semibold text-white/70">
                          Loading selected date details...
                        </div>
                      ) : selectedDateHasPatraks && selectedPatrakDetails.entries.length > 0 ? (
                        selectedPatrakDetails.entries.map((entry) => (
                          <div key={entry.id || entry.unique_id} className="dashboard-detail-item rounded-2xl p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-xs font-black uppercase tracking-widest text-[#a9f5e4]">
                                  {entry.unique_id}
                                </p>
                                <h4 className="mt-1 line-clamp-2 text-sm font-black leading-snug text-white">
                                  {entry.subject}
                                </h4>
                              </div>
                              <span className="shrink-0 rounded-full bg-white/12 px-2.5 py-1 text-xs font-black text-white">
                                {formatTime(entry.received_date)}
                              </span>
                            </div>
                            <div className="mt-4 grid grid-cols-1 gap-2 text-xs font-bold text-white/75">
                              <div className="flex items-center justify-between gap-3">
                                <span>Sender</span>
                                <span className="truncate text-right text-white">{entry.sender_name}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span>Department</span>
                                <span className="truncate text-right text-white">{entry.current_department}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span>Mode</span>
                                <span className="truncate text-right text-white">{entry.receiving_mode}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-[#a9f5e4]/35 bg-white/[0.08] p-5 text-sm font-semibold leading-relaxed text-white/72">
                          Pick a calendar date with a green dot to view its tapal details here.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "receiving-mode" && (
              <div className="dashboard-content-fill grid grid-cols-1">
                <DonutCard />
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
