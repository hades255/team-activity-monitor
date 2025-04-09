import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { useAuth } from "../context/AuthContext";
import { SERVER_API_PATH } from "../config";
import "./Dashboard.css";
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

const padding = { top: 20, right: 20, bottom: 40, left: 60 };
const hourHeight = 18;
const minuteWidth = 18;

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [todayEvents, setTodayEvents] = useState([]);
  const [timeRange, setTimeRange] = useState("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workingHoursView, setWorkingHoursView] = useState("month");
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isCollapsedDetailed, setIsCollapsedDetailed] = useState(false);
  const { user } = useAuth();

  // Memoized date calculations
  const { year, month } = useMemo(
    () => ({
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth() + 1,
    }),
    [selectedDate]
  );

  const fetchEvents = useCallback(async () => {
    try {
      const res = await axios.get(
        `${SERVER_API_PATH}/events/${user.username}?year=${year}&month=${month}`
      );
      setEvents(res.data);
      // Only set today's events if we're looking at the current month/year
      const currentDate = new Date();
      if (
        year === currentDate.getFullYear() &&
        month === currentDate.getMonth() + 1
      ) {
        setTodayEvents(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [user.username, year, month]);

  // Fetch events when date or time range changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const interval = setInterval(fetchEvents, 10 * 60 * 1000); // 10 minutes
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // Memoized activity data calculation
  const chartData = useMemo(() => {
    const now = new Date(selectedDate);
    let labels = [];
    let data = [];
    let activityDetails = {};
    let totalHours = 0;

    // Initialize labels and data based on time range
    if (timeRange === "day") {
      for (let i = 0; i < 24; i++) {
        labels.push(`${i}:00`);
        data.push(0);
      }
    } else if (timeRange === "week") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      labels = days;
      data = Array(7).fill(0);
    } else if (timeRange === "month") {
      const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        labels.push(i.toString());
        data.push(0);
      }
    }

    // Process events
    const addDetails = (event) => {
      if (event.window && !HIDDEN_APPS.includes(event.window)) {
        activityDetails[event.window] =
          (activityDetails[event.window] || 0) + 1;
      }
    };

    events.forEach((event) => {
      const eventDate = new Date(event.dt);
      if (timeRange === "day") {
        if (now.getDate() === eventDate.getDate()) {
          const hour = eventDate.getHours();
          data[hour]++;
          addDetails(event);
        }
      } else if (timeRange === "week") {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (eventDate >= weekStart && eventDate <= weekEnd) {
          const day = eventDate.getDay();
          data[day]++;
          addDetails(event);
        }
      } else if (timeRange === "month") {
        const day = eventDate.getDate() - 1;
        if (day >= 0 && day < data.length) {
          data[day]++;
          addDetails(event);
        }
      }
    });

    // Calculate total hours
    totalHours = data.reduce((sum, count) => sum + count, 0) / 60;

    const activityDetailsArray = Object.entries(activityDetails)
      .map(([key, value]) => ({
        key,
        value,
        type: BANNED_APPS.includes(key) ? "banned" : "normal",
      }))
      .sort((a, b) => b.value - a.value);

    return [
      activityDetailsArray,
      {
        labels,
        datasets: [
          {
            label: "Activity (Hours)",
            data: data.map((item) => (item / 60).toFixed(2)),
            borderColor: "rgb(75, 192, 192)",
            backgroundColor: "rgba(75, 192, 192, 0.5)",
          },
        ],
      },
      totalHours
    ];
  }, [events, timeRange, selectedDate]);

  // Memoized calendar data
  const calendarData = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    const workingHours = {};

    events.forEach((event) => {
      const eventDate = new Date(event.dt);
      if (
        eventDate.getMonth() === month - 1 &&
        eventDate.getFullYear() === year
      ) {
        const date = `${year}-${String(month).padStart(2, "0")}-${String(
          eventDate.getDate()
        ).padStart(2, "0")}`;
        workingHours[date] = (workingHours[date] || 0) + 1;
      }
    });

    const data = Array(firstDayOfMonth).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      data.push({
        day,
        hours: workingHours[date] ? (workingHours[date] / 60).toFixed(2) : 0,
        date,
      });
    }

    return data;
  }, [events, year, month]);

  // Memoized day hours data
  const dayHoursData = useMemo(() => {
    const hours = Array(24).fill(0);
    const selectedDateStr = `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1
    ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

    events.forEach((event) => {
      const eventDate = new Date(event.dt);
      const eventDateStr = `${eventDate.getFullYear()}-${String(
        eventDate.getMonth() + 1
      ).padStart(2, "0")}-${String(eventDate.getDate()).padStart(2, "0")}`;
      if (eventDateStr === selectedDateStr) {
        const hour = eventDate.getHours();
        hours[hour]++;
      }
    });

    return hours.map((count, hour) => {
      const activityHours = count;
      let activityLevel;
      if (activityHours <= 0) activityLevel = 0;
      else if (activityHours <= 3) activityLevel = 1;
      else if (activityHours <= 10) activityLevel = 2;
      else if (activityHours <= 18) activityLevel = 3;
      else if (activityHours <= 27) activityLevel = 4;
      else if (activityHours <= 36) activityLevel = 5;
      else if (activityHours <= 45) activityLevel = 6;
      else if (activityHours <= 52) activityLevel = 7;
      else activityLevel = 8;

      return {
        hour: `${hour}:00`,
        activity: activityHours,
        activityLevel,
      };
    });
  }, [events, selectedDate]);

  // Event handlers
  const handleDateClick = useCallback((date) => {
    setSelectedDate(new Date(date));
    setWorkingHoursView("day");
  }, []);

  const handlePrevMonth = useCallback(() => {
    setSelectedDate(new Date(year, month - 2, selectedDate.getDate()));
  }, [year, month, selectedDate]);

  const handleNextMonth = useCallback(() => {
    setSelectedDate(new Date(year, month, selectedDate.getDate()));
  }, [year, month, selectedDate]);

  const handlePrevDay = useCallback(() => {
    setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)));
  }, [selectedDate]);

  const handleNextDay = useCallback(() => {
    setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)));
  }, [selectedDate]);

  // Render functions
  const renderMonthCalendar = useCallback(() => {
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div className="calendar">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center">
            <button
              className="btn btn-outline-secondary btn-sm me-2"
              onClick={handlePrevMonth}
            >
              ←
            </button>
            <h5 className="mb-0">
              {selectedDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </h5>
            <button
              className="btn btn-outline-secondary btn-sm ms-2"
              onClick={handleNextMonth}
            >
              →
            </button>
          </div>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setSelectedDate(new Date())}
          >
            Today
          </button>
        </div>
        <div className="calendar-grid">
          {weekDays.map((day) => (
            <div key={day} className="calendar-header">
              {day}
            </div>
          ))}
          {calendarData.map((data, index) => (
            <div
              key={index}
              className={`calendar-day ${data ? "has-data" : ""} ${
                data &&
                new Date(data.date).toDateString() === new Date().toDateString()
                  ? "today"
                  : ""
              }`}
              onClick={() => data && handleDateClick(data.date)}
            >
              {data && (
                <>
                  <div className="day-number">{data.day}</div>
                  <div className="hours-value">
                    {data.hours === 0
                      ? "_"
                      : `${Math.floor(data.hours / 1)}h ${Math.round(
                          (data.hours % 1) * 60
                        )}m`}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }, [
    calendarData,
    selectedDate,
    handlePrevMonth,
    handleNextMonth,
    handleDateClick,
  ]);

  const renderDayHours = useCallback(() => {
    const currentHour = new Date().getHours();

    return (
      <div className="day-hours">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center">
            <button
              className="btn btn-outline-secondary btn-sm me-2"
              onClick={handlePrevDay}
            >
              ←
            </button>
            <h5 className="mb-0">{selectedDate.toLocaleDateString()}</h5>
            <button
              className="btn btn-outline-secondary btn-sm ms-2"
              onClick={handleNextDay}
            >
              →
            </button>
          </div>
          <div>
            <button
              className="btn btn-outline-secondary btn-sm me-2"
              onClick={() => setWorkingHoursView("month")}
            >
              Back to Calendar
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setSelectedDate(new Date())}
            >
              Today
            </button>
          </div>
        </div>
        <div className="hours-grid">
          {dayHoursData.map(({ hour, activity, activityLevel }) => {
            const hourNum = parseInt(hour.split(":")[0]);
            const isCurrentHour =
              hourNum === currentHour &&
              selectedDate.toDateString() === new Date().toDateString();

            return (
              <div
                key={hour}
                className={`hour-block ${isCurrentHour ? "current-hour" : ""}`}
                data-activity={activityLevel}
              >
                <div className="hour-label">{hour}</div>
                {activityLevel !== 0 && (
                  <div className="activity-value">{activity}m</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [dayHoursData, selectedDate, handlePrevDay, handleNextDay]);

  const detailedCanvasRef = useRef(null);

  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: '' });

  const handleMouseMove = useCallback((e) => {
    const canvas = detailedCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * canvas.width / rect.width;
    const y = (e.clientY - rect.top) * canvas.height / rect.height;

    const hour = Math.floor((y - padding.top) / hourHeight);
    const minute = Math.floor((x - padding.left) / minuteWidth);

    if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
      const currentTime = new Date();
      const targetHour = new Date(currentTime);
      targetHour.setHours(currentTime.getHours() - (23 - hour));
      targetHour.setMinutes(minute);

      const matchingEvent = todayEvents.find((event) => {
        const eventTime = new Date(event.dt);
        return (
          eventTime.getHours() === targetHour.getHours() &&
          eventTime.getMinutes() === targetHour.getMinutes() &&
          eventTime.getDate() === targetHour.getDate() &&
          eventTime.getMonth() === targetHour.getMonth() &&
          eventTime.getFullYear() === targetHour.getFullYear()
        );
      });

      if (matchingEvent) {
        const eventTime = new Date(matchingEvent.dt);
        const timeStr = eventTime.toLocaleTimeString();
        const appName = BANNED_APPS.includes(matchingEvent.window) 
          ? BANNED_APPS_TITLE[matchingEvent.window] 
          : matchingEvent.window;
        
        setTooltip({
          show: true,
          x: e.clientX,
          y: e.clientY,
          content: `${appName}\n${timeStr}`
        });
      } else {
        setTooltip({ show: false, x: 0, y: 0, content: '' });
      }
    } else {
      setTooltip({ show: false, x: 0, y: 0, content: '' });
    }
  }, [todayEvents]);

  const handleMouseLeave = useCallback(() => {
    setTooltip({ show: false, x: 0, y: 0, content: '' });
  }, []);

  useEffect(() => {
    const canvas = detailedCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    let totalMinutes = 0;

    ctx.clearRect(0, 0, width, height);

    ctx.font = '12px Arial';
    ctx.textAlign = 'right';

    const currentTime = new Date();
    for (let hourOffset = 0; hourOffset < 24; hourOffset++) {
      const targetHour = new Date(currentTime);
      targetHour.setHours(currentTime.getHours() - hourOffset);

      for (let minute = 0; minute < 60; minute++) {
        const targetTime = new Date(targetHour);
        targetTime.setMinutes(minute);

        const matchingEvent = todayEvents.find((event) => {
          const eventTime = new Date(event.dt);
          return (
            eventTime.getHours() === targetTime.getHours() &&
            eventTime.getMinutes() === targetTime.getMinutes() &&
            eventTime.getDate() === targetTime.getDate() &&
            eventTime.getMonth() === targetTime.getMonth() &&
            eventTime.getFullYear() === targetTime.getFullYear()
          );
        });

        const x = padding.left + minute * minuteWidth + minuteWidth / 2;
        const y = padding.top + (23 - hourOffset) * hourHeight + hourHeight / 2;
        
        ctx.fillStyle = '#555';
        
        ctx.fillText(
          `${targetTime.getHours().toString().padStart(2, '0')}:00`,
          padding.left - 10,
          y + 4
        );
        
        if (matchingEvent) {
          totalMinutes++;
          if (BANNED_APPS.includes(matchingEvent.window)) {
            ctx.fillStyle = '#ff4444';
          } else if (HIDDEN_APPS.includes(matchingEvent.window)) {
            ctx.fillStyle = '#666666';
          } else {
            ctx.fillStyle = '#4CAF50';
          }
        } else {
          ctx.fillStyle = '#222';
        }

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const legendItems = [
      { color: '#4CAF50', label: 'Normal Activity' },
      { color: '#ff4444', label: 'Banned App' },
      { color: '#666666', label: 'System App' }
    ];

    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    let legendX = padding.left;
    const legendY = height - padding.bottom + 20;

    legendItems.forEach((item, index) => {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(legendX, legendY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#666';
      ctx.fillText(item.label, legendX + 10, legendY + 4);
      legendX += 120;
    });
    
    ctx.fillStyle = '#888';
    ctx.fillText(`Total ${Math.floor(totalMinutes/60)}h ${totalMinutes % 60}m in last 24 hours`, legendX + 10, legendY + 4);
    legendX += 120;

  }, [todayEvents, isCollapsedDetailed]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Dashboard</h2>
      </div>

      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="card-title">Activity Chart</h5>
                <small className="text-muted">
                  Total Hours: {`${Math.floor(chartData[2] / 1)}h ${Math.round((chartData[2] % 1) * 60)}m`}h
                </small>
              </div>
              <div className="btn-group">
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
            <div className="card-body">
              <Line width={1000} height={500} data={chartData[1]} />
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div
                className="d-flex justify-content-between align-items-center mb-2"
                style={{ cursor: "pointer" }}
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <h5 className="mb-0">Activity Details</h5>
                <i
                  className={`bi bi-chevron-${isCollapsed ? "down" : "up"}`}
                ></i>
              </div>
              <div
                style={{
                  maxHeight: isCollapsed ? "0" : "480px",
                  overflowY: "scroll",
                  transition: "max-height 0.3s ease-in-out",
                }}
              >
                {chartData[0].map((item, key) => (
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
                        : `${Math.floor(item.value / 60)}h ${
                            item.value % 60
                          }min`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          {workingHoursView === "month"
            ? renderMonthCalendar()
            : renderDayHours()}
        </div>
      </div>

      <div className="d-flex justify-content-center">
        <div className="card mt-4">
          <div
            className="card-header"
            onClick={() => setIsCollapsedDetailed(!isCollapsedDetailed)}
          >
            <h5 className="card-title">Last 24 Hours</h5>
          </div>
          {isCollapsedDetailed && (
            <div className="card-body">
              <canvas
                ref={detailedCanvasRef}
                width={1200}
                height={500}
                style={{ width: '100%', height: 'auto' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              />
              {tooltip.show && (
                <div
                  style={{
                    position: 'fixed',
                    left: tooltip.x + 10,
                    top: tooltip.y + 10,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    whiteSpace: 'pre-line',
                    zIndex: 1000,
                    pointerEvents: 'none'
                  }}
                >
                  {tooltip.content}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
