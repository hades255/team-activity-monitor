import React, { useState, useEffect } from 'react';
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
  const [workingHoursView, setWorkingHoursView] = useState('month'); // 'month' or 'day'
  const { user } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, [timeRange, selectedDate]);

  const fetchEvents = async () => {
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1; // Months are 0-based in JS
      const res = await axios.get(`${SERVER_API_PATH}/events/${user.username}?year=${year}&month=${month}`);
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getActivityData = () => {
    const now = new Date();
    let labels = [];
    let data = [];

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

    events.forEach(event => {
      const eventDate = new Date(event.dt);
      if (timeRange === 'day') {
        const hour = eventDate.getHours();
        data[hour]++;
      } else if (timeRange === 'week') {
        const day = eventDate.getDay();
        data[day]++;
      } else if (timeRange === 'month') {
        const day = eventDate.getDate() - 1;
        if (day >= 0 && day < data.length) {
          data[day]++;
        }
      }
    });

    return {
      labels,
      datasets: [
        {
          label: 'Activity (Hours)',
          data:data.map(item=>(item/60).toFixed(2)),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        }
      ]
    };
  };

  const getMonthCalendarData = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const calendarData = [];
    const workingHours = {};

    // Calculate working hours for each day
    events.forEach(event => {
      const eventDate = new Date(event.dt);
      if (eventDate.getMonth() === month && eventDate.getFullYear() === year) {
        const date = eventDate.toISOString().split('T')[0];
        if (!workingHours[date]) {
          workingHours[date] = 0;
        }
        workingHours[date]++;
      }
    });

    // Fill in empty days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarData.push(null);
    }

    // Fill in the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day).toISOString().split('T')[0];
      const hours = workingHours[date] ? (workingHours[date] / 60).toFixed(2) : 0;
      calendarData.push({
        day,
        hours,
        date
      });
    }

    return calendarData;
  };

  const getDayHoursData = () => {
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
      // Convert count to hours (assuming each event represents 5 minutes of activity)
      const activityHours = (count / 60).toFixed(2);
      
      // Calculate activity level based on the specified scale
      let activityLevel;
      if (activityHours <= 0) activityLevel = 0;
      else if (activityHours <= 0.03) activityLevel = 1;
      else if (activityHours <= 0.09) activityLevel = 2;
      else if (activityHours <= 0.16) activityLevel = 3;
      else if (activityHours <= 0.25) activityLevel = 4;
      else if (activityHours <= 0.4) activityLevel = 5;
      else if (activityHours <= 0.6) activityLevel = 6;
      else if (activityHours <= 0.8) activityLevel = 7;
      else activityLevel = 8;
      
      return {
        hour: `${hour}:00`,
        activity: activityHours,
        activityLevel: activityLevel
      };
    });
  };

  const handleDateClick = (date) => {
    setSelectedDate(new Date(date));
    setWorkingHoursView('day');
  };

  const handlePrevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const renderMonthCalendar = () => {
    const calendarData = getMonthCalendarData();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
            <h5 className="mb-0">{selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h5>
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
          {weekDays.map(day => (
            <div key={day} className="calendar-header">{day}</div>
          ))}
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
                  <div className="hours-value">{data.hours===0?"_":data.hours>1?`${data.hours}h`:`${Math.round(data.hours*60)}m`}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayHours = () => {
    const hoursData = getDayHoursData();
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
              onClick={() => setWorkingHoursView('month')}
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
          {hoursData.map(({ hour, activity, activityLevel }) => {
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
                {activityLevel!==0 && <div className="activity-value">{activity>1?`${activity}h`:`${Math.round(activity*60)}m`}</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
                  className={`btn btn-sm ${timeRange === 'day' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setTimeRange('day')}
                >
                  Day
                </button>
                <button
                  className={`btn btn-sm ${timeRange === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setTimeRange('week')}
                >
                  Week
                </button>
                <button
                  className={`btn btn-sm ${timeRange === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setTimeRange('month')}
                >
                  Month
                </button>
              </div>
            </div>
            <div className="card-body">
              <Line data={getActivityData()} />
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className='card-header'><h5 className="card-title">Working Hours</h5></div>
            <div className="card-body">
              {workingHoursView === 'month' ? renderMonthCalendar() : renderDayHours()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 