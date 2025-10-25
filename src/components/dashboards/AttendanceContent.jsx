import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, ChevronDown, Calendar, List, Info, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Users, UserCheck, UserX } from 'lucide-react';
import Chart from 'react-apexcharts';
import apiClient from '../../services/api';

const SegmentedGauge = ({ percentage, label = "Present", absentDays = 0 }) => {
  // Calculate which segments should be filled based on percentage
  const getSegmentColor = (segmentIndex) => {
    // First segment (0-50%): Green for present
    // Second segment (50-100%): Red for absent
    const segmentThreshold = (segmentIndex + 1) * 50; // Each segment represents 50%
    
    if (segmentIndex === 0) {
      // First segment: Green for present percentage
      if (percentage >= segmentThreshold) {
        return '#10b981'; // Fully green
      } else if (percentage > 0) {
        return '#10b981'; // Partially green
      }
      return '#f3f4f6'; // Gray (unfilled)
    } else {
      // Second segment: Red for absent percentage - only show if there are actual absent days
      const absentPercentage = 100 - percentage;
      if (absentDays > 0) {
        if (absentPercentage >= 50) {
          return '#ef4444'; // Fully red
        } else if (absentPercentage > 0) {
          return '#ef4444'; // Partially red
        }
      }
      return '#f3f4f6'; // Gray (unfilled) - no absent days
    }
  };

  // Calculate the arc path for percentage fill with circular ends
  const getArcPath = (startAngle, endAngle, radius, strokeWidth) => {
    const innerRadius = radius - strokeWidth;
    const centerX = 100;
    const centerY = 100;
    
    // Calculate the main arc points
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const innerStart = polarToCartesian(centerX, centerY, innerRadius, endAngle);
    const innerEnd = polarToCartesian(centerX, centerY, innerRadius, startAngle);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return `M ${start.x} ${start.y} 
            A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}
            L ${innerEnd.x} ${innerEnd.y}
            A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y}
            Z`;
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  // Segment angles (200° total, divided into 2 segments with gap)
  const gapSize = 20; // degrees
  const totalAngle = 200;
  const segmentAngle = (totalAngle - gapSize) / 2;
  
  const segments = [
    { start: -90, end: -90 + segmentAngle, color: getSegmentColor(0) },
    { start: -90 + segmentAngle + gapSize, end: 90, color: getSegmentColor(1) }
  ];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      width: '100%'
    }}>
      <svg viewBox="0 0 200 140" style={{ width: '100%', maxWidth: '300px' }}>
        {/* Draw each segment */}
        {segments.map((segment, index) => {
          const startAngle = segment.start;
          const endAngle = segment.end;
          const radius = 80;
          const strokeWidth = 20;
          const innerRadius = radius - strokeWidth;
          
          // Calculate circular end cap positions
          const startCapPos = polarToCartesian(100, 100, radius - strokeWidth/2, endAngle);
          const endCapPos = polarToCartesian(100, 100, radius - strokeWidth/2, startAngle);
          
          return (
            <g key={index}>
              <path
                d={getArcPath(startAngle, endAngle, radius, strokeWidth)}
                fill={segment.color}
                style={{
                  transition: 'fill 0.3s ease'
                }}
              />
              {/* Circular end caps */}
              <circle
                cx={startCapPos.x}
                cy={startCapPos.y}
                r={strokeWidth/2}
                fill={segment.color}
              />
              <circle
                cx={endCapPos.x}
                cy={endCapPos.y}
                r={strokeWidth/2}
                fill={segment.color}
              />
            </g>
          );
        })}
        
        {/* Center text - percentage */}
        <text
          x="100"
          y="90"
          textAnchor="middle"
          style={{
            fontSize: '30px',
            fontWeight: 500,
            fill: '#111827'
          }}
        >
          {percentage}%
        </text>
        
        {/* Center text - label */}
        <text
          x="100"
          y="110"
          textAnchor="middle"
          style={{
            fontSize: '10px',
            fontWeight: 400,
            fill: '#6b7280'
          }}
        >
          {label}
        </text>
      </svg>
    </div>
  );
};

