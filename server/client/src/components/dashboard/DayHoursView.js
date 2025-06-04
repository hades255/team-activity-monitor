import React, { useMemo, useCallback } from "react";

const DayHoursView = ({
  selectedDate,
  setSelectedDate,
  setWorkingHoursView,
  events,
}) => {
  const handlePrevDay = useCallback(() => {
    setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)));
  }, [selectedDate, setSelectedDate]);

  const handleNextDay = useCallback(() => {
    setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)));
  }, [selectedDate, setSelectedDate]);

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
      if (activityHours <= 1) activityLevel = 0;
      else if (activityHours <= 6) activityLevel = 1;
      else if (activityHours <= 14) activityLevel = 2;
      else if (activityHours <= 22) activityLevel = 3;
      else if (activityHours <= 30) activityLevel = 4;
      else if (activityHours <= 38) activityLevel = 5;
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
          <h5 className="mb-0">
            {selectedDate.toLocaleDateString()}{" "}
            {
              ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
                selectedDate.getDay()
              ]
            }
          </h5>
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
};

export default DayHoursView;
