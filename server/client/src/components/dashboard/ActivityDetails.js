import React from "react";
import { BANNED_APPS_TITLE } from "../../contants";

const ActivityDetails = ({ isCollapsed, setIsCollapsed, chartData }) => {
  return (
    <div className="card-body">
      <div
        className="d-flex justify-content-between align-items-center mb-2"
        style={{ cursor: "pointer" }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h5 className="mb-0">Activity Details (click here to open/hide)</h5>
        <i className={`bi bi-chevron-${isCollapsed ? "down" : "up"}`}></i>
      </div>
      <p>
        Total:
        <span className="p-2 text-primary">{`${Math.floor(
          chartData[2] / 1
        )}h ${Math.round((chartData[2] % 1) * 60)}m`}</span>
        Work:
        <span className="p-2 text-success">{`${Math.floor(
          chartData[3] / 1
        )}h ${Math.round((chartData[3] % 1) * 60)}m`}</span>
        Relax:
        <span className="p-2 text-warning">{`${Math.floor(
          chartData[4] / 1
        )}h ${Math.round((chartData[4] % 1) * 60)}m`}</span>
      </p>
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
              {item.type === "banned" ? BANNED_APPS_TITLE[item.key] : item.key}
            </span>
            <span className="col-6">
              {item.value < 60
                ? `${item.value} min`
                : `${Math.floor(item.value / 60)}h ${item.value % 60}min`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityDetails;
