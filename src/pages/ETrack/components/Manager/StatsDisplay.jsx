import React from 'react';
import StatsCard from "../StatsCard";
import { Grid, Card, CardContent, Typography } from '@mui/material';

const StatsDisplay = ({
  selectedDataType,
  filteredRequests,
  filteredPendingEscortCount,
  filteredCompletedEscortCount,
  filteredCoordRequests,
  filteredPendingCoordCount,
  filteredCompletedCoordCount
}) => {
  // สีสำหรับ Patient Escort
  const escortColors = {
    active: "linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)",
    pending: "linear-gradient(135deg, #FFA726 0%, #F57C00 100%)",
    completed: "linear-gradient(135deg, #66BB6A 0%, #43A047 100%)"
  };

  // สีสำหรับ Translator
  const translatorColors = {
    active: "linear-gradient(135deg, #42A5F5 0%, #1976D2 100%)",
    pending: "linear-gradient(135deg, #AB47BC 0%, #8E24AA 100%)",
    completed: "linear-gradient(135deg, #26C6DA 0%, #00ACC1 100%)"
  };

  // ฟังก์ชันสำหรับกรองข้อมูลของวันปัจจุบัน
  const filterTodayData = (requests) => {
    const today = new Date().toISOString().split('T')[0];
    return requests.filter(req => req.request_date === today);
  };

  // กรองข้อมูลสำหรับวันปัจจุบัน
  const todayRequests = filterTodayData(filteredRequests);
  const todayCoordRequests = filterTodayData(filteredCoordRequests);

  const todayPendingEscort = todayRequests.filter(
    req => req.status?.toLowerCase() === "pending"
  ).length;

  const todayCompletedEscort = todayRequests.filter(
    req => req.status?.toLowerCase() === "finished"
  ).length;

  const todayPendingCoord = todayCoordRequests.filter(
    req => req.status?.toLowerCase() === "pending"
  ).length;

  const todayCompletedCoord = todayCoordRequests.filter(
    req => req.status?.toLowerCase() === "finished"
  ).length;

  if (selectedDataType === "patient_escort") {
    return (
      <div className="dashboard-summary">
        <StatsCard 
          title="Active Escort Requests"
          value={todayRequests.length} 
          type="active-requests"
          className="active-requests"
          style={{ background: escortColors.active }}
        />
        
        <StatsCard 
          title="Pending Escort Requests" 
          value={todayPendingEscort}
          type="pending"
          className="pending-escorts"
          style={{ background: escortColors.pending }}
        />

        <StatsCard 
          title="Completed Escort Requests" 
          value={todayCompletedEscort}
          type="completed"
          className="completed-escorts"
          style={{ background: escortColors.completed }}
        />
      </div>
    );
  } 
  
  return (
    <div className="dashboard-summary">
      <StatsCard 
        title="Active Translator Requests" 
        value={todayCoordRequests.length} 
        type="translator"
        className="active-translators"
        style={{ background: translatorColors.active }}
      />
      
      <StatsCard 
        title="Pending Coord Requests" 
        value={todayPendingCoord}
        type="pending"
        className="pending-coord"
        style={{ background: translatorColors.pending }}
      />
      
      <StatsCard 
        title="Completed Coord Requests" 
        value={todayCompletedCoord}
        type="completed"
        className="completed-coord"
        style={{ background: translatorColors.completed }}
      />
  </div>
  );
};

export default StatsDisplay;