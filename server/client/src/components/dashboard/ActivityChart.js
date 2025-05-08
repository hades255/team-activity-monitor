import React from "react";
import { Chart } from "react-chartjs-2";

const ActivityChart = ({ chartData }) => {
  return (
    <div>
      <Chart
        type="bar"
        width={1000}
        height={500}
        data={chartData}
        options={{
          responsive: true,
          scales: {
            x: {
              stacked: true,
            },
            y: {
              stacked: true,
              beginAtZero: true,
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  const value = parseFloat(context.raw);
                  const hours = Math.floor(value);
                  const minutes = Math.round((value - hours) * 60);
                  return `${context.dataset.label}: ${hours}h ${minutes}m`;
                },
              },
            },
          },
        }}
      />
    </div>
  );
};

export default ActivityChart;
