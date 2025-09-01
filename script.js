// 🔑 Replace with your Sheet ID
const SHEET_ID = "19x7OzxLlfG5YarEgksoX-drLaf12Ci98JpYkBvQpoMI";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

let rawData = [];
let filteredData = [];
let leaderboardChart, progressChart, meetingSummaryChart, roleBreakdownChart, clubProgressChart;

Papa.parse(CSV_URL, {
  download: true,
  header: true,
  complete: (results) => {
    rawData = results.data.filter(r => r["Member"] || r["Name"]);
    initFilters();
    applyFilters();
  }
});

// Initialize dropdowns
function initFilters() {
  const memberSelect = document.getElementById("memberFilter");
  const roleSelect = document.getElementById("roleFilter");

  // Members
  const members = [...new Set(rawData.map(r => r["Member"] || r["Name"]))];
  members.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    memberSelect.appendChild(opt);
  });

  // Roles
  const roles = [...new Set(rawData.map(r => r["Role"] || "Unknown"))];
  roles.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    roleSelect.appendChild(opt);
  });

  document.getElementById("applyFilters").addEventListener("click", applyFilters);
  document.getElementById("resetFilters").addEventListener("click", resetFilters);
}

function applyFilters() {
  const member = document.getElementById("memberFilter").value;
  const role = document.getElementById("roleFilter").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  filteredData = rawData.filter(r => {
    const name = r["Member"] || r["Name"];
    const roleVal = r["Role"] || "Unknown";
    const dateStr = r["Meeting Date"] || r["Date"];
    const points = parseFloat(r["Points"] || 0);

    // Date filter
    const dateOk = (!startDate || new Date(dateStr) >= new Date(startDate)) &&
                   (!endDate || new Date(dateStr) <= new Date(endDate));

    // Member filter
    const memberOk = !member || name === member;

    // Role filter
    const roleOk = !role || roleVal === role;

    return dateOk && memberOk && roleOk && points > 0;
  });

  rebuildCharts();
}

function resetFilters() {
  document.getElementById("memberFilter").value = "";
  document.getElementById("roleFilter").value = "";
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  filteredData = rawData;
  rebuildCharts();
}

function rebuildCharts() {
  buildLeaderboard();
  buildProgressChart();
  buildMeetingSummary();
  buildRoleBreakdown();
  buildClubProgress();
}

// Build Leaderboard
function buildLeaderboard() {
  const pointsByMember = {};
  filteredData.forEach(row => {
    const name = row["Member"] || row["Name"];
    const points = parseFloat(row["Points"] || 0);
    if (!pointsByMember[name]) pointsByMember[name] = 0;
    pointsByMember[name] += points;
  });

  const labels = Object.keys(pointsByMember);
  const values = Object.values(pointsByMember);

  if (leaderboardChart) leaderboardChart.destroy();
  leaderboardChart = new Chart(document.getElementById("leaderboardChart"), {
    type: "bar",
    data: { labels, datasets: [{ label: "Total Points", data: values, backgroundColor: "rgba(54, 162, 235, 0.6)" }] },
    options: { responsive: true }
  });
}

// Member Progress
function buildProgressChart() {
  if (filteredData.length === 0) return;

  const grouped = {};
  filteredData.forEach(row => {
    const name = row["Member"] || row["Name"];
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push({ date: row["Meeting Date"] || row["Date"], points: parseFloat(row["Points"] || 0) });
  });

  const datasets = Object.keys(grouped).map(name => {
    const sorted = grouped[name].sort((a, b) => new Date(a.date) - new Date(b.date));
    return {
      label: name,
      data: sorted.map(r => r.points),
      borderWidth: 2,
      borderColor: `hsl(${Math.random() * 360},70%,50%)`,
      tension: 0.2
    };
  });

  const labels = [...new Set(filteredData.map(r => r["Meeting Date"] || r["Date"]))].sort();

  if (progressChart) progressChart.destroy();
  progressChart = new Chart(document.getElementById("progressChart"), {
    type: "line",
    data: { labels, datasets },
    options: { responsive: true }
  });
}

// Meeting Summary
function buildMeetingSummary() {
  const pointsByMeeting = {};
  filteredData.forEach(row => {
    const date = row["Meeting Date"] || row["Date"];
    const points = parseFloat(row["Points"] || 0);
    if (!pointsByMeeting[date]) pointsByMeeting[date] = 0;
    pointsByMeeting[date] += points;
  });

  const labels = Object.keys(pointsByMeeting).sort();
  const values = labels.map(l => pointsByMeeting[l]);

  if (meetingSummaryChart) meetingSummaryChart.destroy();
  meetingSummaryChart = new Chart(document.getElementById("meetingSummaryChart"), {
    type: "bar",
    data: { labels, datasets: [{ label: "Total Points per Meeting", data: values, backgroundColor: "rgba(255, 159, 64, 0.6)" }] },
    options: { responsive: true }
  });
}

// Role Breakdown
function buildRoleBreakdown() {
  const roleCounts = {};
  filteredData.forEach(row => {
    const role = row["Role"] || "Unknown";
    const points = parseFloat(row["Points"] || 0);
    if (!roleCounts[role]) roleCounts[role] = 0;
    roleCounts[role] += points;
  });

  const labels = Object.keys(roleCounts);
  const values = Object.values(roleCounts);

  if (roleBreakdownChart) roleBreakdownChart.destroy();
  roleBreakdownChart = new Chart(document.getElementById("roleBreakdownChart"), {
    type: "pie",
    data: { labels, datasets: [{ data: values }] },
    options: { responsive: true }
  });
}

// Club Progress
function buildClubProgress() {
  const pointsByMeeting = {};
  filteredData.forEach(row => {
    const date = row["Meeting Date"] || row["Date"];
    const points = parseFloat(row["Points"] || 0);
    if (!pointsByMeeting[date]) pointsByMeeting[date] = 0;
    pointsByMeeting[date] += points;
  });

  const labels = Object.keys(pointsByMeeting).sort();
  const values = [];
  let cumulative = 0;
  labels.forEach(date => {
    cumulative += pointsByMeeting[date];
    values.push(cumulative);
  });

  if (clubProgressChart) clubProgressChart.destroy();
  clubProgressChart = new Chart(document.getElementById("clubProgressChart"), {
    type: "line",
    data: { labels, datasets: [{ label: "Cumulative Club Points", data: values, borderColor: "rgba(153, 102, 255, 1)", tension: 0.2 }] },
    options: { responsive: true }
  });
}
