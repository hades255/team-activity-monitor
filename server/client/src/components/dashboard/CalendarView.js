import React, { useMemo, useCallback } from "react";

const CalendarView = ({
  selectedDate,
  setSelectedDate,
  setWorkingHoursView,
  events,
  year,
  month,
}) => {
  const handlePrevMonth = useCallback(() => {
    setSelectedDate(new Date(year, month - 2, selectedDate.getDate()));
  }, [year, month, selectedDate, setSelectedDate]);

  const handleNextMonth = useCallback(() => {
    setSelectedDate(new Date(year, month, selectedDate.getDate()));
  }, [year, month, selectedDate, setSelectedDate]);

  const handleDateClick = useCallback(
    (date) => {
      setSelectedDate(new Date(date));
      setWorkingHoursView("day");
    },
    [setSelectedDate, setWorkingHoursView]
  );

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
};

export default CalendarView;
