import React from "react";
import { 
  AssignmentTurnedIn, 
  CheckCircle, 
  Language, 
  PendingActions,
  Done
} from '@mui/icons-material';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';

const StatsCard = ({ title, value, type, className }) => {
  // เลือกไอคอนตามประเภท
  const getIcon = () => {
    switch (type) {
      case 'active-requests':
        return <AssignmentTurnedIn />;
      case 'pending':
        return <HourglassBottomIcon />;
      case 'completed':
        return <CheckCircle />;
      case 'translator':
        return <Language />;
      default:
        return <AssignmentTurnedIn />;
    }
  };

  return (
    <div className={`summary-card ${className || ""}`}>
      <div className="card-icon">
        {getIcon()}
      </div>
      <div className="card-content">
        <h3>{title}</h3>
        <div className="card-value">{value}</div>
      </div>
    </div>
  );
};

export default StatsCard;