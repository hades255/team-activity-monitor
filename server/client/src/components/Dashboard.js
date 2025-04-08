import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [timeRange, setTimeRange] = useState('day');
  const { user } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, [timeRange]);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${SERVER_API_PATH}/events/${user.username}`);
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
      const eventDate = new Date(event.eventDatetime);
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
          label: 'Activity',
          data,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        }
      ]
    };
  };

  const getWorkingHours = () => {
    const workingHours = {};
    events.forEach(event => {
      const date = new Date(event.eventDatetime).toISOString().split('T')[0];
      if (!workingHours[date]) {
        workingHours[date] = 0;
      }
      workingHours[date]++;
    });

    const labels = Object.keys(workingHours).sort();
    const data = labels.map(date => workingHours[date] / 60); // Convert to hours

    return {
      labels,
      datasets: [
        {
          label: 'Working Hours',
          data,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
        }
      ]
    };
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Dashboard</h2>
        <div className="btn-group">
          <button
            className={`btn ${timeRange === 'day' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setTimeRange('day')}
          >
            Day
          </button>
          <button
            className={`btn ${timeRange === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setTimeRange('week')}
          >
            Week
          </button>
          <button
            className={`btn ${timeRange === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setTimeRange('month')}
          >
            Month
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Activity Chart</h5>
              <Line data={getActivityData()} />
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Working Hours</h5>
              <Bar data={getWorkingHours()} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Recent Activity</h5>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Event Type</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 10).map((event, index) => (
                  <tr key={index}>
                    <td>{new Date(event.eventDatetime).toLocaleString()}</td>
                    <td>{event.eventType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 