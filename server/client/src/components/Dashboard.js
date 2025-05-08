import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
  lazy,
} from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController,
} from "chart.js";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { SERVER_API_PATH } from "../config";
import "./Dashboard.css";
import { BANNED_APPS, HIDDEN_APPS } from "../contants";

// Lazy load components
const ActivityChart = lazy(() => import('./dashboard/ActivityChart'));
const ActivityDetails = lazy(() => import('./dashboard/ActivityDetails'));
const CalendarView = lazy(() => import('./dashboard/CalendarView'));
const DayHoursView = lazy(() => import('./dashboard/DayHoursView'));
const DetailedView = lazy(() => import('./dashboard/DetailedView'));

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController
);

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
    const timer = setTimeout(fetchEvents, 500);
    return () => {
      if (timer) clearTimeout(timer);
    };
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
    let workingData = [];
    let relaxData = [];
    let activityDetails = {};
    let totalHours = 0;
    let workingHours = 0;
    let relaxHours = 0;

    if (timeRange === "day") {
      for (let i = 0; i < 24; i++) {
        labels.push(`${i}:00`);
        data.push(0);
        workingData.push(0);
        relaxData.push(0);
      }
    } else if (timeRange === "week") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      labels = days;
      data = Array(7).fill(0);
      workingData = Array(7).fill(0);
      relaxData = Array(7).fill(0);
    } else if (timeRange === "month") {
      const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        labels.push(i.toString());
        data.push(0);
        workingData.push(0);
        relaxData.push(0);
      }
    }

    if (
      // now.getFullYear() === current.getFullYear() &&
      // now.getMonth() === current.getMonth()
      true
    ) {
      // Process events
      const addDetails = (event) => {
        if (event.window && !HIDDEN_APPS.includes(event.window)) {
          activityDetails[event.window] =
            (activityDetails[event.window] || 0) + 1;
        }
      };

      let weekStart = null;
      let weekEnd = null;
      if (timeRange === "week") {
        weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0);
        weekStart.setMinutes(0);
        weekStart.setSeconds(0);
        weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23);
        weekEnd.setMinutes(59);
        weekEnd.setSeconds(59);
      }

      events.forEach((event) => {
        const eventDate = new Date(event.dt);
        if (timeRange === "day") {
          if (
            now.getMonth() === eventDate.getMonth() &&
            now.getDate() === eventDate.getDate()
          ) {
            const hour = eventDate.getHours();
            data[hour]++;
            if (BANNED_APPS.includes(event.window)) {
              relaxData[hour]++;
            } else {
              workingData[hour]++;
            }
            addDetails(event);
          }
        } else if (timeRange === "week") {
          if (eventDate >= weekStart && eventDate <= weekEnd) {
            const day = eventDate.getDay();
            data[day]++;
            if (BANNED_APPS.includes(event.window)) {
              relaxData[day]++;
            } else {
              workingData[day]++;
            }
            addDetails(event);
          }
        } else if (timeRange === "month") {
          if (now.getMonth() === eventDate.getMonth()) {
            const day = eventDate.getDate() - 1;
            if (day >= 0 && day < data.length) {
              data[day]++;
              if (BANNED_APPS.includes(event.window)) {
                relaxData[day]++;
              } else {
                workingData[day]++;
              }
              addDetails(event);
            }
          }
        }
      });
    } else {
      // Process events
      const addDetails = (event) => {
        event.windows.forEach((item) => {
          if (activityDetails[item.window])
            activityDetails[item.window] += item.total;
          else activityDetails[item.window] = item.total;
        });
      };

      events.forEach((event) => {
        if (timeRange === "day") {
          if (now.getDate() === event.d) {
            data[event.h] += event.work;
            workingData[event.h] += event.work;
            relaxHours[event.h] += event.relax;
            addDetails(event);
          }
        } else if (timeRange === "week") {
          const weekStart = now.getDate() - now.getDay();
          const weekEnd = weekStart + 6;
          if (event.d >= weekStart && event.d <= weekEnd) {
            data[event.d] += event.work;
            workingData[event.d] += event.work;
            relaxHours[event.d] += event.relax;
            addDetails(event);
          }
        } else if (timeRange === "month") {
          const day = event.d - 1;
          if (day >= 0 && day < data.length) {
            data[day] += event.work;
            workingData[day] += event.work;
            relaxHours[day] += event.relax;
            addDetails(event);
          }
        }
      });
    }

    // Calculate total hours
    totalHours = data.reduce((sum, count) => sum + count, 0) / 60;
    workingHours = workingData.reduce((sum, count) => sum + count, 0) / 60;
    relaxHours = relaxData.reduce((sum, count) => sum + count, 0) / 60;

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
            type: "line",
            label: "Activity (Hours)",
            data: data.map((item) => (item / 60).toFixed(2)),
            borderColor: "rgb(75, 192, 192)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            tension: 0.1,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            type: "bar",
            label: "Work (Hours)",
            data: workingData.map((item) => (item / 60).toFixed(2)),
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgb(54, 162, 235)",
            borderWidth: 1,
          },
          {
            type: "bar",
            label: "Relax (Hours)",
            data: relaxData.map((item) => (item / 60).toFixed(2)),
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderColor: "rgb(255, 99, 99)",
            borderWidth: 1,
          },
        ],
      },
      totalHours,
      workingHours,
      relaxHours,
    ];
  }, [events, timeRange, selectedDate]);

  return (
    <div>
      <div className="row">
        <div className="col-lg-7 mb-4">
          <div className="d-flex justify-content-end">
            <div className="btn-group">
              <button
                className={`btn btn-sm ${timeRange === "day"
                  ? "btn-secondary"
                  : "btn-outline-secondary"
                  }`}
                onClick={() => setTimeRange("day")}
              >
                Day
              </button>
              <button
                className={`btn btn-sm ${timeRange === "week"
                  ? "btn-secondary"
                  : "btn-outline-secondary"
                  }`}
                onClick={() => setTimeRange("week")}
              >
                Week
              </button>
              <button
                className={`btn btn-sm ${timeRange === "month"
                  ? "btn-secondary"
                  : "btn-outline-secondary"
                  }`}
                onClick={() => setTimeRange("month")}
              >
                Month
              </button>
            </div>
          </div>

          <Suspense fallback={<div>Loading chart...</div>}>
            <ActivityChart chartData={chartData[1]} />
          </Suspense>

          <Suspense fallback={<div>Loading activity details...</div>}>
            <ActivityDetails
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
              chartData={chartData}
            />
          </Suspense>
        </div>

        <div className="col-lg-5 mb-4">
          <Suspense fallback={<div>Loading calendar view...</div>}>
            {workingHoursView === "month" ? (
              <CalendarView
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                setWorkingHoursView={setWorkingHoursView}
                events={events}
                year={year}
                month={month}
              />
            ) : (
              <DayHoursView
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                setWorkingHoursView={setWorkingHoursView}
                events={events}
              />
            )}
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<div>Loading detailed view...</div>}>
        <DetailedView
          isCollapsedDetailed={isCollapsedDetailed}
          setIsCollapsedDetailed={setIsCollapsedDetailed}
          todayEvents={todayEvents}
        />
      </Suspense>
    </div>
  );
};

export default Dashboard;
