import React, { useRef, useState, useCallback, useEffect } from "react";
import { BANNED_APPS, BANNED_APPS_TITLE, HIDDEN_APPS } from "../../contants";

const padding = { top: 20, right: 20, bottom: 40, left: 60 };
const hourHeight = 18;
const minuteWidth = 18;

const DetailedView = ({
  isCollapsedDetailed,
  setIsCollapsedDetailed,
  todayEvents,
}) => {
  const detailedCanvasRef = useRef(null);
  const [tooltip, setTooltip] = useState({
    show: false,
    x: 0,
    y: 0,
    content: "",
  });

  const handleMouseMove = useCallback(
    (e) => {
      const canvas = detailedCanvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) * canvas.width) / rect.width;
      const y = ((e.clientY - rect.top) * canvas.height) / rect.height;

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
            content: `${appName}\n${timeStr}`,
          });
        } else {
          setTooltip({ show: false, x: 0, y: 0, content: "" });
        }
      } else {
        setTooltip({ show: false, x: 0, y: 0, content: "" });
      }
    },
    [todayEvents]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip({ show: false, x: 0, y: 0, content: "" });
  }, []);

  useEffect(() => {
    const canvas = detailedCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    let totalMinutes = 0;

    ctx.clearRect(0, 0, width, height);

    ctx.font = "12px Arial";
    ctx.textAlign = "right";

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

        ctx.fillStyle = "#555";

        ctx.fillText(
          `${targetTime.getHours().toString().padStart(2, "0")}:00`,
          padding.left - 10,
          y + 4
        );

        if (matchingEvent) {
          totalMinutes++;
          if (BANNED_APPS.includes(matchingEvent.window)) {
            ctx.fillStyle = "#ff4444";
          } else if (HIDDEN_APPS.includes(matchingEvent.window)) {
            ctx.fillStyle = "#666666";
          } else {
            ctx.fillStyle = "#4CAF50";
          }
        } else {
          ctx.fillStyle = "#222";
        }

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const legendItems = [
      { color: "#4CAF50", label: "Normal Activity" },
      { color: "#ff4444", label: "Banned App" },
      { color: "#666666", label: "System App" },
    ];

    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    let legendX = padding.left;
    const legendY = height - padding.bottom + 20;

    legendItems.forEach((item, index) => {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(legendX, legendY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#666";
      ctx.fillText(item.label, legendX + 10, legendY + 4);
      legendX += 120;
    });

    ctx.fillStyle = "#888";
    ctx.fillText(
      `Total ${Math.floor(totalMinutes / 60)}h ${
        totalMinutes % 60
      }m in last 24 hours`,
      legendX + 10,
      legendY + 4
    );
    legendX += 120;
  }, [todayEvents, isCollapsedDetailed]);

  return (
    <div className="card my-4">
      <div
        className="card-header"
        style={{ cursor: "pointer" }}
        onClick={() => setIsCollapsedDetailed(!isCollapsedDetailed)}
      >
        <h5 className="card-title">Last 24 Hours (click here to open/hide)</h5>
      </div>
      {isCollapsedDetailed && (
        <div className="">
          <canvas
            ref={detailedCanvasRef}
            width={1200}
            height={500}
            style={{ width: "100%", height: "auto" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
          {tooltip.show && (
            <div
              style={{
                position: "fixed",
                left: tooltip.x + 10,
                top: tooltip.y + 10,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                color: "white",
                padding: "8px 12px",
                borderRadius: "4px",
                fontSize: "14px",
                whiteSpace: "pre-line",
                zIndex: 1000,
                pointerEvents: "none",
              }}
            >
              {tooltip.content}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DetailedView;
