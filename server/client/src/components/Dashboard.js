import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { SERVER_API_PATH } from '../config';
import './Dashboard.css';
import { BANNED_APPS, BANNED_APPS_TITLE, HIDDEN_APPS } from '../contants';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [timeRange, setTimeRange] = useState('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workingHoursView, setWorkingHoursView] = useState('month');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();

  // Memoized date calculations
  const { year, month } = useMemo(() => ({
    year: selectedDate.getFullYear(),
    month: selectedDate.getMonth() + 1
  }), [selectedDate]);

  // Fetch events when date or time range changes
  useEffect(() => {
    fetchEvents();
  }, [year, month, user.username]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await axios.get(`${SERVER_API_PATH}/events/${user.username}?year=${year}&month=${month}`);
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [user.username, year, month]);

  // Memoized activity data calculation
  const chartData = useMemo(() => {
    const now = new Date(selectedDate);
    let labels = [];
    let data = [];
    let activityDetails = {};

    // Initialize labels and data based on time range
    if (timeRange === 'day') {
      for (let i = 0; i < 24; i++) {
        labels.push(`${i}:00`);
        data.push(0);
      }
    } else if (timeRange === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      labels = days;
      data = Array(7).fill(0);
    } else if (timeRange === 'month') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        labels.push(i.toString());
        data.push(0);
      }
    }

    // Process events
    const addDetails = (event) => {
      if (event.window && !HIDDEN_APPS.includes(event.window)) {
        activityDetails[event.window] = (activityDetails[event.window] || 0) + 1;
      }
    };

    events.forEach(event => {
      const eventDate = new Date(event.dt);
      if (timeRange === 'day') {
        if (now.getDate() === eventDate.getDate()) {
          const hour = eventDate.getHours();
          data[hour]++;
          addDetails(event);
        }
      } else if (timeRange === 'week') {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (eventDate >= weekStart && eventDate <= weekEnd) {
          const day = eventDate.getDay();
          data[day]++;
          addDetails(event);
        }
      } else if (timeRange === 'month') {
        const day = eventDate.getDate() - 1;
        if (day >= 0 && day < data.length) {
          data[day]++;
          addDetails(event);
        }
      }
    });

    const activityDetailsArray = Object.entries(activityDetails)
      .map(([key, value]) => ({
        key,
        value,
        type: BANNED_APPS.includes(key) ? "banned" : "normal"
      }))
      .sort((a, b) => b.value - a.value);

    return [activityDetailsArray, {
      labels,
      datasets: [{
        label: 'Activity (Hours)',
        data: data.map(item => (item / 60).toFixed(2)),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      }]
    }];
  }, [events, timeRange, selectedDate]);

  // Memoized calendar data
  const calendarData = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    const workingHours = {};

    events.forEach(event => {
      const eventDate = new Date(event.dt);
      if (eventDate.getMonth() === month - 1 && eventDate.getFullYear() === year) {
        const date = eventDate.toISOString().split('T')[0];
        workingHours[date] = (workingHours[date] || 0) + 1;
      }
    });

    const data = Array(firstDayOfMonth).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day).toISOString().split('T')[0];
      data.push({
        day,
        hours: workingHours[date] ? (workingHours[date] / 60).toFixed(2) : 0,
        date
      });
    }

    return data;
  }, [events, year, month]);

  // Memoized day hours data
  const dayHoursData = useMemo(() => {
    const hours = Array(24).fill(0);
    const selectedDateStr = selectedDate.toISOString().split('T')[0];

    events.forEach(event => {
      const eventDate = new Date(event.dt);
      if (eventDate.toISOString().split('T')[0] === selectedDateStr) {
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
        activityLevel
      };
    });
  }, [events, selectedDate]);

  // Event handlers
  const handleDateClick = useCallback((date) => {
    setSelectedDate(new Date(date));
    setWorkingHoursView('day');
  }, []);

  const handlePrevMonth = useCallback(() => {
    setSelectedDate(new Date(year, month - 2, 1));
  }, [year, month]);

  const handleNextMonth = useCallback(() => {
    setSelectedDate(new Date(year, month, 1));
  }, [year, month]);

  const handlePrevDay = useCallback(() => {
    setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)));
  }, [selectedDate]);

  const handleNextDay = useCallback(() => {
    setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)));
  }, [selectedDate]);

  // Render functions
  const renderMonthCalendar = useCallback(() => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="calendar">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center">
            <button className="btn btn-outline-secondary btn-sm me-2" onClick={handlePrevMonth}>←</button>
            <h5 className="mb-0">{selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h5>
            <button className="btn btn-outline-secondary btn-sm ms-2" onClick={handleNextMonth}>→</button>
          </div>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setSelectedDate(new Date())}>Today</button>
        </div>
        <div className="calendar-grid">
          {weekDays.map(day => <div key={day} className="calendar-header">{day}</div>)}
          {calendarData.map((data, index) => (
            <div 
              key={index} 
              className={`calendar-day ${data ? 'has-data' : ''} ${
                data && new Date(data.date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0] 
                  ? 'today' 
                  : ''
              }`}
              onClick={() => data && handleDateClick(data.date)}
            >
              {data && (
                <>
                  <div className="day-number">{data.day}</div>
                  <div className="hours-value">
                    {data.hours === 0 ? "_" : `${Math.floor(data.hours / 1)}h ${Math.round((data.hours % 1) * 60)}m`}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }, [calendarData, selectedDate, handlePrevMonth, handleNextMonth, handleDateClick]);

  const renderDayHours = useCallback(() => {
    const currentHour = new Date().getHours();
    
    return (
      <div className="day-hours">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center">
            <button className="btn btn-outline-secondary btn-sm me-2" onClick={handlePrevDay}>←</button>
            <h5 className="mb-0">{selectedDate.toLocaleDateString()}</h5>
            <button className="btn btn-outline-secondary btn-sm ms-2" onClick={handleNextDay}>→</button>
          </div>
          <div>
            <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => setWorkingHoursView('month')}>
              Back to Calendar
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setSelectedDate(new Date())}>Today</button>
          </div>
        </div>
        <div className="hours-grid">
          {dayHoursData.map(({ hour, activity, activityLevel }) => {
            const hourNum = parseInt(hour.split(':')[0]);
            const isCurrentHour = hourNum === currentHour && 
              selectedDate.toDateString() === new Date().toDateString();
            
            return (
              <div 
                key={hour} 
                className={`hour-block ${isCurrentHour ? 'current-hour' : ''}`}
                data-activity={activityLevel}
              >
                <div className="hour-label">{hour}</div>
                {activityLevel !== 0 && <div className="activity-value">{activity}m</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [dayHoursData, selectedDate, handlePrevDay, handleNextDay]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Dashboard</h2>
      </div>

      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className='card-header d-flex justify-content-between align-items-center'>
              <h5 className="card-title">Activity Chart</h5>
              <div className="btn-group">
                <button
                  className={`btn btn-sm ${timeRange === 'day' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                  onClick={() => setTimeRange('day')}
                >
                  Day
                </button>
                <button
                  className={`btn btn-sm ${timeRange === 'week' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                  onClick={() => setTimeRange('week')}
                >
                  Week
                </button>
                <button
                  className={`btn btn-sm ${timeRange === 'month' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                  onClick={() => setTimeRange('month')}
                >
                  Month
                </button>
              </div>
            </div>
            <div className="card-body">
              <Line width={1000} height={500} data={chartData[1]} />
            </div>
          </div>
          <div className='card'>
            <div className='card-body'>
              <div 
                className="d-flex justify-content-between align-items-center mb-2" 
                style={{cursor: 'pointer'}} 
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <h5 className="mb-0">Activity Details</h5>
                <i className={`bi bi-chevron-${isCollapsed ? 'down' : 'up'}`}></i>
              </div>
              <div style={{
                maxHeight: isCollapsed ? '0' : '480px',
                overflowY: 'scroll',
                transition: 'max-height 0.3s ease-in-out'
              }}>
                {chartData[0].map((item, key) => (
                  <div 
                    key={key} 
                    className={`activity-item ${item.type === 'banned' ? 'banned-app' : ''} d-flex justify-content-between align-items-center border-bottom border-dark py-1 px-2`}
                  >
                    <span className="col-6">{item.type === 'banned' ? BANNED_APPS_TITLE[item.key] : item.key}</span>
                    <span className="col-6">
                      {item.value < 60 
                        ? `${item.value} min` 
                        : `${Math.floor(item.value / 60)}h ${item.value % 60}min`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          {workingHoursView === 'month' ? renderMonthCalendar() : renderDayHours()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 