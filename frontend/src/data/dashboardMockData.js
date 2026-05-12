const DEPARTMENTS = ["DG Office", "CID Crime", "Law & Order", "Training", "TS & SCRB"];
const RECEIVING_MODES = ["Physical", "Mails", "Fax"];

const pad = (value) => String(value).padStart(2, "0");

export const toDateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const addDays = (date, offset) => {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
};

const atTime = (date, hours, minutes) => {
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next.toISOString();
};

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth() + 1;

const ENTRY_SEEDS = [
  ["Crime statistics review and monthly compilation", "A. K. Sharma", "Deputy SP", "DG Office", "Physical", "Active", 3, [10, 20]],
  ["Cyber cell case forwarding report", "Meera Patel", "Inspector", "CID Crime", "Mails", "Active", 5, [14, 10]],
  ["Law and order deployment note", "R. K. Solanki", "ACP", "Law & Order", "Physical", "Active", 8, [11, 45]],
  ["Training roster approval", "Nisha Desai", "PI", "Training", "Fax", "Closed", 8, [16, 5]],
  ["SCRB application access request", "Vikram Jadeja", "PSI", "TS & SCRB", "Mails", "Active", 10, [9, 30]],
  ["Confidential branch movement register", "H. M. Trivedi", "Office Superintendent", "CID Crime", "Physical", "Active", 10, [15, 25]],
  ["District inspection compliance memo", "Pooja Rathod", "DySP", "DG Office", "Physical", "Closed", 12, [12, 0]],
  ["Email trail for missing records", "Ketan Shah", "Head Clerk", "TS & SCRB", "Mails", "Active", 14, [10, 50]],
  ["Public order advisory acknowledgement", "Sonal Joshi", "Inspector", "Law & Order", "Fax", "Closed", 16, [13, 15]],
  ["Training feedback summary", "Jay Mehta", "Training Officer", "Training", "Physical", "Active", 18, [9, 5]],
  ["Pending verification queue", "Control Room", "Duty Officer", "DG Office", "Mails", "Active", 2, [10, 0]],
  ["Special branch security report", "Suresh Kumar", "Inspector", "DG Office", "Physical", "Active", 6, [9, 15]],
  ["Budget allocation request", "Anil Patel", "Accountant", "TS & SCRB", "Physical", "Active", 9, [11, 30]],
  ["Personnel transfer order", "Ramesh Mishra", "SP", "Law & Order", "Mails", "Active", 11, [14, 0]],
  ["Crime branch monthly report", "Ashok Singh", "ACP", "CID Crime", "Physical", "Active", 15, [16, 45]],
];

export const mockDashboardEntries = ENTRY_SEEDS.map((seed, index) => {
  const [
    subject,
    senderName,
    senderDesignation,
    currentDepartment,
    receivingMode,
    status,
    day,
    time,
  ] = seed;
  const entryDate = new Date(currentYear, currentMonth - 1, day);
  const createdAtDate = new Date(currentYear, currentMonth - 1, day);

  return {
    id: index + 1,
    unique_id: `PTRK-${toDateKey(entryDate).replaceAll("-", "")}-${String(index + 1).padStart(3, "0")}`,
    subject,
    sender_name: senderName,
    sender_designation: senderDesignation,
    current_department: currentDepartment,
    receiving_mode: receivingMode,
    status,
    received_date: atTime(entryDate, time[0], time[1]),
    created_at: atTime(createdAtDate, time[0], time[1]),
    description: `${subject} submitted by ${senderName} for ${currentDepartment}.`,
  };
});

const countBy = (items, getKey) =>
  items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});

export function getMockDashboardStats() {
  const departmentCounts = DEPARTMENTS.reduce((counts, department) => {
    counts[department] = 0;
    return counts;
  }, {});

  mockDashboardEntries.forEach((entry) => {
    departmentCounts[entry.current_department] += 1;
  });

  return {
    total_entries: mockDashboardEntries.length,
    active_entries: mockDashboardEntries.filter((entry) => entry.status !== "Closed").length,
    closed_entries: mockDashboardEntries.filter((entry) => entry.status === "Closed").length,
    department_counts: departmentCounts,
  };
}

export function getMockCalendarDates(month, year, viewType = "inward") {
  const counts = countBy(mockDashboardEntries, (entry) => {
    const baseDate = new Date(entry.created_at);
    return toDateKey(baseDate);
  });

  return Object.entries(counts)
    .filter(([date]) => {
      const parsed = new Date(`${date}T00:00:00`);
      return parsed.getMonth() + 1 === month && parsed.getFullYear() === year;
    })
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getMockDateChart(date = null, viewType = "inward", days = 14) {
  const target = date ? new Date(`${date}T00:00:00`) : new Date(currentYear, currentMonth - 1, today.getDate());
  const calendarCounts = countBy(mockDashboardEntries, (entry) => {
    const baseDate = new Date(entry.created_at);
    return toDateKey(baseDate);
  });

  return Array.from({ length: days }, (_, index) => {
    const current = addDays(target, -(days - 1 - index));
    const dateKey = toDateKey(current);
    return {
      date: dateKey,
      count: calendarCounts[dateKey] || 0,
    };
  });
}

export function getMockDepartmentCounts() {
  return DEPARTMENTS.map((department) => {
    const current = mockDashboardEntries.filter((entry) => entry.current_department === department).length;
    return {
      department,
      received: current + (department === "DG Office" ? 4 : 2),
      current,
    };
  });
}

export function getMockReceivingModes() {
  const counts = RECEIVING_MODES.reduce((acc, mode) => {
    acc[mode] = 0;
    return acc;
  }, {});

  mockDashboardEntries.forEach((entry) => {
    counts[entry.receiving_mode] += 1;
  });

  return RECEIVING_MODES.map((mode) => ({
    mode,
    count: counts[mode],
  }));
}
