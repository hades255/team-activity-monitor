import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";
import { SERVER_API_PATH } from "../config";
import { BANNED_APPS, BANNED_APPS_TITLE, HIDDEN_APPS } from "../contants";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const colors = [
  "rgb(75, 192, 192)",
  "rgb(255, 99, 132)",
  "rgb(54, 162, 235)",
  "rgb(255, 206, 86)",
  "rgb(153, 102, 255)",
];

const TeamActivity = () => {
  const [events, setEvents] = useState([]);
  const [timeRange, setTimeRange] = useState("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentActivities, setCurrentActivities] = useState([]);
  const [activityType, setActivityType] = useState(0);

  const { year, month } = useMemo(
    () => ({
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth() + 1,
    }),
    [selectedDate]
  );

  const fetchTeamEvents = useCallback(async () => {
    try {
      const res = await axios.get(
        `${SERVER_API_PATH}/events/team?year=${year}&month=${month}`
      );
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [year, month]);

  useEffect(() => {
    fetchTeamEvents();
  }, [fetchTeamEvents]);

  useEffect(() => {
    const interval = setInterval(fetchTeamEvents, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTeamEvents]);

  const users = useMemo(() => {
    const uniqueUsers = new Set(events.map((event) => event.username));
    return Array.from(uniqueUsers).sort();
  }, [events]);

  const chartData = useMemo(() => {
    const now = new Date(selectedDate);
    let labels = [];
    let datasets = [];
    let userTotals = {};

    if (timeRange === "day") {
      for (let i = 0; i < 24; i++) {
        labels.push(`${i}:00`);
      }
    } else if (timeRange === "week") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      labels = days;
    } else if (timeRange === "month") {
      const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        labels.push(i.toString());
      }
    }

    const userEvents = {};
    events.forEach((event) => {
      if (!userEvents[event.username]) {
        userEvents[event.username] = Array(labels.length).fill(0);
        userTotals[event.username] = 0;
      }

      const eventDate = new Date(event.dt);
      let index;

      if (timeRange === "day") {
        if (now.getDate() === eventDate.getDate()) {
          index = eventDate.getHours();
        }
      } else if (timeRange === "week") {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        if (eventDate >= weekStart && eventDate <= weekEnd) {
          index = eventDate.getDay();
        } else {
          return;
        }
      } else if (timeRange === "month") {
        if (
          now.getMonth() === eventDate.getMonth() &&
          now.getFullYear() === eventDate.getFullYear()
        ) {
          index = eventDate.getDate() - 1;
        }
      }

      if (index >= 0 && index < labels.length) {
        if (activityType === 0) {
          userEvents[event.username][index]++;
          userTotals[event.username]++;
        } else if (activityType === 1 && !BANNED_APPS.includes(event.window)) {
          userEvents[event.username][index]++;
          userTotals[event.username]++;
        } else if (activityType === 2 && BANNED_APPS.includes(event.window)) {
          userEvents[event.username][index]++;
          userTotals[event.username]++;
        }
      }
    });

    let colorIndex = 0;
    for (const [username, data] of Object.entries(userEvents)) {
      datasets.push({
        label: username,
        data: data.map((item) => (item / 60).toFixed(2)),
        borderColor: colors[colorIndex % colors.length],
        backgroundColor: colors[colorIndex % colors.length]
          .replace("rgb", "rgba")
          .replace(")", ", 0.2)"),
        fill: true,
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
      });
      colorIndex++;
    }

    return {
      labels,
      datasets,
      userTotals,
    };
  }, [events, timeRange, selectedDate, activityType]);

  const activityDetails = useMemo(() => {
    if (!selectedUser) return [];

    const now = new Date(selectedDate);
    const userEvents = events.filter((event) => {
      if (event.username !== selectedUser) return false;

      const eventDate = new Date(event.dt);

      if (timeRange === "day") {
        return (
          now.getDate() === eventDate.getDate() &&
          now.getMonth() === eventDate.getMonth() &&
          now.getFullYear() === eventDate.getFullYear()
        );
      } else if (timeRange === "week") {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        return eventDate >= weekStart && eventDate <= weekEnd;
      } else if (timeRange === "month") {
        return (
          now.getMonth() === eventDate.getMonth() &&
          now.getFullYear() === eventDate.getFullYear()
        );
      }
      return false;
    });

    const details = {};
    userEvents.forEach((event) => {
      if (event.window && !HIDDEN_APPS.includes(event.window)) {
        details[event.window] = (details[event.window] || 0) + 1;
      }
    });

    return Object.entries(details)
      .map(([key, value]) => ({
        key,
        value,
        type: BANNED_APPS.includes(key) ? "banned" : "normal",
      }))
      .sort((a, b) => b.value - a.value);
  }, [events, selectedUser, selectedDate, timeRange]);

  const handlePrevPeriod = useCallback(() => {
    const newDate = new Date(selectedDate);
    if (timeRange === "day") {
      newDate.setDate(selectedDate.getDate() - 1);
    } else if (timeRange === "week") {
      newDate.setDate(selectedDate.getDate() - 7);
    } else if (timeRange === "month") {
      newDate.setMonth(selectedDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  }, [selectedDate, timeRange]);

  const handleNextPeriod = useCallback(() => {
    const newDate = new Date(selectedDate);
    if (timeRange === "day") {
      newDate.setDate(selectedDate.getDate() + 1);
    } else if (timeRange === "week") {
      newDate.setDate(selectedDate.getDate() + 7);
    } else if (timeRange === "month") {
      newDate.setMonth(selectedDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  }, [selectedDate, timeRange]);

  const formatDate = useCallback(() => {
    if (timeRange === "day") {
      return selectedDate.toLocaleDateString();
    } else if (timeRange === "week") {
      const start = new Date(selectedDate);
      start.setDate(selectedDate.getDate() - selectedDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    } else if (timeRange === "month") {
      return selectedDate.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
    }
  }, [selectedDate, timeRange]);

  const fetchCurrentActivities = useCallback(async () => {
    try {
      const res = await axios.get(`${SERVER_API_PATH}/events/team/current`);
      setCurrentActivities(res.data);
    } catch (err) {
      console.error("Error fetching current activities:", err);
    }
  }, []);

  useEffect(() => {
    fetchCurrentActivities();
    const interval = setInterval(fetchCurrentActivities, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchCurrentActivities]);

  const formatTimeDiff = useCallback((date) => {
    if (!date) return "No recent activity";
    const diff = Math.floor((new Date() - new Date(date)) / 1000 / 60);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} min ago`;
    return `${Math.floor(diff / 60)}h ${diff % 60}min ago`;
  }, []);

  return (
    <div>
      <div className="row">
        <div className="col-lg-9 mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <div className="btn-group">
                <button
                  onClick={() => setActivityType(0)}
                  className={`btn btn-sm ${
                    activityType === 0 ? "btn-primary" : "btn-outline-primary"
                  }`}
                >
                  Total
                </button>
                <button
                  onClick={() => setActivityType(1)}
                  className={`btn btn-sm ${
                    activityType === 1 ? "btn-success" : "btn-outline-success"
                  }`}
                >
                  Work
                </button>
                <button
                  onClick={() => setActivityType(2)}
                  className={`btn btn-sm ${
                    activityType === 2
                      ? "btn-secondary"
                      : "btn-outline-secondary"
                  }`}
                >
                  Relax
                </button>
              </div>
              <div className="d-flex gap-3">
                {Object.entries(chartData.userTotals).map(
                  ([username, total], index) => (
                    <div key={username} className="text-center">
                      <div style={{ color: colors[index] }}>
                        {Math.floor(total / 60)}h {total % 60}m
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
          <div className="card-body">
            <Line
              width={1000}
              height={400}
              data={chartData}
              options={{
                responsive: true,
                interaction: {
                  mode: "index",
                  intersect: false,
                },
                plugins: {
                  legend: {
                    position: "top",
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: "Hours",
                    },
                  },
                },
              }}
            />
          </div>
        </div>
        <div className="col-lg-3 p-2">
          <div className="d-flex align-items-center mb-3">
            <button
              className="btn btn-outline-secondary btn-sm me-2"
              onClick={handlePrevPeriod}
            >
              ←
            </button>
            <span className="mx-2">{formatDate()}</span>
            <button
              className="btn btn-outline-secondary btn-sm me-2"
              onClick={handleNextPeriod}
            >
              →
            </button>
            <div className="btn-group ms-2">
              <button
                className={`btn btn-sm ${
                  timeRange === "day"
                    ? "btn-secondary"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setTimeRange("day")}
              >
                Day
              </button>
              <button
                className={`btn btn-sm ${
                  timeRange === "week"
                    ? "btn-secondary"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setTimeRange("week")}
              >
                Week
              </button>
              <button
                className={`btn btn-sm ${
                  timeRange === "month"
                    ? "btn-secondary"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setTimeRange("month")}
              >
                Month
              </button>
            </div>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Current Doing</h5>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={fetchCurrentActivities}
              title="Last updated"
            >
              <i className="bi bi-arrow-clockwise"></i>
              <small className="ms-1">Refresh</small>
            </button>
          </div>
          <div className="current-activities">
            {currentActivities.map((activity, index) => (
              <div
                key={activity.username}
                className={`activity-item mb-2 p-2 rounded ${
                  !activity.window ? "bg-light" : ""
                }`}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <strong>{activity.username}</strong>
                  <small className="text-muted">
                    {formatTimeDiff(activity.dt)}
                  </small>
                </div>
                {activity.window ? (
                  <div className="mt-1">
                    {BANNED_APPS.includes(activity.window) ? (
                      <span className="text-danger">
                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                        {BANNED_APPS_TITLE[activity.window]}
                      </span>
                    ) : (
                      activity.window
                    )}
                  </div>
                ) : (
                  <div className="text-muted">No recent activity</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5
              className="mb-0"
              style={{ cursor: "pointer" }}
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              Activity Details (Click to {isCollapsed ? "show" : "hide"}{" "}
              details)
            </h5>
            <select
              className="form-select w-auto bg-secondary text-white"
              value={selectedUser || ""}
              onChange={(e) => setSelectedUser(e.target.value || null)}
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              maxHeight: isCollapsed ? "0" : "480px",
              overflowY: "scroll",
              transition: "max-height 0.3s ease-in-out",
            }}
          >
            {selectedUser ? (
              activityDetails.map((item, key) => (
                <div
                  key={key}
                  className={`activity-item ${
                    item.type === "banned" ? "banned-app" : ""
                  } d-flex justify-content-between align-items-center border-bottom border-dark py-1 px-2`}
                >
                  <span className="col-6">
                    {item.type === "banned"
                      ? BANNED_APPS_TITLE[item.key]
                      : item.key}
                  </span>
                  <span className="col-6">
                    {item.value < 60
                      ? `${item.value} min`
                      : `${Math.floor(item.value / 60)}h ${item.value % 60}min`}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-muted py-3">
                Please select a user to view activity details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamActivity;
