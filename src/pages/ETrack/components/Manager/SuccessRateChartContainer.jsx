import React from "react";
import ChartContainer from "../ChartContainer";
import SuccessRateChart from "./SuccessRateChart";

const SuccessRateChartContainer = ({
  title,
  data,
  chartColors,
  currentUser,
  currentDateTime,
  selectedDataType,
}) => {
  return (
    <ChartContainer title={title}>
      <SuccessRateChart
        title=""  // Empty title since the container already has one
        data={data}
        chartColors={chartColors}
        currentUser={currentUser}
        currentDateTime={currentDateTime}
        selectedDataType={selectedDataType}
      />
    </ChartContainer>
  );
};

export default SuccessRateChartContainer;