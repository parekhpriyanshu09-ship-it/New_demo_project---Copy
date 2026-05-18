import React, { useMemo } from "react";
import { Loader2, MapPinned, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDepartmentCounts } from "../../hooks/useDashboard";

const DISTRICT_UNITS = ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"];

export function DistrictUnitBarLineChart() {
  const { departments, loading } = useDepartmentCounts();

  const data = useMemo(() => {
    return departments.map((item, index) => ({
      unit: DISTRICT_UNITS[index] || item.department,
      hod: item.department,
      received: item.received ?? 0,
      pending: item.current ?? 0,
      disposalRate:
        item.received > 0
          ? Math.max(0, Math.round(((item.received - item.current) / item.received) * 100))
          : 0,
    }));
  }, [departments]);

  const totalReceived = data.reduce((sum, item) => sum + item.received, 0);
  const totalPending = data.reduce((sum, item) => sum + item.pending, 0);
  const avgDisposal = data.length
    ? Math.round(data.reduce((sum, item) => sum + item.disposalRate, 0) / data.length)
    : 0;

  return (
    <div className="glass-strong flex h-full min-h-[360px] flex-col rounded-2xl border-[#00c896]/20 p-5 text-[#063d33] dark:text-white">
      <div className="mb-4 flex flex-col gap-3 border-b border-[#00c896]/15 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <MapPinned className="h-4 w-4 text-[#00c896]" />
            <h3 className="text-lg font-extrabold tracking-tight">District Unit Wise Analysis</h3>
          </div>
          <p className="text-sm font-semibold text-[#063d33]/55 dark:text-white/55">
            Received volume, pending tapal, and disposal rate by unit
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Metric label="Received" value={totalReceived} />
          <Metric label="Pending" value={totalPending} />
          <Metric label="Rate" value={`${avgDisposal}%`} />
        </div>
      </div>

      <div className="relative flex-1 min-h-[250px]">
        {loading ? (
          <div className="flex h-full min-h-[250px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#00c896]" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full min-h-[250px] items-center justify-center text-sm font-semibold text-[#063d33]/55 dark:text-white/55">
            No district unit data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 2 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D4EEE9" />
              <XAxis
                dataKey="unit"
                axisLine={false}
                tickLine={false}
                interval={0}
                tick={{ fontSize: 12, fill: "#5f7182", fontWeight: 700 }}
              />
              <YAxis
                yAxisId="count"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#5f7182", fontWeight: 700 }}
              />
              <YAxis
                yAxisId="rate"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 12, fill: "#5f7182", fontWeight: 700 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(0, 200, 150, 0.08)" }}
                contentStyle={{
                  border: "1px solid rgba(0, 200, 150, 0.18)",
                  borderRadius: 12,
                  boxShadow: "0 18px 36px -24px rgba(17,45,72,0.45)",
                }}
                formatter={(value, name) => {
                  if (name === "disposalRate") return [`${value}%`, "Disposal rate"];
                  return [value, name === "received" ? "Received" : "Pending"];
                }}
                labelFormatter={(label, payload) => {
                  const hod = payload?.[0]?.payload?.hod;
                  return hod ? `${label} - ${hod}` : label;
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                formatter={(value) => {
                  if (value === "disposalRate") return "Disposal rate";
                  return value === "received" ? "Received" : "Pending";
                }}
              />
              <Bar yAxisId="count" dataKey="received" fill="#00c896" radius={[8, 8, 0, 0]} maxBarSize={34} />
              <Bar yAxisId="count" dataKey="pending" fill="#063d33" radius={[8, 8, 0, 0]} maxBarSize={34} />
              <Line
                yAxisId="rate"
                type="monotone"
                dataKey="disposalRate"
                stroke="#a9f5e4"
                strokeWidth={3}
                dot={{ r: 4, fill: "#063d33", stroke: "#a9f5e4", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#00c896", stroke: "#ffffff", strokeWidth: 2 }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-[#00c896]/15 bg-[#00c896]/[0.08] px-3 py-2">
      <div className="flex items-center justify-center gap-1 text-base font-black text-[#063d33] dark:text-white">
        {label === "Rate" && <TrendingUp className="h-3.5 w-3.5 text-[#00c896]" />}
        {value}
      </div>
      <div className="text-[10px] font-black uppercase tracking-wider text-[#063d33]/50 dark:text-white/50">
        {label}
      </div>
    </div>
  );
}
