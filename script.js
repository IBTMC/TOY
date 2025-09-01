// 🔑 Replace with your Sheet ID
const SHEET_ID = "19x7OzxLlfG5YarEgksoX-drLaf12Ci98JpYkBvQpoMI";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

let rawData = [];
let leaderboardChart, progressChart, meetingSummaryChart, roleBreakdownChart, clubProgressChart;

Papa.parse(CSV_URL, {
  download: true,
  header: true,
  complete: (results) => {
    rawData = results.data.filter(r => r["Member"] || r["Name"]); // filter empty rows
    buildLeaderboard();
    populateMemberDropdown();
    buildMeetingSummary();
    buildRoleBreakdown();
    buildClubProgress();
  }
});

// Build Leaderboard Chart
function buildLeaderboard() {
  const pointsByMember = {};
  rawData.forEach(row => {
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
    data: {
      labels,
      datasets: [{
        label: "Total Points",
        data: values,
        backgroundColor: "rgba(54, 162, 235, 0.6)"
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

// Populate Member Dropdown
function populateMemberDropdown() {
  const select = document.getElementById("memberSelect");
  const members = [...new Set(rawData.map(r => r["Member"] || r["Name"]))];
  members.forEach(m => {
    const option = document.createElement("option");
    option.value = m;
    option.textContent = m;
    select.appendChild(option);
  });
  select.addEventListener("change", () => buildProgressChart(select.value));
  if (members.length > 0) buildProgressChart(members[0]);
}

// Build Progress Chart for Member
function buildProgressChart(member) {
  const memberData = rawData.filter(r => (r["Member"] || r["Name"]) === member);
  const labels = memberData.map(r => r["Meeting Date"] || r["Date"]);
  const values = memberData.map(r => parseFloat(r["Points"] || 0));

  if (progressChart) progressChart.destroy();
  progressChart = new Chart(document.getElementById("progressChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: `${member} Points per Meeting`,
        data: values,
        borderColor: "rgba(75, 192, 192, 1)",
        tension: 0.2
      }]
    },
    options: { responsive: true }
  });
}

// Build Meeting Summary Chart
function buildMeetingSummary() {
  const pointsByMeeting = {};
  rawData.forEach(row => {
    const date = row["Meeting Date"] || row["Date"];
    const points = parseFloat(row["Points"] || 0);
    if (!pointsByMeeting[date]) pointsByMeeting[date] = 0;
    pointsByMeeting[date] += points;
  });

  const labels = Object.keys(pointsByMeeting);
  const values = Object.values(pointsByMeeting);

  if (meetingSummaryChart) meetingSummaryChart.destroy();
  meetingSummaryChart = new Chart(document.getElementById("meetingSummaryChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Total Points per Meeting",
        data: values,
        backgroundColor: "rgba(255, 159, 64, 0.6)"
      }]
    },
    options: { responsive: true }
  });
}

// Build Role Breakdown Pie Chart
function buildRoleBreakdown() {
  const roleCounts = {};
  rawData.forEach(row => {
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
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)"
        ]
      }]
    },
    options: { responsive: true }
  });
}

// Build Club Progress Over Time (Cumulative Points)
function buildClubProgress() {
  const pointsByMeeting = {};
  rawData.forEach(row => {
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
    data: {
      labels,
      datasets: [{
        label: "Cumulative Club Points",
        data: values,
        borderColor: "rgba(153, 102, 255, 1)",
        tension: 0.2
      }]
    },
    options: { responsive: true }
  });
}
