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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TeamActivity = () => {
  const [events, setEvents] = useState([]);
  const [timeRange, setTimeRange] = useState('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { user } = useAuth();

  useEffect(() => {
    fetchTeamEvents();
  }, [timeRange, selectedDate]);

  const fetchTeamEvents = async () => {
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const res = await axios.get(`${SERVER_API_PATH}/events/team?year=${year}&month=${month}`);
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getActivityData = () => {
    const now = new Date(selectedDate);
    let labels = [];
    let datasets = [];

    if (timeRange === 'day') {
      // Generate labels for 24 hours
      for (let i = 0; i < 24; i++) {
        labels.push(`${i}:00`);
      }
    } else if (timeRange === 'week') {
      // Generate labels for the week
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      labels = days;
    } else if (timeRange === 'month') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        labels.push(i.toString());
      }
    }

    // Group events by user
    const userEvents = {};
    events.forEach(event => {
      if (!userEvents[event.username]) {
        userEvents[event.username] = Array(labels.length).fill(0);
      }
      
      const eventDate = new Date(event.dt);
      let index;
      
      if (timeRange === 'day') {
        if(now.getDate() === eventDate.getDate()) {
          index = eventDate.getHours();
        }
      } else if (timeRange === 'week') {
        // Only include events from the selected week
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (eventDate >= weekStart && eventDate <= weekEnd) {
          index = eventDate.getDay();
        } else {
          return; // Skip events outside the selected week
        }
      } else if (timeRange === 'month') {
        if (now.getMonth() === eventDate.getMonth() && now.getFullYear() === eventDate.getFullYear()) {
          index = eventDate.getDate() - 1;
        }
      }
      
      if (index >= 0 && index < labels.length) {
        userEvents[event.username][index]++;
      }
    });

    // Create dataset for each user
    const colors = [
      'rgb(75, 192, 192)',
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 206, 86)',
      'rgb(153, 102, 255)'
    ];

    let colorIndex = 0;
    for (const [username, data] of Object.entries(userEvents)) {
      datasets.push({
        label: username,
        data: data.map(item => (item / 60).toFixed(2)),
        borderColor: colors[colorIndex % colors.length],
        backgroundColor: colors[colorIndex % colors.length].replace('rgb', 'rgba').replace(')', ', 0.5)'),
        tension: 0.1
      });
      colorIndex++;
    }

    return {
      labels,
      datasets
    };
  };

  const handlePrevPeriod = () => {
    const newDate = new Date(selectedDate);
    if (timeRange === 'day') {
      newDate.setDate(selectedDate.getDate() - 1);
    } else if (timeRange === 'week') {
      newDate.setDate(selectedDate.getDate() - 7);
    } else if (timeRange === 'month') {
      newDate.setMonth(selectedDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(selectedDate);
    if (timeRange === 'day') {
      newDate.setDate(selectedDate.getDate() + 1);
    } else if (timeRange === 'week') {
      newDate.setDate(selectedDate.getDate() + 7);
    } else if (timeRange === 'month') {
      newDate.setMonth(selectedDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const formatDate = () => {
    if (timeRange === 'day') {
      return selectedDate.toLocaleDateString();
    } else if (timeRange === 'week') {
      const start = new Date(selectedDate);
      start.setDate(selectedDate.getDate() - selectedDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    } else if (timeRange === 'month') {
      return selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Team Activity</h2>
        <div className="d-flex align-items-center">
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
      </div>

      <div className="card">
        <div className="card-body">
          <Line
            width={1000}
            height={500}
            data={getActivityData()}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  text: 'Team Activity (Hours)'
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Hours'
                  }
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TeamActivity; 