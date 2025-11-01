import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, ChevronDown, ChevronRight, Calendar, List, Info, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Users, UserCheck, UserX } from 'lucide-react';
import Chart from 'react-apexcharts';
import apiClient from '../../services/api';
import { useLocation } from '../../context/LocationContext';
import SendNoticeModal from './common/SendNoticeModal';

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
          }}>
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
          }}>
          {label}
        </text>
      </svg>
    </div>
  );
};

const AttendanceContent = () => {
  // Location state management via shared context
  const {
    activeScope,
    selectedLocation,
    selectedLocationId,
    selectedDistrictId,
    selectedBlockId,
    selectedGPId,
    dropdownLevel,
    selectedDistrictForHierarchy,
    selectedBlockForHierarchy,
    setActiveScope,
    setSelectedLocation,
    setSelectedLocationId,
    setSelectedDistrictId,
    setSelectedBlockId,
    setSelectedGPId,
    setDropdownLevel,
    setSelectedDistrictForHierarchy,
    setSelectedBlockForHierarchy,
    updateLocationSelection: contextUpdateLocationSelection,
    trackTabChange: contextTrackTabChange,
    trackDropdownChange: contextTrackDropdownChange,
    getCurrentLocationInfo: contextGetCurrentLocationInfo
  } = useLocation();
  
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

  // Send Notice Modal state
  const [showSendNoticeModal, setShowSendNoticeModal] = useState(false);
  const [selectedNoticeTarget, setSelectedNoticeTarget] = useState(null);

  const buildNoticeTarget = useCallback((item) => {
    if (!item) {
      return null;
    }

    const target = {
      name: item.name,
      type: null,
      districtId: null,
      blockId: null,
      gpId: null,
    };

    if (activeScope === 'State') {
      target.type = 'District';
      target.districtId = item.id ?? null;
    } else if (activeScope === 'Districts') {
      target.type = 'Block';
      target.blockId = item.id ?? null;
      const matchedBlock = blocks.find((block) => block.id === item.id);
      target.districtId = matchedBlock?.district_id ?? selectedDistrictId ?? null;
    } else if (activeScope === 'Blocks' || activeScope === 'GPs') {
      target.type = 'GP';
      target.gpId = item.id ?? null;
      const matchedGP = gramPanchayats.find((gp) => gp.id === item.id);
      const derivedBlockId = matchedGP?.block_id ?? selectedBlockId ?? null;
      target.blockId = derivedBlockId;
      const matchedBlock = blocks.find((block) => block.id === derivedBlockId);
      target.districtId = matchedBlock?.district_id ?? selectedDistrictId ?? null;
    } else {
      target.type = item.type ?? null;
    }

    return target;
  }, [activeScope, blocks, gramPanchayats, selectedBlockId, selectedDistrictId]);

  const handleOpenNoticeModal = useCallback((item) => {
    const target = buildNoticeTarget(item);
    if (!target) {
      return;
    }

    setSelectedNoticeTarget(target);
    setShowSendNoticeModal(true);
  }, [buildNoticeTarget]);

  const handleCloseNoticeModal = useCallback(() => {
    setShowSendNoticeModal(false);
    setSelectedNoticeTarget(null);
  }, []);

  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  // Top 3 section state
  const [top3Scope, setTop3Scope] = useState('District');
  const [top3Data, setTop3Data] = useState([]);
  const [loadingTop3, setLoadingTop3] = useState(false);
  const [top3Error, setTop3Error] = useState(null);
  const [showTop3Dropdown, setShowTop3Dropdown] = useState(false);

  // Refs to prevent duplicate API calls
  const analyticsCallInProgress = useRef(false);
  const top3CallInProgress = useRef(false);

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
  const handleDateKeyDown = (event) => {
    if (event.key !== 'Tab') {
      event.preventDefault();
    }
  };
  
    const scopeButtons = ['State', 'Districts', 'Blocks', 'GPs'];
    const performanceButtons = ['Time', 'Location'];
    const filterButtons = ['All', 'Present', 'Absent', 'Leave', 'Holiday'];
  const top3ScopeOptions = ['District', 'Block', 'GP'];

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
  const trackTabChange = useCallback((scope) => {
    console.log('Tab changed to:', scope);
    if (typeof contextTrackTabChange === 'function') {
      contextTrackTabChange(scope);
    }
  }, [contextTrackTabChange]);
  
  const trackDropdownChange = useCallback((location, locationId, districtId, blockId, gpId) => {
    console.log('Dropdown changed to:', location);
    if (typeof contextTrackDropdownChange === 'function') {
      contextTrackDropdownChange(location, locationId, districtId, blockId, gpId);
    }
  }, [contextTrackDropdownChange]);
  
  const getCurrentLocationInfo = useCallback(() => {
    if (typeof contextGetCurrentLocationInfo === 'function') {
      return contextGetCurrentLocationInfo();
    }
    return {
      scope: activeScope,
      location: selectedLocation,
      districtId: selectedDistrictId,
      blockId: selectedBlockId,
      gpId: selectedGPId
    };
  }, [contextGetCurrentLocationInfo, activeScope, selectedLocation, selectedDistrictId, selectedBlockId, selectedGPId]);
  
  const updateLocationSelection = useCallback((scope, location, locationId, districtId, blockId, gpId, changeType) => {
    console.log('🔄 updateLocationSelection called:', { scope, location, locationId, districtId, blockId, gpId, changeType });
    if (typeof contextUpdateLocationSelection === 'function') {
      contextUpdateLocationSelection(scope, location, locationId, districtId, blockId, gpId, changeType);
    }
  }, [contextUpdateLocationSelection]);

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

  // Fetch blocks from API for a given district
  const fetchBlocks = useCallback(async (districtId) => {
    if (!districtId) {
      setBlocks([]);
      return;
    }

    try {
      setLoadingBlocks(true);
      const response = await apiClient.get('/geography/blocks', {
        params: {
          district_id: districtId,
          skip: 0,
          limit: 100
        }
      });
      console.log('Blocks API Response:', response.data);
      setBlocks(response.data);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  }, []);

  // Fetch gram panchayats from API for a given district & block
  const fetchGramPanchayats = useCallback(async (districtId, blockId) => {
    if (!districtId || !blockId) {
      setGramPanchayats([]);
      return;
    }

    try {
      setLoadingGPs(true);
      console.log('🔄 Fetching GPs...');
      const response = await apiClient.get('/geography/grampanchayats', {
        params: {
          district_id: districtId,
          block_id: blockId,
          skip: 0,
          limit: 100
        }
      });
      console.log('✅ GPs API Response:', response.data);
      console.log('📊 Number of GPs fetched:', response.data?.length || 0);
      setGramPanchayats(response.data);
    } catch (error) {
      console.error('❌ Error fetching gram panchayats:', error);
      setGramPanchayats([]);
    } finally {
      setLoadingGPs(false);
    }
  }, []);

  // Handle scope change
  const handleScopeChange = async (scope) => {
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
      // Ensure districts are loaded first, then set first district as selected
      if (districts.length === 0) {
        console.log('⏳ Loading districts first...');
        await fetchDistricts();
      }
      if (districts.length > 0) {
        const firstDistrict = districts[0];
        updateLocationSelection('Districts', firstDistrict.name, firstDistrict.id, firstDistrict.id, null, null, 'tab_change');
        fetchBlocks(firstDistrict.id);
      }
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    } else if (scope === 'Blocks') {
      // For blocks, ensure districts are loaded first
      if (districts.length === 0) {
        console.log('⏳ Loading districts first...');
        await fetchDistricts();
      }
      setBlocks([]);
      setGramPanchayats([]);
      updateLocationSelection('Blocks', 'Select District', null, null, null, null, 'tab_change');
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    } else if (scope === 'GPs') {
      // For GPs, ensure districts are loaded first
      if (districts.length === 0) {
        console.log('⏳ Loading districts first...');
        await fetchDistricts();
      }
      setBlocks([]);
      setGramPanchayats([]);
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
        fetchBlocks(location.id);
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
        fetchBlocks(location.id);
      } else if (dropdownLevel === 'blocks') {
        // Block selected, now show GPs
        setSelectedBlockForHierarchy(location);
        setDropdownLevel('gps');
        setSelectedLocation('Select GP');
        fetchGramPanchayats(location.id, null);
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
    // Prevent duplicate calls
    if (analyticsCallInProgress.current) {
      console.log('⏸️ Analytics API call already in progress, skipping...');
      return;
    }
    
    try {
      analyticsCallInProgress.current = true;
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
      analyticsCallInProgress.current = false;
    }
  }, [activeScope, selectedLocation, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate]);

  // Fetch Top 3 data from API
  const fetchTop3Data = useCallback(async () => {
    // Prevent duplicate calls
    if (top3CallInProgress.current) {
      console.log('⏸️ Top 3 API call already in progress, skipping...');
      return;
    }
    
    try {
      top3CallInProgress.current = true;
      setLoadingTop3(true);
      setTop3Error(null);

      // Calculate current month's date range for monthly score
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // First day of current month
      const firstDayOfMonth = new Date(year, month, 1);
      // Last day of current month
      const lastDayOfMonth = new Date(year, month + 1, 0);
      
      const monthStartDate = firstDayOfMonth.toISOString().split('T')[0];
      const monthEndDate = lastDayOfMonth.toISOString().split('T')[0];

      console.log('🔄 ===== TOP 3 API CALL =====');
      console.log('📍 Top 3 Scope:', top3Scope);
      console.log('📅 Monthly Date Range:', { monthStartDate, monthEndDate });

      // Build query parameters based on selected scope
      const params = new URLSearchParams();

      // Determine level based on top3Scope
      let level = 'DISTRICT'; // Default
      if (top3Scope === 'Block') {
        level = 'BLOCK';
      } else if (top3Scope === 'GP') {
        level = 'VILLAGE';
      }
      params.append('level', level);
      console.log('📊 Top 3 Level:', level);

      // Add current month's date range for monthly score calculation
      params.append('start_date', monthStartDate);
      params.append('end_date', monthEndDate);
      console.log('📅 Monthly Start Date:', monthStartDate);
      console.log('📅 Monthly End Date:', monthEndDate);

      // Add limit
      params.append('limit', '500');

      const url = `/attendance/analytics?${params.toString()}`;
      console.log('🌐 Top 3 API URL:', url);
      
      const response = await apiClient.get(url);
      
      console.log('✅ Top 3 API Response:', {
        status: response.status,
        data: response.data
      });
      
      // Process and rank the data
      const processedData = processTop3Data(response.data);
      setTop3Data(processedData);
      
      console.log('📈 Top 3 Processed Data:', processedData);
      console.log('🔄 ===== END TOP 3 API CALL =====\n');
      
    } catch (error) {
      console.error('❌ ===== TOP 3 API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('🔄 ===== END TOP 3 API ERROR =====\n');
      
      setTop3Error(error.message || 'Failed to fetch top 3 data');
      setTop3Data([]);
    } finally {
      setLoadingTop3(false);
      top3CallInProgress.current = false;
    }
  }, [top3Scope, startDate, endDate]);

  // Process and rank Top 3 data
  const processTop3Data = (apiData) => {
    if (!apiData?.response) {
      return [];
    }

    // Calculate monthly score for each item using current month's date range
    const processedItems = apiData.response.map(item => {
      // Use current month's date range for monthly score calculation
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // First day of current month
      const firstDayOfMonth = new Date(year, month, 1);
      // Last day of current month
      const lastDayOfMonth = new Date(year, month + 1, 0);
      
      const monthStartDate = firstDayOfMonth.toISOString().split('T')[0];
      const monthEndDate = lastDayOfMonth.toISOString().split('T')[0];
      
      const totalWorkingDays = calculateWorkingDaysForRange(monthStartDate, monthEndDate);
      const monthlyScore = totalWorkingDays > 0 
        ? Math.round((item.present_count / totalWorkingDays) * 100)
        : 0;

      console.log('📅 Monthly Score Calculation for Top 3:', {
        itemName: item.geography_name,
        monthStartDate,
        monthEndDate,
        totalWorkingDays,
        presentCount: item.present_count,
        monthlyScore
      });

      return {
        id: item.geography_id,
        name: item.geography_name,
        monthlyScore: Math.min(monthlyScore, 100), // Cap at 100%
        presentCount: item.present_count,
        absentCount: item.absent_count,
        totalContractors: item.total_contractors,
        attendanceRate: item.attendance_rate
      };
    });

    // Sort by monthly score (highest first) and take top 3
    const sortedItems = processedItems
      .sort((a, b) => b.monthlyScore - a.monthlyScore)
      .slice(0, 3);

    // Add rank numbers
    return sortedItems.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  };

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
          !event.target.closest('[data-date-dropdown]') &&
          !event.target.closest('[data-top3-dropdown]') &&
          !event.target.closest('[data-history-date-dropdown]')) {
        setShowLocationDropdown(false);
        setShowDateDropdown(false);
        setShowTop3Dropdown(false);
        setShowHistoryDateDropdown(false);
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
    
    // For other scopes, ensure districts are loaded first
    if (activeScope === 'Districts') {
      if (districts.length === 0) {
        console.log('⏳ Waiting for districts to load first');
        return;
      }
      if (!selectedDistrictId) {
        console.log('⏳ Waiting for district selection');
        return;
      }
    }
    
    if (activeScope === 'Blocks') {
      if (districts.length === 0) {
        console.log('⏳ Waiting for districts to load first');
        return;
      }
      if (!selectedBlockId) {
        console.log('⏳ Waiting for block selection');
        return;
      }
    }
    
    if (activeScope === 'GPs') {
      if (districts.length === 0) {
        console.log('⏳ Waiting for districts to load first');
        return;
      }
      if (!selectedGPId) {
        console.log('⏳ Waiting for GP selection');
        return;
      }
    }
    
    console.log('📡 Calling API for other scopes');
    fetchAnalyticsData();
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate, districts.length]);

  // Fetch Top 3 data when scope changes (uses current month, not selected date range)
  useEffect(() => {
    console.log('🔄 Top 3 useEffect triggered:', {
      top3Scope
    });
    
    fetchTop3Data();
  }, [top3Scope]);

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

  // State for chart data
  const [chartData, setChartData] = useState([]);
  const [loadingChartData, setLoadingChartData] = useState(false);
  const [chartError, setChartError] = useState(null);
  const [averageAttendanceRate, setAverageAttendanceRate] = useState(65); // Default to 65%

  // State for Attendance History date selector
  const [historyDateRange, setHistoryDateRange] = useState('Today');
  const [historyStartDate, setHistoryStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [historyEndDate, setHistoryEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isHistoryCustomRange, setIsHistoryCustomRange] = useState(false);
  const [showHistoryDateDropdown, setShowHistoryDateDropdown] = useState(false);

  // State for Attendance History data
  const [attendanceHistoryData, setAttendanceHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // Fetch chart data from analytics API
  const fetchChartData = useCallback(async () => {
    try {
      setLoadingChartData(true);
      setChartError(null);

      console.log('🔄 Fetching chart data for:', { activePerformance });

      // Get current year date range
      const now = new Date();
      const year = now.getFullYear();
      
      console.log('📅 Current Year Info:', { 
        now: now.toISOString(), 
        year
      });
      
      // Get first and last day of current year
      const startDate = `${year}-01-01`; // January 1st
      const endDate = `${year}-12-31`;   // December 31st

      // Build query parameters - ALWAYS use district level with current year date range
      const params = new URLSearchParams();
      params.append('level', 'DISTRICT');
      params.append('start_date', startDate);
      params.append('end_date', endDate);
      params.append('limit', '500');

      const url = `/attendance/analytics?${params.toString()}`;
      console.log('🌐 Chart API URL:', url);
      console.log('📅 Date Range:', { startDate, endDate });

      const response = await apiClient.get(url);
      console.log('✅ Chart API Response:', response.data);

      // Process the data
      const { chartData: processedData, averageRate } = processChartData(response.data);
      setChartData(processedData);
      setAverageAttendanceRate(averageRate);

    } catch (error) {
      console.error('❌ Chart API Error:', error);
      setChartError(error.message || 'Failed to fetch chart data');
      setChartData([]);
    } finally {
      setLoadingChartData(false);
    }
  }, [activePerformance]);

  // Fetch chart data when performance tab changes
  useEffect(() => {
    console.log('🔄 Chart data useEffect triggered:', {
      activePerformance
    });
    
    fetchChartData();
  }, [activePerformance, fetchChartData]);

  // Fetch attendance history data from analytics API
  const fetchAttendanceHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      setHistoryError(null);

      console.log('🔄 Fetching attendance history for:', { 
        activeScope, 
        selectedDistrictId, 
        selectedBlockId, 
        selectedGPId,
        historyStartDate,
        historyEndDate
      });

      // Build query parameters based on current scope
      const params = new URLSearchParams();
      
      // Determine level based on active scope
      let level = 'DISTRICT';
      if (activeScope === 'Districts') {
        level = 'BLOCK';
      } else if (activeScope === 'Blocks' || activeScope === 'GPs') {
        level = 'VILLAGE';
      }
      params.append('level', level);

      // Add geography filters based on selection
      if (activeScope === 'Districts' && selectedDistrictId) {
        params.append('district_id', selectedDistrictId);
      } else if (activeScope === 'Blocks' && selectedBlockId) {
        params.append('block_id', selectedBlockId);
      } else if (activeScope === 'GPs' && selectedGPId) {
        params.append('gp_id', selectedGPId);
      }

      // Add date range
      params.append('start_date', historyStartDate);
      params.append('end_date', historyEndDate);
      params.append('limit', '500');

      const url = `/attendance/analytics?${params.toString()}`;
      console.log('🌐 History API URL:', url);

      const response = await apiClient.get(url);
      console.log('✅ History API Response:', response.data);

      // Process the data
      const processedData = processAttendanceHistoryData(response.data);
      setAttendanceHistoryData(processedData);

    } catch (error) {
      console.error('❌ History API Error:', error);
      setHistoryError(error.message || 'Failed to fetch attendance history');
      setAttendanceHistoryData([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, historyStartDate, historyEndDate]);

  // Process attendance history data from API response
  const processAttendanceHistoryData = (apiData) => {
    if (!apiData?.response) {
      return [];
    }

    // Group data by geography and calculate average attendance
    const geographyMap = new Map();

    apiData.response.forEach(item => {
      const key = item.geography_id;
      if (!geographyMap.has(key)) {
        geographyMap.set(key, {
          id: item.geography_id,
          name: item.geography_name,
          totalContractors: 0,
          totalPresent: 0,
          totalAbsent: 0,
          attendanceRates: []
        });
      }

      const geoData = geographyMap.get(key);
      geoData.totalContractors += item.total_contractors || 0;
      geoData.totalPresent += item.present_count || 0;
      geoData.totalAbsent += item.absent_count || 0;
      geoData.attendanceRates.push(item.attendance_rate || 0);
    });

    // Calculate average attendance rate for each geography
    const processedItems = Array.from(geographyMap.values()).map(item => {
      const avgAttendanceRate = item.attendanceRates.length > 0 
        ? item.attendanceRates.reduce((sum, rate) => sum + rate, 0) / item.attendanceRates.length
        : 0;
      
      // Cap attendance percentage to 100% maximum
      const attendancePercentage = Math.min(Math.round(avgAttendanceRate * 100), 100);
      
      return {
        id: item.id,
        name: item.name,
        attendancePercentage: attendancePercentage,
        totalContractors: item.totalContractors,
        totalPresent: item.totalPresent,
        totalAbsent: item.totalAbsent
      };
    });

    // Sort by attendance percentage (highest first)
    return processedItems.sort((a, b) => b.attendancePercentage - a.attendancePercentage);
  };

  // Fetch attendance history when scope, location, or date range changes
  useEffect(() => {
    console.log('🔄 Attendance history useEffect triggered:', {
      activeScope,
      selectedDistrictId,
      selectedBlockId,
      selectedGPId,
      historyStartDate,
      historyEndDate
    });
    
    fetchAttendanceHistory();
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, historyStartDate, historyEndDate, fetchAttendanceHistory]);

  // Debug history date state changes
  useEffect(() => {
    console.log('📅 History date state changed:', {
      historyDateRange,
      historyStartDate,
      historyEndDate,
      isHistoryCustomRange,
      showHistoryDateDropdown
    });
  }, [historyDateRange, historyStartDate, historyEndDate, isHistoryCustomRange, showHistoryDateDropdown]);

  // Process chart data from API response and match with x-axis entities
  const processChartData = (apiData) => {
    if (!apiData?.response) {
      return { chartData: generateEmptyChartData(), averageRate: 65 };
    }

    // Calculate average attendance rate from all API data
    const allAttendanceRates = apiData.response.map(item => item.attendance_rate || 0);
    console.log('🔍 Raw Attendance Rates:', allAttendanceRates);
    
    // API data is in decimal format (0.42 = 0.42%), need to multiply by 100 to get percentage
    const averageRate = allAttendanceRates.length > 0 
      ? Math.round(allAttendanceRates.reduce((sum, rate) => sum + rate, 0) / allAttendanceRates.length * 100)
      : 65;
    
    console.log('📊 Average Attendance Rate:', averageRate + '%');

    if (activePerformance === 'Time') {
      // Time tab - get all months of current year
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      
      // Create map of API data by month
      const monthMap = new Map();
      apiData.response.forEach(item => {
        const date = new Date(item.date);
        const month = date.getMonth(); // 0-indexed (0 = January, 11 = December)
        const monthKey = month;
        
        console.log('📅 API Date:', item.date, 'Month:', month + 1, 'Geography:', item.geography_name, 'Rate:', item.attendance_rate);
        
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, []);
        }
        monthMap.get(monthKey).push(item);
      });
      
      console.log('📊 MonthMap keys:', Array.from(monthMap.keys()));

      // Generate chart data for all months of the year
      const chartItems = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let month = 0; month < 12; month++) {
        const monthLabel = monthNames[month];
        
        console.log('🔍 Checking month:', { month: month + 1, monthLabel, hasData: monthMap.has(month) });
        
        // Check if we have data for this month
        const monthData = monthMap.get(month);
        
        if (monthData && monthData.length > 0) {
          // Calculate average attendance rate for this month
          const avgAttendanceRate = monthData.reduce((sum, item) => sum + (item.attendance_rate || 0), 0) / monthData.length;
          const attendancePercentage = Math.min(Math.round(avgAttendanceRate * 100), 100);
          
          chartItems.push({
            x: monthLabel,
            y: attendancePercentage,
            fillColor: attendancePercentage >= averageRate ? '#10b981' : '#ef4444'
          });
        } else {
          // No data for this month, show 0
          chartItems.push({
            x: monthLabel,
            y: 0,
            fillColor: '#d1d5db' // Gray for no data
          });
        }
      }
      
      return { chartData: chartItems, averageRate };
    } else {
      // Location tab - ALWAYS show all districts (State Performance)
      let entities = districts.map(d => ({ id: d.id, name: d.name }));
      
      // Create map of API data by geography_id
      const geoMap = new Map();
      apiData.response.forEach(item => {
        const key = item.geography_id;
        if (!geoMap.has(key)) {
          geoMap.set(key, []);
        }
        geoMap.get(key).push(item);
      });
      
      // Match entities with API data
      const chartItems = entities.map(entity => {
        const entityData = geoMap.get(entity.id);
        
        if (entityData && entityData.length > 0) {
          // Calculate average attendance rate
          const avgAttendanceRate = entityData.reduce((sum, item) => sum + (item.attendance_rate || 0), 0) / entityData.length;
          const attendancePercentage = Math.min(Math.round(avgAttendanceRate * 100), 100);
          
          return {
            x: entity.name,
            y: attendancePercentage,
            fillColor: attendancePercentage >= averageRate ? '#10b981' : '#ef4444'
          };
        } else {
          // No data for this entity
          return {
            x: entity.name,
            y: 0,
            fillColor: '#d1d5db' // Gray for no data
          };
        }
      });
      
      return { chartData: chartItems, averageRate };
    }
  };

  // Generate empty chart data when no API data is available
  const generateEmptyChartData = () => {
    if (activePerformance === 'Time') {
      // Time tab - show all months of the year
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const chartItems = monthNames.map(monthName => ({
        x: monthName,
        y: 0,
        fillColor: '#d1d5db'
      }));
      
      return { chartData: chartItems, averageRate: 65 };
    } else {
      // Location tab - ALWAYS show all districts (State Performance)
      return { 
        chartData: districts.map(district => ({
          x: district.name,
          y: 0,
          fillColor: '#d1d5db'
        })), 
        averageRate: 65 
      };
    }
  };

  // Helper function to generate dynamic x-axis data based on selected tab and filters
  const generateDynamicXAxisData = () => {
    return chartData;
  };

  // Helper functions for history date selector
  const getHistoryDateDisplayText = () => {
    console.log('🔄 Getting history display text:', {
      isHistoryCustomRange,
      historyStartDate,
      historyEndDate,
      historyDateRange
    });
    
    if (isHistoryCustomRange && historyStartDate && historyEndDate) {
      const start = new Date(historyStartDate);
      const end = new Date(historyEndDate);
      return `${start.getDate()}/${start.getMonth() + 1}/${start.getFullYear()} - ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
    } else if (isHistoryCustomRange && historyStartDate) {
      const start = new Date(historyStartDate);
      return `${start.getDate()}/${start.getMonth() + 1}/${start.getFullYear()} - Select End Date`;
    } else {
      return historyDateRange;
    }
  };

  // Handle predefined date range selection for history
  const handleHistoryDateRangeSelection = (range) => {
    console.log('🔄 History date range selected:', range);
    
    if (range.value === 'custom') {
      setIsHistoryCustomRange(true);
      setHistoryDateRange('Custom');
      setHistoryStartDate(null);
      setHistoryEndDate(null);
    } else {
      setIsHistoryCustomRange(false);
      setHistoryDateRange(range.label);
      
      const today = new Date();
      let startDate, endDate;
      
      if (range.value === 'today') {
        startDate = today.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
      } else if (range.value === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        startDate = yesterday.toISOString().split('T')[0];
        endDate = yesterday.toISOString().split('T')[0];
      } else {
        const start = new Date(today);
        start.setDate(today.getDate() - range.days);
        startDate = start.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
      }
      
      console.log('📅 Setting history dates:', {
        startDate,
        endDate,
        range: range.label
      });
      
      setHistoryStartDate(startDate);
      setHistoryEndDate(endDate);
      setShowHistoryDateDropdown(false);
    }
  };

  // Handle custom date selection for history
  const handleHistoryCustomDateSelection = (date) => {
    if (!historyStartDate) {
      setHistoryStartDate(date);
    } else if (!historyEndDate) {
      if (new Date(date) >= new Date(historyStartDate)) {
        setHistoryEndDate(date);
        setShowHistoryDateDropdown(false);
      } else {
        setHistoryEndDate(historyStartDate);
        setHistoryStartDate(date);
        setShowHistoryDateDropdown(false);
      }
    }
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
  
  const activeHierarchyDistrict = selectedDistrictForHierarchy ||
    (selectedDistrictId ? districts.find(d => d.id === selectedDistrictId) : null);

  const blocksForActiveDistrict = activeHierarchyDistrict
    ? blocks.filter(block => block.district_id === activeHierarchyDistrict.id)
    : [];

  const activeHierarchyBlock = selectedBlockForHierarchy ||
    (selectedBlockId ? blocks.find(block => block.id === selectedBlockId) : null);

  const gpsForActiveBlock = activeHierarchyBlock
    ? gramPanchayats.filter(gp => gp.block_id === activeHierarchyBlock.id)
    : [];

  const getMenuItemStyles = (isActive) => ({
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    color: isActive ? '#047857' : '#374151',
    backgroundColor: isActive ? '#ecfdf5' : 'transparent',
    fontWeight: isActive ? 600 : 400,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'background-color 0.15s ease, color 0.15s ease'
  });

  const handleDistrictHover = (district) => {
    if (activeScope === 'Blocks' || activeScope === 'GPs') {
      if (!selectedDistrictForHierarchy || selectedDistrictForHierarchy.id !== district.id) {
        setSelectedDistrictForHierarchy(district);
        setSelectedBlockForHierarchy(null);
        setDropdownLevel('blocks');
        fetchBlocks(district.id);
      }
    }
  };

  const handleDistrictClick = (district) => {
    if (activeScope === 'Districts') {
      trackDropdownChange(district.name, district.id, district.id);
      updateLocationSelection('Districts', district.name, district.id, district.id, null, null, 'dropdown_change');
      fetchBlocks(district.id);
      setShowLocationDropdown(false);
    } else if (activeScope === 'Blocks') {
      setSelectedDistrictForHierarchy(district);
      setSelectedBlockForHierarchy(null);
      setSelectedLocation('Select Block');
      setDropdownLevel('blocks');
      fetchBlocks(district.id);
    } else if (activeScope === 'GPs') {
      setSelectedDistrictForHierarchy(district);
      setSelectedBlockForHierarchy(null);
      setSelectedLocation('Select Block');
      setDropdownLevel('blocks');
      fetchBlocks(district.id);
    }
  };

  const handleBlockHover = (block) => {
    if (activeScope === 'GPs') {
      if (!selectedBlockForHierarchy || selectedBlockForHierarchy.id !== block.id) {
        setSelectedBlockForHierarchy(block);
        setDropdownLevel('gps');
        fetchGramPanchayats(selectedDistrictForHierarchy?.id || selectedDistrictId, block.id);
      }
    }
  };

  const handleBlockClick = (block) => {
    if (activeScope === 'Blocks') {
      const district = districts.find(d => d.id === (block.district_id || selectedDistrictForHierarchy?.id)) || selectedDistrictForHierarchy;
      const districtId = district?.id || null;
      trackDropdownChange(block.name, block.id, districtId);
      updateLocationSelection('Blocks', block.name, block.id, districtId, block.id, null, 'dropdown_change');
      if (district) {
        setSelectedDistrictForHierarchy(district);
      }
      setSelectedBlockForHierarchy(block);
      fetchGramPanchayats(districtId, block.id);
      setShowLocationDropdown(false);
    } else if (activeScope === 'GPs') {
      setSelectedBlockForHierarchy(block);
      setSelectedLocation('Select GP');
      setDropdownLevel('gps');
      fetchGramPanchayats(selectedDistrictForHierarchy?.id || selectedDistrictId, block.id);
    }
  };

  const handleGPClick = (gp) => {
    const block = blocks.find(b => b.id === (gp.block_id || selectedBlockForHierarchy?.id || selectedBlockId)) || selectedBlockForHierarchy;
    const blockId = block?.id || gp.block_id || null;
    const district = districts.find(d => d.id === (block?.district_id || selectedDistrictForHierarchy?.id || selectedDistrictId)) || selectedDistrictForHierarchy;
    const districtId = district?.id || null;

    trackDropdownChange(gp.name, gp.id, districtId);
    updateLocationSelection('GPs', gp.name, gp.id, districtId, blockId, gp.id, 'dropdown_change');
    if (district) {
      setSelectedDistrictForHierarchy(district);
    }
    if (block) {
      setSelectedBlockForHierarchy(block);
    }
    fetchGramPanchayats(districtId, blockId);
    setShowLocationDropdown(false);
  };

  useEffect(() => {
    if (!showLocationDropdown) {
      return;
    }

    if ((activeScope === 'Blocks' || activeScope === 'GPs') && districts.length > 0) {
      if (!selectedDistrictForHierarchy) {
        const presetDistrict = (selectedDistrictId && districts.find(d => d.id === selectedDistrictId)) || districts[0];
        if (presetDistrict) {
          setSelectedDistrictForHierarchy(presetDistrict);
          setDropdownLevel(activeScope === 'GPs' && selectedBlockId ? 'gps' : 'blocks');
          fetchBlocks(presetDistrict.id);
        }
      }
    }

    if (activeScope === 'GPs' && selectedDistrictForHierarchy && blocks.length > 0) {
      if (!selectedBlockForHierarchy) {
        const presetBlock = (selectedBlockId && blocks.find(b => b.id === selectedBlockId && b.district_id === selectedDistrictForHierarchy.id))
          || blocks.find(b => b.district_id === selectedDistrictForHierarchy.id);
        if (presetBlock) {
          setSelectedBlockForHierarchy(presetBlock);
          setDropdownLevel('gps');
          fetchGramPanchayats(selectedDistrictForHierarchy.id, presetBlock.id);
        }
      }
    }
  }, [
    showLocationDropdown,
    activeScope,
    districts,
    blocks,
    selectedDistrictForHierarchy,
    selectedBlockForHierarchy,
    selectedDistrictId,
    selectedBlockId,
    fetchBlocks,
    fetchGramPanchayats
  ]);

  useEffect(() => {
    if ((activeScope === 'Districts' || activeScope === 'Blocks' || activeScope === 'GPs') && selectedDistrictId) {
      fetchBlocks(selectedDistrictId);
    }
  }, [activeScope, selectedDistrictId, fetchBlocks]);

  useEffect(() => {
    if ((activeScope === 'Blocks' || activeScope === 'GPs') && selectedDistrictId && selectedBlockId) {
      fetchGramPanchayats(selectedDistrictId, selectedBlockId);
    }
  }, [activeScope, selectedDistrictId, selectedBlockId, fetchGramPanchayats]);

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
                  right: 0,
                  left: 'auto',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
                  zIndex: 1000,
                  marginTop: '6px',
                  display: 'flex',
                  overflow: 'hidden',
                  minWidth: activeScope === 'Districts' ? '280px' : activeScope === 'Blocks' ? '520px' : '780px'
                }}
              >
                <div
                  style={{
                    minWidth: '240px',
                    maxHeight: '280px',
                    overflowY: 'auto',
                    borderRight: activeScope !== 'Districts' ? '1px solid #f3f4f6' : 'none'
                  }}
                >
                  {loadingDistricts ? (
                    <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                      Loading districts...
                    </div>
                  ) : districts.length === 0 ? (
                    <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                      No districts available
                    </div>
                  ) : (
                    districts.map((district) => {
                      const isActiveDistrict = activeHierarchyDistrict?.id === district.id;
                      const isSelectedDistrict = activeScope === 'Districts' && selectedLocation === district.name;
                      const showArrow = activeScope === 'Blocks' || activeScope === 'GPs';

                      return (
                        <div
                          key={`district-${district.id}`}
                          onClick={() => handleDistrictClick(district)}
                          onMouseEnter={() => handleDistrictHover(district)}
                          style={getMenuItemStyles(isActiveDistrict || isSelectedDistrict)}
                        >
                          <span>{district.name}</span>
                          {showArrow && (
                            <ChevronRight style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {activeScope !== 'Districts' && (
                  <div
                    style={{
                      minWidth: '240px',
                      maxHeight: '280px',
                      overflowY: 'auto',
                      borderRight: activeScope === 'GPs' ? '1px solid #f3f4f6' : 'none'
                    }}
                  >
                    {loadingBlocks ? (
                      <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                        Loading blocks...
                      </div>
                    ) : !activeHierarchyDistrict ? (
                      <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                        Select a district to view blocks
                      </div>
                    ) : blocksForActiveDistrict.length === 0 ? (
                      <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                        No blocks found
                      </div>
                    ) : (
                      blocksForActiveDistrict.map((block) => {
                        const isActiveBlock = activeHierarchyBlock?.id === block.id;
                        const isSelectedBlock = activeScope === 'Blocks' && selectedLocation === block.name;
                        const showArrow = activeScope === 'GPs';

                        return (
                          <div
                            key={`block-${block.id}`}
                            onClick={() => handleBlockClick(block)}
                            onMouseEnter={() => handleBlockHover(block)}
                            style={getMenuItemStyles(isActiveBlock || isSelectedBlock)}
                          >
                            <span>{block.name}</span>
                            {showArrow && (
                              <ChevronRight style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {activeScope === 'GPs' && (
                  <div
                    style={{
                      minWidth: '240px',
                      maxHeight: '280px',
                      overflowY: 'auto'
                    }}
                  >
                    {loadingGPs ? (
                      <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                        Loading GPs...
                      </div>
                    ) : !activeHierarchyBlock ? (
                      <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                        Select a block to view GPs
                      </div>
                    ) : gpsForActiveBlock.length === 0 ? (
                      <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                        No GPs found
                      </div>
                    ) : (
                      gpsForActiveBlock.map((gp) => {
                        const isSelectedGP = activeScope === 'GPs' && selectedLocation === gp.name;

                        return (
                          <div
                            key={`gp-${gp.id}`}
                            onClick={() => handleGPClick(gp)}
                            style={getMenuItemStyles(isSelectedGP)}
                          >
                            <span>{gp.name}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
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
                            onKeyDown={handleDateKeyDown}
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
                            onKeyDown={handleDateKeyDown}
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
          flex: 0.8,
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid lightgray',
          minHeight: '450px'
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
            <div 
              data-top3-dropdown
              style={{
              position: 'relative',
              minWidth: '100px'
              }}
            >
              <button 
                onClick={() => setShowTop3Dropdown(!showTop3Dropdown)}
                style={{
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
                }}
              >
                <span>{top3Scope}</span>
                <ChevronDown style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
              </button>
              
              {/* Top 3 Dropdown Menu */}
              {showTop3Dropdown && (
                <div 
                  onClick={(e) => e.stopPropagation()}
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
                  {top3ScopeOptions.map((option) => (
                    <div
                      key={option}
                      onClick={() => {
                        setTop3Scope(option);
                        setShowTop3Dropdown(false);
                      }}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        backgroundColor: top3Scope === option ? '#f3f4f6' : 'transparent',
                        borderBottom: '1px solid #f3f4f6'
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
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
                    {top3Scope}
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
                {loadingTop3 ? (
                  <tr>
                    <td colSpan="4" style={{
                      padding: '40px',
                      textAlign: 'center',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      Loading top 3 data...
                    </td>
                  </tr>
                ) : top3Error ? (
                  <tr>
                    <td colSpan="4" style={{
                      padding: '40px',
                      textAlign: 'center',
                      fontSize: '14px',
                      color: '#dc2626'
                    }}>
                      Error loading data: {top3Error}
                    </td>
                  </tr>
                ) : top3Data.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{
                      padding: '40px',
                      textAlign: 'center',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      No data available
                    </td>
                  </tr>
                ) : (
                  top3Data.map((item, index) => (
                    <tr key={item.id || index} style={{
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                        {item.name}
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                        {item.monthlyScore}%
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      <div style={{
                          backgroundColor: item.rank === 1 ? '#dcfce7' : 
                                         item.rank === 2 ? '#fef3c7' : '#fce7f3',
                          color: item.rank === 1 ? '#166534' : 
                                item.rank === 2 ? '#92400e' : '#be185d',
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* State Performance Score Section */}
        <div style={{
          flex: 1.5,
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid lightgray',
          minHeight: '450px'
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
          <div style={{ height: '300px' }}>
            {(() => {
              const currentChartData = generateDynamicXAxisData();
              
              // Show loading state if data is being fetched
              if (loadingChartData) {
                return (
                  <div style={{
                    height: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6b7280',
                    fontSize: '14px'
                  }}>
                    Loading chart data...
                  </div>
                );
              }
              
              // Show error state if there's an error
              if (chartError) {
                return (
                  <div style={{
                    height: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ef4444',
                    fontSize: '14px'
                  }}>
                    Error: {chartError}
                  </div>
                );
              }
              
              // Show empty state if no data available
              if (currentChartData.length === 0) {
                return (
                  <div style={{
                    height: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6b7280',
                    fontSize: '14px'
                  }}>
                    {activePerformance === 'Location' ? 'No location data available' : 'No time data available'}
                  </div>
                );
              }
              
              return (
                <Chart
              options={{
                chart: {
                  type: 'bar',
                  height: 300,
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
                      fontSize: activePerformance === 'Time' ? '10px' : '11px',
                      colors: '#6b7280'
                    },
                    rotate: activePerformance === 'Time' ? -90 : -45,
                    maxHeight: activePerformance === 'Time' ? 60 : 50,
                    trim: true,
                    hideOverlappingLabels: true
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
                    y: averageAttendanceRate,
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
                data: currentChartData
              }]}
              type="bar"
              height={340}
            />
              );
            })()}
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
            <div style={{ position: 'relative' }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                Attendance History
              </h2>
               <div 
                 onClick={() => setShowHistoryDateDropdown(!showHistoryDateDropdown)}
                 data-history-date-dropdown
                 style={{
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
                 }}
               >
                 <Calendar style={{ width: '16px', height: '16px' }} />
                 <span>{getHistoryDateDisplayText()}</span>
                 <ChevronDown style={{ width: '16px', height: '16px' }} />
               </div>
               
               {/* History Date Dropdown */}
               {showHistoryDateDropdown && (
                 <div 
                   data-history-date-dropdown
                   style={{
                     position: 'absolute',
                     top: '100%',
                     left: '0',
                     zIndex: 1000,
                     backgroundColor: 'white',
                     border: '1px solid #d1d5db',
                     borderRadius: '8px',
                     boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                     minWidth: '200px',
                     marginTop: '4px'
                   }}>
                   {/* Predefined ranges */}
                   <div style={{ padding: '8px 0' }}>
                     {[
                       { label: 'Today', value: 'today', days: 0 },
                       { label: 'Yesterday', value: 'yesterday', days: 1 },
                       { label: 'Last 7 days', value: 'last7days', days: 7 },
                       { label: 'Last 30 days', value: 'last30days', days: 30 },
                       { label: 'Last 90 days', value: 'last90days', days: 90 },
                       { label: 'Custom', value: 'custom' }
                     ].map((range) => (
                       <div
                         key={range.value}
                         onClick={(e) => {
                           console.log('🖱️ History date option clicked:', range);
                           e.preventDefault();
                           e.stopPropagation();
                           handleHistoryDateRangeSelection(range);
                         }}
                         style={{
                           padding: '8px 16px',
                           cursor: 'pointer',
                           fontSize: '14px',
                           color: '#374151',
                           backgroundColor: historyDateRange === range.label ? '#f3f4f6' : 'transparent'
                         }}
                         onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                         onMouseLeave={(e) => e.target.style.backgroundColor = historyDateRange === range.label ? '#f3f4f6' : 'transparent'}
                       >
                         {range.label}
                       </div>
                     ))}
                   </div>
                   
                   {/* Custom date picker */}
                   {isHistoryCustomRange && (
                     <div style={{
                       borderTop: '1px solid #e5e7eb',
                       padding: '12px 16px',
                       backgroundColor: '#f9fafb'
                     }}>
                       <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                         Select Date Range
                       </div>
                       <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                         <input
                           type="date"
                           value={historyStartDate || ''}
                          onKeyDown={handleDateKeyDown}
                           onChange={(e) => setHistoryStartDate(e.target.value)}
                           style={{
                             padding: '4px 8px',
                             border: '1px solid #d1d5db',
                             borderRadius: '4px',
                             fontSize: '12px',
                             width: '100%'
                           }}
                         />
                         <span style={{ fontSize: '12px', color: '#6b7280' }}>to</span>
                         <input
                           type="date"
                           value={historyEndDate || ''}
                          onKeyDown={handleDateKeyDown}
                           onChange={(e) => setHistoryEndDate(e.target.value)}
                           style={{
                             padding: '4px 8px',
                             border: '1px solid #d1d5db',
                             borderRadius: '4px',
                             fontSize: '12px',
                             width: '100%'
                           }}
                         />
                       </div>
                     </div>
                   )}
                 </div>
               )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {/* Sort Button */}
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#374151'
                }}
              >
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
              <button
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
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
                     {activeScope === 'State' ? 'District name' : 
                      activeScope === 'Districts' ? 'Block name' : 
                      activeScope === 'Blocks' ? 'GP name' : 'Village name'}
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
                {loadingHistory ? (
                  <tr>
                    <td colSpan="3" style={{
                      padding: '40px',
                      textAlign: 'center',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      Loading attendance history...
                    </td>
                  </tr>
                ) : historyError ? (
                  <tr>
                    <td colSpan="3" style={{
                      padding: '40px',
                      textAlign: 'center',
                      fontSize: '14px',
                      color: '#ef4444'
                    }}>
                      {historyError}
                    </td>
                  </tr>
                ) : attendanceHistoryData.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{
                      padding: '40px',
                      textAlign: 'center',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      No attendance data available for the selected period
                    </td>
                  </tr>
                ) : (
                  attendanceHistoryData.map((item, index) => (
                    <tr key={item.id || index} style={{
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      <td style={{
                        padding: '12px',
                        fontSize: '14px',
                        color: '#374151'
                      }}>
                        {item.name}
                      </td>
                      <td style={{
                        padding: '12px',
                        fontSize: '14px',
                        color: '#374151'
                      }}>
                        {item.attendancePercentage}%
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'right'
                      }}>
                        <button 
                          onClick={() => handleOpenNoticeModal(item)}
                          style={{
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      <SendNoticeModal
        isOpen={showSendNoticeModal}
        onClose={handleCloseNoticeModal}
        target={selectedNoticeTarget}
      />
    </div>
  );
};

export default AttendanceContent;