const AttendanceContent = () => {
  // Location state management
  const [activeScope, setActiveScope] = useState('State');
  const [selectedLocation, setSelectedLocation] = useState('Rajasthan');
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState(null);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [selectedGPId, setSelectedGPId] = useState(null);
  const [dropdownLevel, setDropdownLevel] = useState('districts');
  const [selectedDistrictForHierarchy, setSelectedDistrictForHierarchy] = useState(null);
  const [selectedBlockForHierarchy, setSelectedBlockForHierarchy] = useState(null);
  
  // UI controls state
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [gramPanchayats, setGramPanchayats] = useState([]);
  const [loadingGPs, setLoadingGPs] = useState(false);
  
  // Attendance specific state
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [activePerformance, setActivePerformance] = useState('Time');

  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  // Date selection state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null); // null means not selected
  const [selectedDay, setSelectedDay] = useState(null); // null means not selected
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [selectionStep, setSelectionStep] = useState('year'); // 'year', 'month', 'day'
  
  // Date range state
  const [selectedDateRange, setSelectedDateRange] = useState('Today');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isCustomRange, setIsCustomRange] = useState(false);
  
  const scopeButtons = ['State', 'Districts', 'Blocks', 'GPs'];
  const performanceButtons = ['Time', 'Location'];
  const filterButtons = ['All', 'Present', 'Absent', 'Leave', 'Holiday'];

  // Predefined date ranges
  const dateRanges = [
    { label: 'Today', value: 'today', days: 0 },
    { label: 'Yesterday', value: 'yesterday', days: 1 },
    { label: 'Last 7 Days', value: 'last7days', days: 7 },
    { label: 'Last 30 Days', value: 'last30days', days: 30 },
    { label: 'Last 60 Days', value: 'last60days', days: 60 },
    { label: 'Custom', value: 'custom', days: null }
  ];

  // Months array
  const months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  // Helper functions for location management
  const trackTabChange = (scope) => {
    console.log('Tab changed to:', scope);
  };
  
  const trackDropdownChange = (location) => {
    console.log('Dropdown changed to:', location);
  };
  
  const getCurrentLocationInfo = () => {
    return {
      scope: activeScope,
      location: selectedLocation,
      districtId: selectedDistrictId,
      blockId: selectedBlockId,
      gpId: selectedGPId
    };
  };
  
  const updateLocationSelection = (scope, location, locationId, districtId, blockId, gpId, changeType) => {
    console.log('🔄 updateLocationSelection called:', { scope, location, locationId, districtId, blockId, gpId, changeType });
    setActiveScope(scope);
    setSelectedLocation(location);
    setSelectedLocationId(locationId);
    setSelectedDistrictId(districtId);
    setSelectedBlockId(blockId);
    setSelectedGPId(gpId);
    console.log('✅ Location state updated');
  };

  // Fetch districts from API
  const fetchDistricts = async () => {
    try {
      setLoadingDistricts(true);
      const response = await apiClient.get('/geography/districts?skip=0&limit=100');
      console.log('Districts API Response:', response.data);
      setDistricts(response.data);
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Fetch blocks from API
  const fetchBlocks = async () => {
    try {
      setLoadingBlocks(true);
      const response = await apiClient.get('/geography/blocks?skip=0&limit=100');
      console.log('Blocks API Response:', response.data);
      setBlocks(response.data);
    } catch (error) {
      console.error('Error fetching blocks:', error);
    } finally {
      setLoadingBlocks(false);
    }
  };

  // Fetch gram panchayats from API
  const fetchGramPanchayats = async () => {
    try {
      setLoadingGPs(true);
      console.log('🔄 Fetching GPs...');
      const response = await apiClient.get('/geography/grampanchayats?skip=0&limit=100');
      console.log('✅ GPs API Response:', response.data);
      console.log('📊 Number of GPs fetched:', response.data?.length || 0);
      setGramPanchayats(response.data);
    } catch (error) {
      console.error('❌ Error fetching gram panchayats:', error);
      setGramPanchayats([]);
    } finally {
      setLoadingGPs(false);
    }
  };

  // Handle scope change
  const handleScopeChange = (scope) => {
    console.log('Scope changed to:', scope);
    trackTabChange(scope);
    setActiveScope(scope);
    setShowLocationDropdown(false);
    
    // Use updateLocationSelection like dashboard for proper state management
    if (scope === 'State') {
      // For State scope, set Rajasthan as default and disable dropdown
      updateLocationSelection('State', 'Rajasthan', null, null, null, null, 'tab_change');
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    } else if (scope === 'Districts') {
      // Set first district as selected (districts are already loaded)
      if (districts.length > 0) {
        updateLocationSelection('Districts', districts[0].name, districts[0].id, districts[0].id, null, null, 'tab_change');
      }
      // Fetch blocks for attendance chart
      fetchBlocks();
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    } else if (scope === 'Blocks') {
      // For blocks, start with districts level
      fetchBlocks();
      fetchGramPanchayats();
      updateLocationSelection('Blocks', 'Select District', null, null, null, null, 'tab_change');
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    } else if (scope === 'GPs') {
      // For GPs, start with districts level
      fetchBlocks();
      fetchGramPanchayats();
      updateLocationSelection('GPs', 'Select District', null, null, null, null, 'tab_change');
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    }
  };

  // Get location options based on current scope and dropdown level
  const getLocationOptions = () => {
    if (activeScope === 'Districts') {
      return districts;
    } else if (activeScope === 'Blocks') {
      if (dropdownLevel === 'districts') {
        return districts;
      } else if (dropdownLevel === 'blocks') {
        return blocks.filter(block => block.district_id === selectedDistrictForHierarchy?.id);
      }
    } else if (activeScope === 'GPs') {
      if (dropdownLevel === 'districts') {
        return districts;
      } else if (dropdownLevel === 'blocks') {
        return blocks.filter(block => block.district_id === selectedDistrictForHierarchy?.id);
      } else if (dropdownLevel === 'gps') {
        const filteredGPs = gramPanchayats.filter(gp => gp.block_id === selectedBlockForHierarchy?.id);
        console.log('🔍 Filtering GPs:', {
          totalGPs: gramPanchayats.length,
          selectedBlockId: selectedBlockForHierarchy?.id,
          filteredGPsCount: filteredGPs.length,
          filteredGPs: filteredGPs
        });
        return filteredGPs;
      }
    }
    return [];
  };

  // Handle hierarchical selection for blocks and GPs
  const handleHierarchicalSelection = (location) => {
    if (activeScope === 'Blocks') {
      if (dropdownLevel === 'districts') {
        // District selected, now show blocks
        setSelectedDistrictForHierarchy(location);
        setDropdownLevel('blocks');
        setSelectedLocation('Select Block');
        fetchBlocks();
      } else if (dropdownLevel === 'blocks') {
        // Block selected
        trackDropdownChange(location.name, location.id, selectedDistrictForHierarchy.id);
        updateLocationSelection('Blocks', location.name, location.id, selectedDistrictForHierarchy.id, location.id, null, 'dropdown_change');
        console.log('Selected block ID:', location.id, 'Name:', location.name, 'District ID:', selectedDistrictForHierarchy.id);
        setShowLocationDropdown(false);
      }
    } else if (activeScope === 'GPs') {
      if (dropdownLevel === 'districts') {
        // District selected, now show blocks
        setSelectedDistrictForHierarchy(location);
        setDropdownLevel('blocks');
        setSelectedLocation('Select Block');
        fetchBlocks();
      } else if (dropdownLevel === 'blocks') {
        // Block selected, now show GPs
        setSelectedBlockForHierarchy(location);
        setDropdownLevel('gps');
        setSelectedLocation('Select GP');
        fetchGramPanchayats();
      } else if (dropdownLevel === 'gps') {
        // GP selected
        trackDropdownChange(location.name, location.id, selectedBlockForHierarchy.id);
        updateLocationSelection('GPs', location.name, location.id, selectedDistrictForHierarchy.id, selectedBlockForHierarchy.id, location.id, 'dropdown_change');
        console.log('Selected GP ID:', location.id, 'Name:', location.name, 'Block ID:', selectedBlockForHierarchy.id, 'District ID:', selectedDistrictForHierarchy.id);
        setShowLocationDropdown(false);
      }
    }
  };

  // Fetch attendance analytics data from API
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoadingAnalytics(true);
      setAnalyticsError(null);

      console.log('🔄 ===== ATTENDANCE ANALYTICS API CALL =====');
      console.log('📍 Current State:', {
        activeScope,
        selectedLocation,
        selectedDistrictId,
        selectedBlockId,
        selectedGPId,
        startDate,
        endDate
      });

      // Build query parameters based on selected scope
      const params = new URLSearchParams();

      // Determine level based on active scope
      let level = 'DISTRICT'; // Default for State scope
      if (activeScope === 'Districts') {
        level = 'BLOCK';
      } else if (activeScope === 'Blocks') {
        level = 'VILLAGE';
      } else if (activeScope === 'GPs') {
        level = 'VILLAGE';
      }
      params.append('level', level);
      console.log('📊 Level:', level);

      // Add geography IDs based on selection
      if (activeScope === 'Districts' && selectedDistrictId) {
        params.append('district_id', selectedDistrictId);
        console.log('🏙️  District ID:', selectedDistrictId);
      } else if (activeScope === 'Blocks' && selectedBlockId) {
        params.append('block_id', selectedBlockId);
        console.log('🏘️  Block ID:', selectedBlockId);
      } else if (activeScope === 'GPs' && selectedGPId) {
        params.append('gp_id', selectedGPId);
        console.log('🏡 GP ID:', selectedGPId);
      }

      // Add date range if available
      if (startDate) {
        params.append('start_date', startDate);
        console.log('📅 Start Date:', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
        console.log('📅 End Date:', endDate);
      }

      // Add limit
      params.append('limit', '500');

      const url = `/attendance/analytics?${params.toString()}`;
      console.log('🌐 Full API URL:', url);
      console.log('🔗 Complete URL:', `${apiClient.defaults.baseURL}${url}`);
      
      // Check if token exists
      const token = localStorage.getItem('access_token');
      console.log('🔑 Token Status:', token ? 'Present' : 'Missing');
      if (token) {
        console.log('🔑 Token Preview:', token.substring(0, 20) + '...');
      }
      
      const response = await apiClient.get(url);
      
      console.log('✅ Attendance Analytics API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      console.log('📦 Response Data Structure:', {
        geo_type: response.data?.geo_type,
        response_count: response.data?.response?.length,
        sample_data: response.data?.response?.slice(0, 2)
      });
      
      setAnalyticsData(response.data);
      
      // Calculate and log aggregated counts
      const aggregated = {
        total_contractors: 0,
        present_count: 0,
        absent_count: 0,
        attendance_rate: 0
      };
      
      response.data?.response?.forEach(item => {
        aggregated.total_contractors += item.total_contractors || 0;
        aggregated.present_count += item.present_count || 0;
        aggregated.absent_count += item.absent_count || 0;
        aggregated.attendance_rate += item.attendance_rate || 0;
      });
      
      // Calculate average attendance rate
      if (response.data?.response?.length > 0) {
        aggregated.attendance_rate = aggregated.attendance_rate / response.data.response.length;
      }
      
      console.log('📈 Aggregated Counts:', aggregated);
      console.log('🔄 ===== END ATTENDANCE ANALYTICS API CALL =====\n');
      
    } catch (error) {
      console.error('❌ ===== ATTENDANCE ANALYTICS API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END ATTENDANCE ANALYTICS API ERROR =====\n');
      
      setAnalyticsError(error.message || 'Failed to fetch analytics data');
      setAnalyticsData(null);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [activeScope, selectedLocation, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate]);

  // Date range functions
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => currentYear - i);
  };

  const generateDays = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  // Get display text based on selected date range
  const getDateDisplayText = () => {
    if (isCustomRange && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return `${start.getDate()}/${start.getMonth() + 1}/${start.getFullYear()} - ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
    } else if (isCustomRange && startDate) {
      const start = new Date(startDate);
      return `${start.getDate()}/${start.getMonth() + 1}/${start.getFullYear()} - Select End Date`;
    } else {
      return selectedDateRange;
    }
  };

  // Get the current filter type based on what's selected
  const getCurrentFilterType = () => {
    if (selectedDay && selectedMonth) {
      return 'day';
    } else if (selectedMonth) {
      return 'month';
    } else {
      return 'year';
    }
  };

  // Handle year selection
  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setSelectionStep('month');
    console.log(`Year selected: ${year}`);
  };

  // Handle month selection
  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    setSelectionStep('day');
    console.log(`Month selected: ${months[month - 1].name} ${selectedYear}`);
  };

  // Handle day selection
  const handleDaySelect = (day) => {
    setSelectedDay(day);
    console.log(`Day selected: ${months[selectedMonth - 1].name} ${day}, ${selectedYear}`);
  };

  // Skip to next step or finish
  const handleSkip = () => {
    if (selectionStep === 'month') {
      setSelectionStep('day');
    } else if (selectionStep === 'day') {
      setShowDateDropdown(false);
    }
  };

  // Finish selection
  const handleFinish = () => {
    setShowDateDropdown(false);
    console.log(`Final selection: ${getCurrentFilterType()} - ${getDateDisplayText()}`);
  };

  // Reset selection
  const handleReset = () => {
    setSelectedMonth(null);
    setSelectedDay(null);
    setSelectionStep('year');
  };

  // Toggle date dropdown on click
  const handleCalendarClick = () => {
    setShowDateDropdown(!showDateDropdown);
    if (!showDateDropdown) {
      setSelectionStep('year');
    }
  };

  // Handle predefined date range selection
  const handleDateRangeSelection = (range) => {
    if (range.value === 'custom') {
      setIsCustomRange(true);
      setSelectedDateRange('Custom');
      setStartDate(null);
      setEndDate(null);
      // Don't close dropdown for custom - let user select dates
    } else {
      setIsCustomRange(false);
      setSelectedDateRange(range.label);
      
      const today = new Date();
      
      // For "Today" and "Yesterday", both start and end dates should be the same
      if (range.value === 'today') {
        // Today: start = today, end = today
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
      } else if (range.value === 'yesterday') {
        // Yesterday: start = yesterday, end = yesterday
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        setStartDate(yesterday.toISOString().split('T')[0]);
        setEndDate(yesterday.toISOString().split('T')[0]);
      } else {
        // For ranges like "Last 7 Days", "Last 30 Days"
        // start = today - N days, end = today
        const start = new Date(today);
        start.setDate(today.getDate() - range.days);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
      }
      
      setShowDateDropdown(false);
    }
  };

  // Handle custom date selection
  const handleCustomDateSelection = (date) => {
    if (!startDate) {
      setStartDate(date);
    } else if (!endDate) {
      if (new Date(date) >= new Date(startDate)) {
        setEndDate(date);
        setShowDateDropdown(false);
      } else {
        // If end date is before start date, swap them
        setEndDate(startDate);
        setStartDate(date);
        setShowDateDropdown(false);
      }
    }
  };

  // Validate selected day when month or year changes
  useEffect(() => {
    if (selectedMonth && selectedDay) {
      const daysInSelectedMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      if (selectedDay > daysInSelectedMonth) {
        setSelectedDay(daysInSelectedMonth);
      }
    }
  }, [selectedYear, selectedMonth, selectedDay]);

  // Log date changes for debugging
  useEffect(() => {
    console.log(`Selected date: ${getCurrentFilterType()} - ${getDateDisplayText()}`);
  }, [selectedYear, selectedMonth, selectedDay]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('[data-location-dropdown]') && 
          !event.target.closest('[data-date-dropdown]')) {
        setShowLocationDropdown(false);
        setShowDateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch districts immediately when attendance page loads
  useEffect(() => {
    fetchDistricts();
  }, []);

  // Load additional data based on scope
  useEffect(() => {
    if (activeScope === 'Districts' && districts.length === 0) {
      fetchDistricts();
    }
  }, [activeScope, districts.length]);

  // Log current location info whenever it changes
  useEffect(() => {
    const locationInfo = getCurrentLocationInfo();
    console.log('Current Location Info:', locationInfo);
  }, [activeScope, selectedLocation, selectedLocationId, selectedDistrictId, selectedBlockId, selectedGPId]);

  // Fetch analytics data for overview section when scope, location, or date range changes
  useEffect(() => {
    console.log('🔄 Analytics useEffect triggered:', {
      activeScope,
      districtsLength: districts.length,
      selectedDistrictId,
      selectedBlockId,
      selectedGPId,
      startDate,
      endDate
    });
    
    // For State scope, we can call API immediately (no need to wait for districts)
    if (activeScope === 'State') {
      console.log('📡 Calling API for State scope');
      fetchAnalyticsData();
      return;
    }
    
    // For other scopes, check if we have the necessary location data loaded
    if (activeScope === 'Districts' && !selectedDistrictId) {
      console.log('⏳ Waiting for district selection');
      return; // Wait for district selection
    }
    if (activeScope === 'Blocks' && !selectedBlockId) {
      console.log('⏳ Waiting for block selection');
      return; // Wait for block selection
    }
    if (activeScope === 'GPs' && !selectedGPId) {
      console.log('⏳ Waiting for GP selection');
      return; // Wait for GP selection
    }
    
    console.log('📡 Calling API for other scopes');
    fetchAnalyticsData();
  }, [activeScope, selectedLocation, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate, districts, blocks, gramPanchayats, fetchAnalyticsData]);

  // Helper function to calculate attendance metrics from API data
  const calculateAttendanceMetrics = () => {
    if (!analyticsData?.response) {
      return {
        total_contractors: 0,
        present_count: 0,
        absent_count: 0,
        attendance_rate: 0
      };
    }

    const metrics = {
      total_contractors: 0,
      present_count: 0,
      absent_count: 0,
      attendance_rate: 0
    };

    analyticsData.response.forEach(item => {
      metrics.total_contractors += item.total_contractors || 0;
      metrics.present_count += item.present_count || 0;
      metrics.absent_count += item.absent_count || 0;
      metrics.attendance_rate += item.attendance_rate || 0;
    });

    // Calculate average attendance rate
    if (analyticsData.response.length > 0) {
      metrics.attendance_rate = metrics.attendance_rate / analyticsData.response.length;
    }

    return metrics;
  };

  // Helper function to format numbers
  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  // Helper function to calculate total days in a month minus Sundays
  const calculateTotalWorkingDays = (date) => {
    const year = new Date(date).getFullYear();
    const month = new Date(date).getMonth();
    
    // Get the first and last day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let totalDays = lastDay.getDate();
    let sundayCount = 0;
    
    // Count Sundays in the month
    for (let day = 1; day <= totalDays; day++) {
      const currentDate = new Date(year, month, day);
      if (currentDate.getDay() === 0) { // Sunday
        sundayCount++;
      }
    }
    
    return totalDays - sundayCount;
  };

  // Helper function to calculate working days for a specific date range
  const calculateWorkingDaysForRange = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // If it's the same day (like "Today" selection)
    if (startDate === endDate) {
      // Check if it's a Sunday
      if (start.getDay() === 0) {
        return 0; // Sunday, no working days
      }
      return 1; // Single working day
    }
    
    // For date ranges, count working days (excluding Sundays)
    let workingDays = 0;
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      if (currentDate.getDay() !== 0) { // Not Sunday
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
  };

  // Helper function to calculate attendance percentage and working days
  const calculateAttendancePercentage = () => {
    if (!analyticsData?.response) {
      return {
        presentPercentage: 0,
        totalWorkingDays: 0,
        presentDays: 0,
        absentDays: 0
      };
    }

    const metrics = calculateAttendanceMetrics();
    
    // Calculate total working days for the selected date range
    const currentStartDate = startDate || new Date().toISOString().split('T')[0];
    const currentEndDate = endDate || new Date().toISOString().split('T')[0];
    const totalWorkingDays = calculateWorkingDaysForRange(currentStartDate, currentEndDate);
    
    console.log('📅 Working Days Calculation:', {
      startDate: currentStartDate,
      endDate: currentEndDate,
      totalWorkingDays,
      presentCount: metrics.present_count,
      absentCount: metrics.absent_count
    });
    
    // Calculate present percentage
    const presentPercentage = totalWorkingDays > 0 
      ? Math.round((metrics.present_count / totalWorkingDays) * 100)
      : 0;

    return {
      presentPercentage: Math.min(presentPercentage, 100), // Cap at 100%
      totalWorkingDays,
      presentDays: metrics.present_count,
      absentDays: metrics.absent_count
    };
  };

  // Get dynamic attendance metrics from API data
  const getAttendanceMetrics = () => {
    const metrics = calculateAttendanceMetrics();
    
    return [
      {
        title: 'Total Vendor/Supervisor',
        value: loadingAnalytics ? '...' : formatNumber(metrics.total_contractors),
        icon: List,
        color: '#3b82f6'
      },
      {
        title: 'Vendor/Supervisor Present',
        value: loadingAnalytics ? '...' : formatNumber(metrics.present_count),
        icon: UserCheck,
        color: '#10b981'
      },
      {
        title: 'Vendor/Supervisor Absent',
        value: loadingAnalytics ? '...' : formatNumber(metrics.absent_count),
        icon: UserX,
        color: '#ef4444'
      }
    ];
  };

  const attendanceMetrics = getAttendanceMetrics();
  
  return (
    <div>
      {/* Header Section */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '5px 15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Left side - Dashboard title */}
        <div>
          <h1 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#374151',
            margin: 0
          }}>
            Attendance
          </h1>
        </div>

        {/* Right side - Scope buttons and Location dropdown */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* Scope segmented buttons */}
          <div style={{
            display: 'flex',
            backgroundColor: '#f3f4f6',
            borderRadius: '12px',
            padding: '4px',
            gap: '2px'
          }}>
            {scopeButtons.map((scope) => (
              <button
                key={scope}
                onClick={() => handleScopeChange(scope)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: activeScope === scope ? '#10b981' : 'transparent',
                  color: activeScope === scope ? 'white' : '#6b7280',
                  transition: 'all 0.2s'
                }}
              >
                {scope}
              </button>
            ))}
          </div>

          {/* Location dropdown */}
          <div 
            data-location-dropdown
            style={{
              position: 'relative',
              minWidth: '200px'
            }}
          >
            <button 
              onClick={() => activeScope !== 'State' && setShowLocationDropdown(!showLocationDropdown)}
              disabled={activeScope === 'State'}
              style={{
                width: '100%',
                padding: '5px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                backgroundColor: activeScope === 'State' ? '#f9fafb' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: activeScope === 'State' ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                color: activeScope === 'State' ? '#9ca3af' : '#6b7280',
                opacity: activeScope === 'State' ? 0.6 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
                <span>{selectedLocation}</span>
              </div>
              <ChevronDown style={{ 
                width: '16px', 
                height: '16px', 
                color: activeScope === 'State' ? '#d1d5db' : '#9ca3af' 
              }} />
            </button>
            
            {/* Location Dropdown Menu */}
            {showLocationDropdown && activeScope !== 'State' && (
              <div 
                key={`dropdown-${activeScope}`}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  marginTop: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}
              >
                {/* Breadcrumb/Back button for hierarchical navigation */}
                {((activeScope === 'Blocks' && dropdownLevel === 'blocks') || 
                  (activeScope === 'GPs' && (dropdownLevel === 'blocks' || dropdownLevel === 'gps'))) && (
                  <div style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #f3f4f6',
                    backgroundColor: '#f9fafb',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onClick={() => {
                    if (activeScope === 'Blocks' && dropdownLevel === 'blocks') {
                      // Go back to districts
                      setDropdownLevel('districts');
                      setSelectedDistrictForHierarchy(null);
                      setSelectedLocation('Select District');
                    } else if (activeScope === 'GPs' && dropdownLevel === 'blocks') {
                      // Go back to districts
                      setDropdownLevel('districts');
                      setSelectedDistrictForHierarchy(null);
                      setSelectedLocation('Select District');
                    } else if (activeScope === 'GPs' && dropdownLevel === 'gps') {
                      // Go back to blocks
                      setDropdownLevel('blocks');
                      setSelectedBlockForHierarchy(null);
                      setSelectedLocation('Select Block');
                    }
                  }}>
                    <span>←</span>
                    <span>
                      {activeScope === 'Blocks' && dropdownLevel === 'blocks' ? 'Back to Districts' :
                       activeScope === 'GPs' && dropdownLevel === 'blocks' ? 'Back to Districts' :
                       activeScope === 'GPs' && dropdownLevel === 'gps' ? 'Back to Blocks' : ''}
                    </span>
                  </div>
                )}
                
                {/* Level indicator */}
                {((activeScope === 'Blocks' && dropdownLevel !== 'districts') || 
                  (activeScope === 'GPs' && dropdownLevel !== 'districts')) && (
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    fontSize: '12px',
                    color: '#6b7280',
                    fontWeight: '500',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    {activeScope === 'Blocks' && dropdownLevel === 'blocks' ? 
                      `Blocks in ${selectedDistrictForHierarchy?.name}` :
                     activeScope === 'GPs' && dropdownLevel === 'blocks' ? 
                      `Blocks in ${selectedDistrictForHierarchy?.name}` :
                     activeScope === 'GPs' && dropdownLevel === 'gps' ? 
                      `GPs in ${selectedBlockForHierarchy?.name}` : ''}
                  </div>
                )}
                
                {(loadingDistricts && activeScope === 'Districts') || (loadingBlocks && activeScope === 'Blocks') || (loadingGPs && activeScope === 'GPs') ? (
                  <div style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    color: '#6b7280',
                    textAlign: 'center'
                  }}>
                    Loading {activeScope.toLowerCase()}...
                  </div>
                ) : (
                  getLocationOptions().map((location, index) => (
                    <div
                      key={`${activeScope}-${location.id}`}
                      onClick={() => {
                        if (activeScope === 'Districts') {
                          // Direct selection for districts
                          trackDropdownChange(location.name, location.id, location.id);
                          updateLocationSelection('Districts', location.name, location.id, location.id, null, null, 'dropdown_change');
                          console.log('Selected district ID:', location.id, 'Name:', location.name);
                          setShowLocationDropdown(false);
                        } else if (activeScope === 'Blocks' || activeScope === 'GPs') {
                          // Use hierarchical selection for blocks and GPs
                          handleHierarchicalSelection(location);
                        }
                      }}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        backgroundColor: selectedLocation === location.name ? '#f3f4f6' : 'transparent',
                        borderBottom: index < getLocationOptions().length - 1 ? '1px solid #f3f4f6' : 'none'
                      }}
                    >
                      {location.name}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location Indicator */}
      <div style={{
        padding: '10px 0px 0px 16px',
      }}>
        <span style={{
          fontSize: '14px',
          color: '#6B7280',
          fontWeight: '600'
        }}>
          {activeScope === 'State' ? selectedLocation : `Rajasthan / ${selectedLocation}`}
        </span>
      </div>

      {/* Overview Section */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        marginLeft: '16px',
        marginRight: '16px',
        marginTop: '6px',
        borderRadius: '8px',
        border: '1px solid lightgray'
      }}>
        {/* Overview Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              Overview
            </h2>
            <span style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              • {getDateDisplayText()}
            </span>
          </div>
          <div 
            onClick={handleCalendarClick}
            data-date-dropdown
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#6b7280',
              fontSize: '14px',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s'
            }}
          >
            <Calendar style={{ width: '16px', height: '16px' }} />
            <span>{getDateDisplayText()}</span>
            <ChevronDown style={{ width: '16px', height: '16px' }} />
            
            {/* Modern Date Range Picker */}
            {showDateDropdown && (
              <div 
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  marginTop: '8px',
                  width: '600px',
                  maxWidth: '90vw',
                  display: 'flex',
                  overflow: 'hidden'
                }}
              >
                {/* Left Sidebar - Predefined Ranges */}
                <div style={{
                  width: '200px',
                  backgroundColor: '#f8fafc',
                  borderRight: '1px solid #e2e8f0',
                  padding: '16px 0'
                }}>
                  <div style={{ padding: '0 16px 12px', borderBottom: '1px solid #e2e8f0' }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#1e293b' 
                    }}>
                      Quick Select
                    </h3>
                  </div>

                  {dateRanges.map((range, index) => (
                    <div
                      key={range.value}
                      onClick={() => handleDateRangeSelection(range)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: range.value === 'custom' ? '#10b981' : '#475569',
                        backgroundColor: selectedDateRange === range.label ? '#f0fdf4' : 'transparent',
                        borderLeft: selectedDateRange === range.label ? '3px solid #10b981' : '3px solid transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      {range.label}
                    </div>
                  ))}
                </div>

                {/* Right Side - Calendar View */}
                <div style={{
                  flex: 1,
                  padding: '16px',
                  minHeight: '300px'
                }}>
                  {isCustomRange ? (
                    <div>
                      <h3 style={{ 
                        margin: '0 0 16px 0', 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#1e293b' 
                      }}>
                        Select Date Range
                      </h3>
                      
                      {/* Custom Date Inputs */}
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <div>
                          <label style={{ 
                            display: 'block', 
                            fontSize: '12px', 
                            color: '#64748b', 
                            marginBottom: '4px' 
                          }}>
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={startDate || ''}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px',
                              width: '140px'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ 
                            display: 'block', 
                            fontSize: '12px',
                            color: '#64748b', 
                            marginBottom: '4px' 
                          }}>
                            End Date
                          </label>
                          <input
                            type="date"
                            value={endDate || ''}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px',
                              width: '140px'
                            }}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        justifyContent: 'flex-end'
                      }}>
                        <button
                          onClick={() => {
                            const today = new Date();
                            const todayStr = today.toISOString().split('T')[0];
                            setStartDate(todayStr);
                            setEndDate(todayStr);
                            setIsCustomRange(false);
                            setSelectedDateRange('Today');
                          }}
                          style={{
                            padding: '8px 16px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            backgroundColor: '#f9fafb',
                            color: '#6b7280',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        
                        <button
                          onClick={() => setShowDateDropdown(false)}
                          disabled={!startDate || !endDate}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: startDate && endDate ? '#10b981' : '#d1d5db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: startDate && endDate ? 'pointer' : 'not-allowed'
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{ 
                        margin: '0 0 16px 0', 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#1e293b' 
                      }}>
                        Selected Range
                      </h3>
                      
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '6px',
                        marginBottom: '16px'
                      }}>
                        <div style={{ fontSize: '14px', color: '#166534', fontWeight: '500' }}>
                          {selectedDateRange}
                        </div>
                        {startDate && endDate && (
                          <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>
                            {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => setShowDateDropdown(false)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Cards */}
        <div style={{
          display: 'flex',
          gap: '24px'
        }}>
          {/* Left Side - Three Cards */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '75%'
          }}>
            {/* Total Vendor/Supervisor - Full Width */}
            <div style={{
              backgroundColor: 'white',
              padding: '12px 20px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              position: 'relative',
              minHeight: '140px'
            }}>
              {/* Info icon */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px'
              }}>
                <Info style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
              </div>

              {/* Card content */}
              <div >
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {React.createElement(attendanceMetrics[0].icon, { style: { width: '16px', height: '16px', color: '#6b7280' } })}
                  <span style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    {attendanceMetrics[0].title}
                  </span>
                </div>
              </div>

              {/* Value */}
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: analyticsError ? '#ef4444' : '#111827',
                marginTop: '0px',
                marginLeft: '20px'
              }}>
                {analyticsError ? 'Error' : attendanceMetrics[0].value}
              </div>
              
              {/* Loading indicator */}
              {loadingAnalytics && (
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '4px',
                  marginLeft: '20px'
                }}>
                  Loading...
                </div>
              )}
              
              {/* Error message */}
              {analyticsError && (
                <div style={{
                  fontSize: '12px',
                  color: '#ef4444',
                  marginTop: '4px',
                  marginLeft: '20px'
                }}>
                  {analyticsError}
                </div>
              )}
            </div>

            {/* Present and Absent - In Same Row */}
            <div style={{
              display: 'flex',
              gap: '12px',
              width: '100%'
            }}>
              {attendanceMetrics.slice(1).map((item, index) => (
                <div key={index} style={{
                  backgroundColor: 'white',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  position: 'relative',
                  width: '50%',
                  minHeight: '159px'
                }}>
                  {/* Info icon */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px'
                  }}>
                    <Info style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
                  </div>

                  {/* Card content */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '0px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: item.color
                    }}></div>
                    <div>
                      <span style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        fontWeight: '500'
                      }}>
                        {item.title}
                      </span>
                    </div>
                  </div>

                  {/* Value */}
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: analyticsError ? '#ef4444' : '#111827',
                    marginLeft: '20px'
                  }}>
                    {analyticsError ? 'Error' : item.value}
                  </div>
                  
                  {/* Loading indicator */}
                  {loadingAnalytics && (
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginTop: '4px',
                      marginLeft: '20px'
                    }}>
                      Loading...
                    </div>
                  )}
                  
                  {/* Error message */}
                  {analyticsError && (
                    <div style={{
                      fontSize: '12px',
                      color: '#ef4444',
                      marginTop: '4px',
                      marginLeft: '20px'
                    }}>
                      {analyticsError}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Attendance Gauge */}
          <div style={{
            width: '45%',
            backgroundColor: 'white',
            padding: '12px 12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            position: 'relative'
          }}>
            {/* Info icon */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px'
            }}>
              <Info style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
            </div>

            {/* Card content */}
            <div style={{
              marginBottom: '0px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                margin: 0,
              }}>
                Attendance
              </h3>
              <span style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {getDateDisplayText()}
              </span>
            </div>

            {/* Divider */}
            <div style={{
              height: '1px',
              backgroundColor: '#e5e7eb',
              margin: '12px 0'
            }}></div>

            {/* Gauge Chart */}
            <div style={{ height: '200px' }}>
              {(() => {
                const attendanceData = calculateAttendancePercentage();
                return (
                  <div>
                    <SegmentedGauge 
                      percentage={loadingAnalytics ? 0 : attendanceData.presentPercentage} 
                      label={loadingAnalytics ? "Loading..." : "Present"}
                      absentDays={loadingAnalytics ? 0 : attendanceData.absentDays}
                    />
                  </div>
                );
              })()}
            </div>
          </div>
        </div>


        {/* Top 3 and State Performance Section */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginTop: '20px'
        }}>
        {/* Top 3 Section */}
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid lightgray'
        }}>
          {/* Top 3 Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              Top 3
            </h2>
            <div style={{
              position: 'relative',
              minWidth: '100px'
            }}>
              <button style={{
                width: '100%',
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                <span>District</span>
                <ChevronDown style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
              </button>
            </div>
          </div>

          {/* Top 3 Table */}
          <div style={{
            overflowX: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    District
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Monthly Score
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Rank
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    width: '50px'
                  }}>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { district: 'District 1', score: '67%', rank: 1 },
                  { district: 'District 2', score: '67%', rank: 2 },
                  { district: 'District 3', score: '67%', rank: 3 }
                ].map((item, index) => (
                  <tr key={index} style={{
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      {item.district}
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      {item.score}
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      <div style={{
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        padding: '4px 8px',
                        borderRadius: '50%',
                        fontSize: '12px',
                        fontWeight: '500',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {item.rank}
                      </div>
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer'
                      }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}>
                          <div style={{
                            width: '4px',
                            height: '4px',
                            backgroundColor: '#6b7280',
                            borderRadius: '50%'
                          }}></div>
                          <div style={{
                            width: '4px',
                            height: '4px',
                            backgroundColor: '#6b7280',
                            borderRadius: '50%'
                          }}></div>
                          <div style={{
                            width: '4px',
                            height: '4px',
                            backgroundColor: '#6b7280',
                            borderRadius: '50%'
                          }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* State Performance Score Section */}
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid lightgray'
        }}>
          {/* State Performance Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '5px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                State performance score
              </h2>
              <Info style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
            </div>
            <div style={{
              display: 'flex',
              backgroundColor: '#f3f4f6',
              borderRadius: '12px',
              padding: '4px',
              gap: '2px'
            }}>
              {performanceButtons.map((scope) => (
                <button
                  key={scope}
                  onClick={() => setActivePerformance(scope)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: activePerformance === scope ? '#10b981' : 'transparent',
                    color: activePerformance === scope ? 'white' : '#6b7280',
                    transition: 'all 0.2s'
                  }}
                >
                  {scope}
                </button>
              ))}
            </div>
          </div>

        

          {/* Legend */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ef4444'
              }}></div>
              <span style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                Below state average
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981'
              }}></div>
              <span style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                Above state average
              </span>
            </div>
          </div>

          <divider />
            <div style={{
              height: '1px',
              backgroundColor: '#e5e7eb',
              margin: '12px 0'
            }}></div>
            
          {/* Bar Chart */}
          <div style={{ height: '250px' }}>
            <Chart
              options={{
                chart: {
                  type: 'bar',
                  height: 250,
                  toolbar: { show: false }
                },
                plotOptions: {
                  bar: {
                    horizontal: false,
                    columnWidth: '60%',
                    borderRadius: 4
                  }
                },
                dataLabels: { enabled: false },
                stroke: { show: false },
                grid: {
                  show: true,
                  borderColor: '#f1f5f9',
                  strokeDashArray: 0,
                  position: 'back',
                  xaxis: { lines: { show: false } },
                  yaxis: { lines: { show: true } },
                  padding: { top: 0, right: 0, bottom: 0, left: 0 }
                },
                xaxis: {
                  labels: {
                    style: {
                      fontSize: '12px',
                      colors: '#6b7280'
                    },
                    rotate: -45
                  },
                  axisBorder: { show: false },
                  axisTicks: { show: false }
                },
                yaxis: {
                  min: 0,
                  max: 100,
                  tickAmount: 5,
                  labels: {
                    style: {
                      fontSize: '12px',
                      colors: '#6b7280'
                    },
                    formatter: function(val) {
                      return val
                    }
                  }
                },
                colors: ['#10b981', '#ef4444'],
                annotations: {
                  yaxis: [{
                    y: 65,
                    borderColor: '#6b7280',
                    borderWidth: 2,
                    borderDashArray: [5, 5],
                    label: {
                      show: false
                    }
                  }]
                },
                tooltip: {
                  enabled: true,
                  y: {
                    formatter: function(val) {
                      return val + '%'
                    }
                  }
                }
              }}
              series={[{
                name: 'Performance Score',
                data: [
                  { x: 'Ajmer', y: 16, fillColor: '#ef4444' },
                  { x: 'Ajmer', y: 15, fillColor: '#ef4444' },
                  { x: 'Anupgarh', y: 16, fillColor: '#ef4444' },
                  { x: 'Balotra', y: 75, fillColor: '#10b981' },
                  { x: 'Baran', y: 75, fillColor: '#10b981' },
                  { x: 'Barmer', y: 38, fillColor: '#ef4444' },
                  { x: 'Beawar', y: 73, fillColor: '#10b981' },
                  { x: 'Bharatpur', y: 43, fillColor: '#ef4444' },
                  { x: 'Bhilwara', y: 42, fillColor: '#ef4444' },
                  { x: 'Bikaner', y: 75, fillColor: '#10b981' },
                  { x: 'Bundi', y: 76, fillColor: '#10b981' },
                  { x: 'Chittorgarh', y: 76, fillColor: '#10b981' },
                  { x: 'Dausa', y: 77, fillColor: '#10b981' },
                  { x: 'Deeg', y: 77, fillColor: '#10b981' },
                  { x: 'Location 15', y: 48, fillColor: '#ef4444' },
                  { x: 'Didwana Kuchaman', y: 54, fillColor: '#ef4444' },
                  { x: 'Dholpur', y: 80, fillColor: '#10b981' }
                ]
              }]}
              type="bar"
              height={290}
            />
          </div>
        </div>
      </div>
      
    </div>

        {/* Attendance History Section */}
        <div style={{
          backgroundColor: 'white',
          padding: '16px 24px',
          marginLeft: '16px',
          marginRight: '16px',
          marginTop: '16px',
          borderRadius: '8px',
          border: '1px solid lightgray'
        }}>
          {/* Attendance History Header */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                Attendance History
              </h2>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#6b7280',
                fontSize: '14px',
                marginTop: '14px',
                padding: '4px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: 'pointer',
                width: 'fit-content'
              }}>
                <Calendar style={{ width: '16px', height: '16px' }} />
                <span>Today</span>
                <ChevronDown style={{ width: '16px', height: '16px' }} />
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {/* Sort Button */}
              <button style={{
                padding: '2px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151'
              }}>
                <Filter style={{ width: '16px', height: '16px' }} />
                A-Z
              </button>

              {/* Search Bar */}
              <div style={{
                position: 'relative',
                width: '180px'
              }}>
                <Search style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#9ca3af'
                }} />
                <input
                  type="text"
                  placeholder="Search"
                  style={{
                    width: '100%',
                    paddingLeft: '40px',
                    paddingRight: '12px',
                    paddingTop: '3px',
                    paddingBottom: '3px',
                    border: '1px solid #d1d5db',
                    borderRadius: '14px',
                    outline: 'none',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Download Button */}
              <button style={{
                width: '40px',
                height: '30px',
                borderRadius: '20%',
                backgroundColor: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white'
              }}>
                <Download style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>

          {/* Attendance History Table */}
          <div style={{
            overflowX: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '2px solid #e5e7eb'
                }}>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    position: 'relative'
                  }}>
                    District name
                    <div style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '12px',
                      color: '#9ca3af'
                    }}>
                      ↕
                    </div>
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    position: 'relative'
                  }}>
                    Attendance (%)
                    <div style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '12px',
                      color: '#9ca3af'
                    }}>
                      ↕
                    </div>
                  </th>
                 
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }, (_, index) => (
                  <tr key={index} style={{
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      Name
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      80%
                    </td>
                    <td style={{
                      padding: '12px',
                      textAlign: 'right'
                    }}>
                      <button style={{
                        padding: '6px 12px',
                        backgroundColor: 'transparent',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#374151',
                        cursor: 'pointer'
                      }}>
                        Send notice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
};

export default AttendanceContent;