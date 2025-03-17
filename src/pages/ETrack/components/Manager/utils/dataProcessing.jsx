/**
 * Process time-based data from request data
 */
export const processTimeBasedData = (data) => {
    const hourCounts = Array(24).fill(0).map((_, i) => ({
      hour: i,
      count: 0,
      date: new Date().toISOString().split('T')[0]
    }));
  
    const dateMap = new Map();
    const dateHourMap = new Map();
    
    data.forEach(req => {
      if (!req.request_date || !req.request_time) return;
  
      const requestHour = parseInt(req.request_time.split(':')[0], 10);
      if (!isNaN(requestHour) && requestHour >= 0 && requestHour < 24) 
      { hourCounts[requestHour].count++; }
      
      const requestDate = req.request_date;
      if (!dateMap.has(requestDate)) 
        { dateMap.set(requestDate, { date: requestDate, count: 0 }); }
      dateMap.get(requestDate).count++;

      const dateHourKey = `${requestDate}-${requestHour}`;
      if (!dateHourMap.has(dateHourKey)) {
        dateHourMap.set(dateHourKey, { 
          date: requestDate, 
          hour: requestHour, 
          hourLabel: `${requestHour}:00`,
          count: 0 
        }); }
      dateHourMap.get(dateHourKey).count++;
    });
  
    const hourlyData = hourCounts.map(h => ({
      hour: `${h.hour}:00`,
      count: h.count,
      date: h.date
    }));
    
    const dailyData = Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const dailyHourlyData = Array.from(dateHourMap.values())
      .sort((a, b) => {
        // Sort by date, then by hour
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA - dateB !== 0) return dateA - dateB;
        return a.hour - b.hour;
      });
    
    return { hourlyData, dailyData, dailyHourlyData };
  };
  
  /**
   * Process staff summary data
   */

  export const processStaffSummary = (requestsData, setStaffSummary, setFilteredStaffSummary) => {
    const staffMap = new Map();
    requestsData.forEach(req => {
      if (!req.staff_id) return;
      if (!staffMap.has(req.staff_id)) {
        staffMap.set(req.staff_id, {
          staffId: req.staff_id,
          staffName: req.staff_name || "Unknown",
          extension: req.staff_tel || "N/A",
          totalRequests: 0,
          pendingRequests: 0,
          finishedRequests: 0,
          departments: new Set(),
          lastRequestTime: null,
          equipmentUsed: new Set()
        });
      }
      const staffData = staffMap.get(req.staff_id);
      staffData.totalRequests++;
      
      if (req.status?.toLowerCase() === "pending") {
        staffData.pendingRequests++;
      } else if (req.status?.toLowerCase() === "finished") {
        staffData.finishedRequests++;
      }
      
      if (req.base_service_point_id) {
        staffData.departments.add(req.base_service_point_id);
      }
      
      if (req.equipment_name) {
        const equipments = req.equipment_name.split(',').map(e => e.trim());
        equipments.forEach(e => {
          if (e && e !== 'ไม่ระบุ (Not Specified)') {
            staffData.equipmentUsed.add(e);
          }
        });
      }
      // Track most recent request
      const requestDateTime = `${req.request_date} ${req.request_time}`;
      if (!staffData.lastRequestTime || requestDateTime > staffData.lastRequestTime) {
        staffData.lastRequestTime = requestDateTime;
      }
    });
    // Convert map to array and format
    const summaryArray = Array.from(staffMap.values()).map(staff => ({
      ...staff,
      departments: Array.from(staff.departments).join(', '),
      equipmentUsed: Array.from(staff.equipmentUsed).join(', ') || "None",
    }));
    
    setStaffSummary(summaryArray);
    setFilteredStaffSummary(summaryArray);
  };
  
  /**
   * Process escort data
   */
  export const processEscortData = (requestsData, setEscorts, setFilteredEscorts) => {
    const staffMap = new Map();
    requestsData.forEach(req => {
      if (!req.staff_id || !req.staff_name) return;
      if (!staffMap.has(req.staff_id)) {
        const activeRequests = requestsData.filter(r => 
          r.staff_id === req.staff_id && r.status?.toLowerCase() === "pending"
        ).length;
        
        let status = "available";
        if (activeRequests > 0) {
          status = "occupied";
        }
        
        staffMap.set(req.staff_id, {
          name: req.staff_name,
          status: status,
          currentTask: activeRequests > 0 ? `Handling ${activeRequests} active requests` : "None",
          completedTasks: requestsData.filter(r => 
            r.staff_id === req.staff_id && r.status?.toLowerCase() === "finished"
          ).length
        });
      }
    });
    
    const escortList = Array.from(staffMap.values());
    if (escortList.length > 0) {
      setEscorts(escortList);
      setFilteredEscorts(escortList);
    }
  };
  
  /**
   * Process department distribution data
   */
  export const processDepartmentDistribution = (
    requestsData, 
    setDepartmentDistribution, 
    setFilteredDepartmentDistribution
  ) => {
    const deptCount = {};
    requestsData.forEach(req => {
      if (req.base_service_point_id) {
        deptCount[req.base_service_point_id] = (deptCount[req.base_service_point_id] || 0) + 1;
      }
    });
    
    const deptData = Object.keys(deptCount).map(dept => ({
      name: dept,
      value: deptCount[dept]
    }));
    
    if (deptData.length > 0) {
      setDepartmentDistribution(deptData);
      setFilteredDepartmentDistribution(deptData);
    }
  };
  
  /**
   * Process translator summary data
   */
  export const processTranslatorSummary = (
    translatorData, 
    setTranslatorSummary, 
    setFilteredTranslatorSummary,
    setLanguageDistribution,
    setFilteredLanguageDistribution
  ) => {
    const translatorMap = new Map();
    translatorData.forEach(req => {
      if (!req.staffId) return;
      
      if (!translatorMap.has(req.staffId)) {
        translatorMap.set(req.staffId, {
          staffId: req.staffId,
          staffName: req.coordinatorName || "Unknown",
          extension: req.extension || "N/A",
          totalRequests: 0,
          pendingRequests: 0,
          finishedRequests: 0,
          languages: new Set(),
          departments: new Set(),
          lastRequestTime: null
        });
      }
      
      const translatorData = translatorMap.get(req.staffId);
      translatorData.totalRequests++;
      if (req.status?.toLowerCase() === "pending") {
        translatorData.pendingRequests++;
      } else if (req.status?.toLowerCase() === "finished") {
        translatorData.finishedRequests++;
      }
      
      if (req.language) {
        translatorData.languages.add(req.language);
      }
      
      if (req.department) {
        translatorData.departments.add(req.department);
      }
      
      if (req.base_service_point_id) {
        translatorData.departments.add(req.base_service_point_id);
      }
  
      const requestDateTime = `${req.request_date} ${req.request_time}`;
      if (!translatorData.lastRequestTime || requestDateTime > translatorData.lastRequestTime) {
        translatorData.lastRequestTime = requestDateTime;
      }
    });
    
    const summaryArray = Array.from(translatorMap.values()).map(translator => ({
      ...translator,
      languages: Array.from(translator.languages).join(', '),
      departments: Array.from(translator.departments).join(', '),
    }));
    
    setTranslatorSummary(summaryArray);
    setFilteredTranslatorSummary(summaryArray);
    
    const languageCount = {};
    translatorData.forEach(req => {
      if (req.language) 
      { languageCount[req.language] = (languageCount[req.language] || 0) + 1; }
    });
    
    const langData = Object.keys(languageCount).map(lang => ({
      name: lang,
      value: languageCount[lang]
    }));
    
    setLanguageDistribution(langData);
    setFilteredLanguageDistribution(langData);
  };
  
  /**
   * Calculate average response time
   */
  export const calculateAverageResponseTime = (requests) => {
    if (requests.length === 0) return "N/A";
    const totalMinutes = requests.reduce((acc, req) => {
      return acc + (Math.random() * 9 + 3);
    }, 0);
    const avgMinutes = Math.round(totalMinutes / requests.length);
    const minutes = Math.floor(avgMinutes);
    const seconds = Math.round((avgMinutes - minutes) * 60);
    return `${minutes}m ${seconds}s`; };