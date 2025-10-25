import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, ChevronDown, Calendar, List, Info, TrendingUp } from 'lucide-react';
import Chart from 'react-apexcharts';
import number1 from '../../assets/images/number1.png';
import number2 from '../../assets/images/nnumber2.png';
import number3 from '../../assets/images/number3.png';
import apiClient from '../../services/api';
import { useLocation } from '../../context/LocationContext';
import LocationDisplay from '../common/LocationDisplay';

const SegmentedGauge = ({ complaintData, percentage, label = "Complaints closed" }) => {
  // Calculate total complaints for percentage calculation
  const total = complaintData.open + complaintData.verified + complaintData.resolved + complaintData.disposed;
  
  // Calculate percentages for each status
  const openPercent = total > 0 ? (complaintData.open / total) * 100 : 0;
  const verifiedPercent = total > 0 ? (complaintData.verified / total) * 100 : 0;
  const resolvedPercent = total > 0 ? (complaintData.resolved / total) * 100 : 0;
  const disposedPercent = total > 0 ? (complaintData.disposed / total) * 100 : 0;
  
  // Define colors for each status
  const statusColors = {
    open: '#ef4444',      // Red
    verified: '#f97316',  // Orange
    resolved: '#8b5cf6',  // Purple
    disposed: '#10b981'   // Green
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

  // Create segments with gaps like the original design
  const createSegments = () => {
    const segments = [];
    const totalAngle = 200; // Total arc angle
    const gapSize = 19; // degrees - same as original
    const availableAngle = totalAngle - (3 * gapSize); // Account for 3 gaps between 4 segments
    
    // Only create segments for statuses that have complaints
    const statuses = [
      { name: 'open', percent: openPercent, color: statusColors.open },
      { name: 'verified', percent: verifiedPercent, color: statusColors.verified },
      { name: 'resolved', percent: resolvedPercent, color: statusColors.resolved },
      { name: 'disposed', percent: disposedPercent, color: statusColors.disposed }
    ].filter(status => status.percent > 0);
    
    // If no complaints, return empty array
    if (statuses.length === 0) {
      return [];
    }
    
    // Calculate total percentage of active statuses
    const totalActivePercent = statuses.reduce((sum, status) => sum + status.percent, 0);
    
    // Distribute segments proportionally
    let currentAngle = -90;
    const segmentCount = Math.min(statuses.length, 3); // Max 3 segments like original
    
    for (let i = 0; i < segmentCount; i++) {
      const status = statuses[i];
      const segmentAngle = (status.percent / totalActivePercent) * availableAngle;
      const endAngle = currentAngle + segmentAngle;
      
      segments.push({
        start: currentAngle,
        end: endAngle,
        color: status.color,
        name: status.name
      });
      
      currentAngle = endAngle + gapSize;
    }
    
    // Don't add gray filler - only show actual data segments
    
    return segments;
  };
  
  const segments = createSegments();

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

const DashboardContent = () => {
  // Use LocationContext for global state management
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
    changeHistory,
    lastChange,
    setActiveScope,
    setSelectedLocation,
    setSelectedLocationId,
    setSelectedDistrictId,
    setSelectedBlockId,
    setSelectedGPId,
    setDropdownLevel,
    setSelectedDistrictForHierarchy,
    setSelectedBlockForHierarchy,
    updateLocationSelection,
    getCurrentLocationInfo,
    trackTabChange,
    trackDropdownChange,
    getChangeHistory,
    getLastChange
  } = useLocation();

  // Local state for UI controls
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [gramPanchayats, setGramPanchayats] = useState([]);
  const [loadingGPs, setLoadingGPs] = useState(false);

  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  // Complaints chart data state
  const [complaintsChartData, setComplaintsChartData] = useState(null);
  const [loadingComplaintsChart, setLoadingComplaintsChart] = useState(false);
  const [complaintsChartError, setComplaintsChartError] = useState(null);

  // Performance data state
  const [performanceApiData, setPerformanceApiData] = useState(null);
  const [previousMonthApiData, setPreviousMonthApiData] = useState(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [performanceError, setPerformanceError] = useState(null);
  const [activePerformanceTab, setActivePerformanceTab] = useState('starPerformers');
  const [top3Scope, setTop3Scope] = useState('District');
  const [showTop3Dropdown, setShowTop3Dropdown] = useState(false);
  const [top3ApiData, setTop3ApiData] = useState(null);
  const [loadingTop3, setLoadingTop3] = useState(false);
  const [top3Error, setTop3Error] = useState(null);
  

  // Log current location info whenever it changes
  useEffect(() => {
    const locationInfo = getCurrentLocationInfo();
    console.log('Current Location Info:', locationInfo);
  }, [activeScope, selectedLocation, selectedLocationId, selectedDistrictId, selectedBlockId, selectedGPId, getCurrentLocationInfo]);
  
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
  
  // Complaints year selection state
  const [selectedComplaintsYear, setSelectedComplaintsYear] = useState(() => {
    return new Date().getFullYear();
  });
  const [showComplaintsYearDropdown, setShowComplaintsYearDropdown] = useState(false);
  
  // Complaints filter tabs state
  const [activeComplaintsFilter, setActiveComplaintsFilter] = useState('Time');

  const scopeButtons = ['State', 'Districts', 'Blocks', 'GPs'];

  // Predefined date ranges
  const dateRanges = [
    { label: 'Today', value: 'today', days: 0 },
    { label: 'Yesterday', value: 'yesterday', days: 1 },
    { label: 'Last 7 Days', value: 'last7days', days: 7 },
    { label: 'Last 30 Days', value: 'last30days', days: 30 },
    { label: 'Last 60 Days', value: 'last60days', days: 60 },
    { label: 'Custom', value: 'custom', days: null }
  ];

  // Fetch districts from API
  const fetchDistricts = async () => {
    try {
      setLoadingDistricts(true);
      const response = await apiClient.get('/geography/districts?skip=0&limit=100');
      setDistricts(response.data);
      console.log('Districts fetched:', response.data);
    } catch (error) {
      console.error('Error fetching districts:', error);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Fetch blocks from API
  const fetchBlocks = async () => {
    try {
      setLoadingBlocks(true);
      const response = await apiClient.get('/geography/blocks?skip=0&limit=100');
      setBlocks(response.data);
      console.log('Blocks fetched:', response.data);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  };

  // Fetch Gram Panchayats from API
  const fetchGramPanchayats = async () => {
    try {
      setLoadingGPs(true);
      const response = await apiClient.get('/geography/grampanchayats?skip=0&limit=100');
      setGramPanchayats(response.data);
      console.log('Gram Panchayats fetched:', response.data);
    } catch (error) {
      console.error('Error fetching Gram Panchayats:', error);
      setGramPanchayats([]);
    } finally {
      setLoadingGPs(false);
    }
  };

  // Fetch Analytics Data from API
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoadingAnalytics(true);
      setAnalyticsError(null);

      console.log('🔄 ===== ANALYTICS API CALL =====');
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

      const url = `/complaints/analytics/geo?${params.toString()}`;
      console.log('🌐 Full API URL:', url);
      console.log('🔗 Complete URL:', `${apiClient.defaults.baseURL}${url}`);
      
      // Check if token exists
      const token = localStorage.getItem('access_token');
      console.log('🔑 Token Status:', token ? 'Present' : 'Missing');
      if (token) {
        console.log('🔑 Token Preview:', token.substring(0, 20) + '...');
      }
      
      const response = await apiClient.get(url);
      
      console.log('✅ Analytics API Response:', {
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
        total: 0,
        open: 0,
        verified: 0,
        resolved: 0,
        disposed: 0
      };
      
      response.data?.response?.forEach(item => {
        const status = item.status?.toUpperCase();
        const count = item.count || 0;
        aggregated.total += count;
        
        switch (status) {
          case 'OPEN':
            aggregated.open += count;
            break;
          case 'VERIFIED':
            aggregated.verified += count;
            break;
          case 'RESOLVED':
            aggregated.resolved += count;
            break;
          case 'CLOSED':
          case 'DISPOSED':
            aggregated.disposed += count;
            break;
        }
      });
      
      console.log('📈 Aggregated Counts:', aggregated);
      console.log('🔄 ===== END ANALYTICS API CALL =====\n');
      
    } catch (error) {
      console.error('❌ ===== ANALYTICS API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END ANALYTICS API ERROR =====\n');
      
      setAnalyticsError(error.message || 'Failed to fetch analytics data');
      setAnalyticsData(null);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [activeScope, selectedLocation, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate]);

  // Fetch Complaints Chart Data from API
  const fetchComplaintsChartData = useCallback(async () => {
    try {
      setLoadingComplaintsChart(true);
      setComplaintsChartError(null);

      console.log('🔄 ===== COMPLAINTS CHART API CALL =====');
      console.log('📍 Current State:', {
        activeScope,
        selectedDistrictId,
        selectedBlockId,
        selectedGPId,
        selectedComplaintsYear
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

      // Add year range
      const startDate = `${selectedComplaintsYear}-01-01`;
      const endDate = `${selectedComplaintsYear}-12-31`;
      params.append('start_date', startDate);
      params.append('end_date', endDate);
      console.log('📅 Year Range:', startDate, 'to', endDate);

      const url = `/complaints/analytics/geo?${params.toString()}`;
      console.log('🌐 Full API URL:', url);
      
      const response = await apiClient.get(url);
      
      console.log('✅ Complaints Chart API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      setComplaintsChartData(response.data);
      console.log('🔄 ===== END COMPLAINTS CHART API CALL =====\n');
      
    } catch (error) {
      console.error('❌ ===== COMPLAINTS CHART API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END COMPLAINTS CHART API ERROR =====\n');
      
      setComplaintsChartError(error.message || 'Failed to fetch complaints chart data');
      setComplaintsChartData(null);
    } finally {
      setLoadingComplaintsChart(false);
    }
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, selectedComplaintsYear]);

  // Calculate complaint counts from analytics data
  const calculateComplaintCounts = () => {
    if (!analyticsData || !analyticsData.response) {
      return {
        total: 0,
        open: 0,
        verified: 0,
        resolved: 0,
        disposed: 0
      };
    }

    const counts = {
      total: 0,
      open: 0,
      verified: 0,
      resolved: 0,
      disposed: 0
    };

    // Aggregate counts by status
    analyticsData.response.forEach(item => {
      const status = item.status?.toUpperCase();
      const count = item.count || 0;

      // console.log('🔍 Processing complaint item:', {
      //   status: status,
      //   count: count,
      //   originalStatus: item.status
      // });

      counts.total += count;

      switch (status) {
        case 'OPEN':
          counts.open += count;
          break;
        case 'VERIFIED':
          counts.verified += count;
          break;
        case 'RESOLVED':
          counts.resolved += count;
          break;
        case 'CLOSED':
        case 'DISPOSED':
          counts.disposed += count;
          // console.log('✅ Added to disposed:', count);
          break;
        default:
          console.warn('Unknown status:', status);
      }
    });

    return counts;
  };

  // Get location options based on active scope and dropdown level
  const getLocationOptions = () => {
    switch (activeScope) {
      case 'State':
        return [{ id: 'rajasthan', name: 'Rajasthan' }];
      case 'Districts':
        return districts.map(district => ({ id: district.id, name: district.name }));
      case 'Blocks':
        if (dropdownLevel === 'districts') {
          return districts.map(district => ({ id: district.id, name: district.name }));
        } else if (dropdownLevel === 'blocks') {
          return blocks.filter(block => block.district_id === selectedDistrictForHierarchy?.id)
                      .map(block => ({ id: block.id, name: block.name }));
        }
        return [];
      case 'GPs':
        if (dropdownLevel === 'districts') {
          return districts.map(district => ({ id: district.id, name: district.name }));
        } else if (dropdownLevel === 'blocks') {
          return blocks.filter(block => block.district_id === selectedDistrictForHierarchy?.id)
                      .map(block => ({ id: block.id, name: block.name }));
        } else if (dropdownLevel === 'gps') {
          return gramPanchayats.filter(gp => gp.block_id === selectedBlockForHierarchy?.id)
                              .map(gp => ({ id: gp.id, name: gp.name }));
        }
        return [];
      default:
        return [{ id: 'rajasthan', name: 'Rajasthan' }];
    }
  };

  // Handle scope change
  const handleScopeChange = (scope) => {
    // Track tab change first
    trackTabChange(scope);
    
    // Close dropdown immediately to prevent showing stale options
    setShowLocationDropdown(false);
    
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
      // Fetch blocks for complaints chart
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
    } else {
      // For other scopes, reset to first option
      const options = getLocationOptions();
      if (options.length > 0) {
        updateLocationSelection(scope, options[0].name, options[0].id, null, null, null, 'tab_change');
      }
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    }
  };

  // Handle hierarchical selection
  const handleHierarchicalSelection = (item) => {
    if (activeScope === 'Blocks') {
      if (dropdownLevel === 'districts') {
        // User selected a district, now show blocks for that district
        const selectedDistrict = districts.find(d => d.id === item.id);
        setSelectedDistrictForHierarchy(selectedDistrict);
        setDropdownLevel('blocks');
        setSelectedLocation('Select Block');
        setShowLocationDropdown(true); // Keep dropdown open
      } else if (dropdownLevel === 'blocks') {
        // User selected a block, final selection
        trackDropdownChange(item.name, item.id, selectedDistrictForHierarchy?.id, item.id);
        updateLocationSelection('Blocks', item.name, item.id, selectedDistrictForHierarchy?.id, item.id, null, 'dropdown_change');
        setShowLocationDropdown(false);
        console.log('Selected block:', item.name, 'ID:', item.id, 'District:', selectedDistrictForHierarchy?.name);
      }
    } else if (activeScope === 'GPs') {
      if (dropdownLevel === 'districts') {
        // User selected a district, now show blocks for that district
        const selectedDistrict = districts.find(d => d.id === item.id);
        setSelectedDistrictForHierarchy(selectedDistrict);
        setDropdownLevel('blocks');
        setSelectedLocation('Select Block');
        setShowLocationDropdown(true); // Keep dropdown open
      } else if (dropdownLevel === 'blocks') {
        // User selected a block, now show GPs for that block
        const selectedBlock = blocks.find(b => b.id === item.id);
        setSelectedBlockForHierarchy(selectedBlock);
        setDropdownLevel('gps');
        setSelectedLocation('Select GP');
        setShowLocationDropdown(true); // Keep dropdown open
      } else if (dropdownLevel === 'gps') {
        // User selected a GP, final selection
        trackDropdownChange(item.name, item.id, selectedDistrictForHierarchy?.id, selectedBlockForHierarchy?.id, item.id);
        updateLocationSelection('GPs', item.name, item.id, selectedDistrictForHierarchy?.id, selectedBlockForHierarchy?.id, item.id, 'dropdown_change');
        setShowLocationDropdown(false);
        console.log('Selected GP:', item.name, 'ID:', item.id, 'Block:', selectedBlockForHierarchy?.name, 'District:', selectedDistrictForHierarchy?.name);
      }
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

  // Generate years (from 2020 to current year)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    return Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);
  };

  // Generate months
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

  // Generate days based on selected month and year
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

  // Fetch districts immediately when dashboard loads
  useEffect(() => {
    fetchDistricts();
  }, []);

  // Ensure complaints year is always current year on mount
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setSelectedComplaintsYear(currentYear);
  }, []);

  // Fetch Performance Data from API (both current and previous month)
  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoadingPerformance(true);
      setPerformanceError(null);

      console.log('🔄 ===== PERFORMANCE API CALL =====');
      console.log('📍 Current State:', {
        activeScope,
        selectedDistrictId,
        selectedBlockId,
        selectedGPId
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

      // Calculate current month date range
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11, so add 1
      const currentDay = now.getDate();
      
      const currentStartDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
      const currentEndDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${currentDay.toString().padStart(2, '0')}`;
      
      // Calculate previous month date range
      const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const previousMonthDays = new Date(previousYear, previousMonth, 0).getDate();
      
      const previousStartDate = `${previousYear}-${previousMonth.toString().padStart(2, '0')}-01`;
      const previousEndDate = `${previousYear}-${previousMonth.toString().padStart(2, '0')}-${previousMonthDays}`;
      
      console.log('📅 Current Month Range:', currentStartDate, 'to', currentEndDate);
      console.log('📅 Previous Month Range:', previousStartDate, 'to', previousEndDate);

      // Fetch current month data
      const currentParams = new URLSearchParams(params);
      currentParams.append('start_date', currentStartDate);
      currentParams.append('end_date', currentEndDate);
      
      const currentUrl = `/complaints/analytics/geo?${currentParams.toString()}`;
      console.log('🌐 Current Month API URL:', currentUrl);
      
      const currentResponse = await apiClient.get(currentUrl);
      console.log('✅ Current Month API Response:', currentResponse.data);
      
      // Fetch previous month data
      const previousParams = new URLSearchParams(params);
      previousParams.append('start_date', previousStartDate);
      previousParams.append('end_date', previousEndDate);
      
      const previousUrl = `/complaints/analytics/geo?${previousParams.toString()}`;
      console.log('🌐 Previous Month API URL:', previousUrl);
      
      const previousResponse = await apiClient.get(previousUrl);
      console.log('✅ Previous Month API Response:', previousResponse.data);
      
      setPerformanceApiData(currentResponse.data);
      setPreviousMonthApiData(previousResponse.data);
      console.log('🔄 ===== END PERFORMANCE API CALL =====\n');
      
    } catch (error) {
      console.error('❌ ===== PERFORMANCE API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END PERFORMANCE API ERROR =====\n');
      
      setPerformanceError(error.message || 'Failed to fetch performance data');
      setPerformanceApiData(null);
      setPreviousMonthApiData(null);
    } finally {
      setLoadingPerformance(false);
    }
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId]);

  // Fetch Top 3 data from dedicated API
  const fetchTop3Data = useCallback(async () => {
    try {
      setLoadingTop3(true);
      setTop3Error(null);

      console.log('🔄 ===== TOP 3 API CALL =====');
      console.log('📍 Current State:', {
        top3Scope,
        selectedDistrictId,
        selectedBlockId,
        selectedGPId
      });

      // Calculate current month date range
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
      
      const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
      const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${lastDayOfMonth}`;
      
      // Map scope to API level
      let level = 'DISTRICT';
      if (top3Scope === 'Block') {
        level = 'BLOCK';
      } else if (top3Scope === 'GP') {
        level = 'VILLAGE';
      }
      
      console.log('📅 Date Range:', startDate, 'to', endDate);
      console.log('📊 Level:', level);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('start_date', startDate);
      params.append('end_date', endDate);
      params.append('n', '5'); // Get top 5 but we'll only use top 3
      params.append('level', level);

      // Top 3 API works independently - no need for district_id or block_id parameters

      const url = `/complaints/analytics/top-n?${params.toString()}`;
      console.log('🌐 Top 3 API URL:', url);
      
      const response = await apiClient.get(url);
      
      console.log('✅ Top 3 API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      setTop3ApiData(response.data);
      console.log('🔄 ===== END TOP 3 API CALL =====\n');
      
    } catch (error) {
      console.error('❌ ===== TOP 3 API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END TOP 3 API ERROR =====\n');
      
      setTop3Error(error.message || 'Failed to fetch top 3 data');
      setTop3ApiData(null);
    } finally {
      setLoadingTop3(false);
    }
  }, [top3Scope, selectedDistrictId, selectedBlockId, selectedGPId]);

  // Fetch analytics data for overview section when scope, location, or date range changes
  useEffect(() => {
    // Only fetch if we have the necessary location data loaded
    if (activeScope === 'State' && districts.length === 0) {
      return; // Wait for districts to load
    }
    if (activeScope === 'Districts' && (!selectedDistrictId || blocks.length === 0)) {
      return; // Wait for blocks to load
    }
    if (activeScope === 'Blocks' && (!selectedBlockId || gramPanchayats.length === 0)) {
      return; // Wait for GPs to load
    }
    if (activeScope === 'GPs' && !selectedGPId) {
      return; // Wait for GP selection
    }
    
    fetchAnalyticsData();
  }, [activeScope, selectedLocation, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate, districts, blocks, gramPanchayats]);

  // Fetch complaints chart data when filters change (independent of overview date range)
  useEffect(() => {
    // Only fetch if we have the necessary location data loaded
    if (activeScope === 'State' && districts.length === 0) {
      return; // Wait for districts to load
    }
    if (activeScope === 'Districts' && (!selectedDistrictId || blocks.length === 0)) {
      return; // Wait for blocks to load
    }
    if (activeScope === 'Blocks' && (!selectedBlockId || gramPanchayats.length === 0)) {
      return; // Wait for GPs to load
    }
    if (activeScope === 'GPs' && !selectedGPId) {
      return; // Wait for GP selection
    }
    
    fetchComplaintsChartData();
  }, [activeComplaintsFilter, activeScope, selectedDistrictId, selectedBlockId, selectedGPId, selectedComplaintsYear, districts, blocks, gramPanchayats]);

  // Fetch performance data when scope or location changes
  useEffect(() => {
    // Only fetch if we have the necessary location data loaded
    if (activeScope === 'State' && districts.length === 0) {
      return; // Wait for districts to load
    }
    if (activeScope === 'Districts' && (!selectedDistrictId || blocks.length === 0)) {
      return; // Wait for blocks to load
    }
    if (activeScope === 'Blocks' && (!selectedBlockId || gramPanchayats.length === 0)) {
      return; // Wait for GPs to load
    }
    if (activeScope === 'GPs' && !selectedGPId) {
      return; // Wait for GP selection
    }
    
    fetchPerformanceData();
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, districts, blocks, gramPanchayats]);

  // Fetch Top 3 data when scope changes
  useEffect(() => {
    console.log('🔄 Top 3 useEffect triggered:', {
      top3Scope
    });
    
    // Always fetch data based on top3Scope - API works independently
    fetchTop3Data();
  }, [top3Scope, fetchTop3Data]);


  // Update selected location when districts are loaded
  useEffect(() => {
    if (activeScope === 'Districts' && districts.length > 0 && selectedLocation === 'Rajasthan') {
      setSelectedLocation(districts[0].name);
      setSelectedDistrictId(districts[0].id);
    }
  }, [districts, activeScope, selectedLocation]);

  // Update selected location when blocks are loaded
  useEffect(() => {
    if (activeScope === 'Blocks' && blocks.length > 0 && selectedLocation === 'Rajasthan') {
      setSelectedLocation(blocks[0].name);
      setSelectedBlockId(blocks[0].id);
    }
  }, [blocks, activeScope, selectedLocation]);

  // Update selected location when Gram Panchayats are loaded
  useEffect(() => {
    if (activeScope === 'GPs' && gramPanchayats.length > 0 && selectedLocation === 'Rajasthan') {
      setSelectedLocation(gramPanchayats[0].name);
      setSelectedGPId(gramPanchayats[0].id);
    }
  }, [gramPanchayats, activeScope, selectedLocation]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDateDropdown && !event.target.closest('[data-date-dropdown]')) {
        setShowDateDropdown(false);
      }
      if (showLocationDropdown && !event.target.closest('[data-location-dropdown]')) {
        setShowLocationDropdown(false);
      }
      if (showComplaintsYearDropdown && !event.target.closest('[data-complaints-year-dropdown]')) {
        setShowComplaintsYearDropdown(false);
      }
      if (showTop3Dropdown && !event.target.closest('[data-top3-dropdown]')) {
        setShowTop3Dropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDateDropdown, showLocationDropdown, showComplaintsYearDropdown, showTop3Dropdown]);

  // Get complaint data with real API values
  const getComplaintData = () => {
    const counts = calculateComplaintCounts();
    
    // Format numbers with commas
    const formatNumber = (num) => {
      return num.toLocaleString();
    };

    return [
      {
        title: 'Total complaints',
        value: loadingAnalytics ? '...' : formatNumber(counts.total),
        icon: List,
        color: '#3b82f6',
        trend: 'up',
        chartData: {
          series: [{
            data: [counts.total * 0.8, counts.total * 0.9, counts.total * 0.95, counts.total]
          }],
          options: {
            chart: {
              type: 'area',
              height: 40,
              sparkline: { enabled: true }
            },
            stroke: { curve: 'smooth', width: 2, colors: ['#3b82f6'] },
            fill: {
              type: 'solid',
              opacity: 0.10,
              colors: ['#3b82f6']
            },
            tooltip: { enabled: false },
            grid: { show: false },
            xaxis: { labels: { show: false } },
            yaxis: { labels: { show: false } }
          }
        }
      },
      {
        title: 'Open complaints',
        value: loadingAnalytics ? '...' : formatNumber(counts.open),
        icon: List,
        color: '#ef4444',
        trend: 'up',
        chartData: {
          series: [{
            data: [counts.open * 0.85, counts.open * 0.92, counts.open * 0.97, counts.open]
          }],
          options: {
            chart: {
              type: 'area',
              height: 40,
              sparkline: { enabled: true }
            },
            stroke: { curve: 'smooth', width: 2, colors: ['#ef4444'] },
            fill: {
              type: 'solid',
              opacity: 0.10,
              colors: ['#ef4444']
            },
            tooltip: { enabled: false },
            grid: { show: false },
            xaxis: { labels: { show: false } },
            yaxis: { labels: { show: false } }
          }
        }
      },
      {
        title: 'Verified complaints',
        value: loadingAnalytics ? '...' : formatNumber(counts.verified),
        icon: List,
        color: '#f97316',
        trend: 'up',
        chartData: {
          series: [{
            data: [counts.verified * 0.82, counts.verified * 0.89, counts.verified * 0.93, counts.verified]
          }],
          options: {
            chart: {
              type: 'area',
              height: 40,
              sparkline: { enabled: true }
            },
            stroke: { curve: 'smooth', width: 2, colors: ['#f97316'] },
            fill: {
              type: 'solid',
              opacity: 0.10,
              colors: ['#f97316']
            },
            tooltip: { enabled: false },
            grid: { show: false },
            xaxis: { labels: { show: false } },
            yaxis: { labels: { show: false } }
          }
        }
      },
      {
        title: 'Resolved complaints',
        value: loadingAnalytics ? '...' : formatNumber(counts.resolved),
        icon: List,
        color: '#8b5cf6',
        trend: 'up',
        chartData: {
          series: [{
            data: [counts.resolved * 0.8, counts.resolved * 0.88, counts.resolved * 0.92, counts.resolved]
          }],
          options: {
            chart: {
              type: 'area',
              height: 40,
              sparkline: { enabled: true }
            },
            stroke: { curve: 'smooth', width: 2, colors: ['#8b5cf6'] },
            fill: {
              type: 'solid',
              opacity: 0.10,
              colors: ['#8b5cf6']
            },
            tooltip: { enabled: false },
            grid: { show: false },
            xaxis: { labels: { show: false } },
            yaxis: { labels: { show: false } }
          }
        }
      },
      {
        title: 'Disposed complaints',
        value: loadingAnalytics ? '...' : formatNumber(counts.disposed),
        icon: List,
        color: '#10b981',
        trend: 'up',
        chartData: {
          series: [{
            data: [counts.disposed * 0.75, counts.disposed * 0.85, counts.disposed * 0.9, counts.disposed]
          }],
          options: {
            chart: {
              type: 'area',
              height: 40,
              sparkline: { enabled: true }
            },
            stroke: { curve: 'smooth', width: 2, colors: ['#10b981'] },
            fill: {
              type: 'solid',
              opacity: 0.10,
              colors: ['#10b981']
            },
            tooltip: { enabled: false },
            grid: { show: false },
            xaxis: { labels: { show: false } },
            yaxis: { labels: { show: false } }
          }
        }
      }
    ];
  };

  const complaintData = getComplaintData();

  // Calculate percentage of complaints closed/resolved
  const calculateClosedPercentage = () => {
    const counts = calculateComplaintCounts();
    
    // console.log('📊 Percentage Calculation Debug:', {
    //   total: counts.total,
    //   open: counts.open,
    //   verified: counts.verified,
    //   resolved: counts.resolved,
    //   disposed: counts.disposed
    // });
    
    if (counts.total === 0) {
      return 0;
    }
    
    // Calculate percentage: (resolved + disposed / total) * 100
    const closedCount = counts.resolved + counts.disposed;
    const percentage = Math.round((closedCount / counts.total) * 100);
    
    // console.log('📊 Percentage Calculation:', {
    //   closedCount,
    //   total: counts.total,
    //   percentage: `${percentage}%`,
    //   calculation: `(${closedCount} / ${counts.total}) * 100 = ${percentage}%`
    // });
    
    return percentage;
  };

  const closedPercentage = calculateClosedPercentage();

  // Generate dynamic x-axis categories based on selected tab and location
  const getXAxisCategories = () => {
    if (activeComplaintsFilter === 'Time') {
      // Show months for the selected year
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    } else if (activeComplaintsFilter === 'Location') {
      // Show locations based on current scope
      switch (activeScope) {
        case 'State':
          // State -> show all districts
          return districts.map(district => district.name);
        case 'Districts':
          // District -> show all blocks under that district
          console.log('🔍 Districts scope debug:', {
            selectedDistrictId,
            blocksLength: blocks.length,
            blocks: blocks.slice(0, 3), // Show first 3 blocks for debugging
            filteredBlocks: blocks.filter(block => block.district_id === selectedDistrictId)
          });
          
          if (selectedDistrictId) {
            const filteredBlocks = blocks.filter(block => block.district_id === selectedDistrictId);
            console.log('📊 Filtered blocks for district:', selectedDistrictId, filteredBlocks);
            return filteredBlocks.map(block => block.name);
          }
          return [];
        case 'Blocks':
          // Block -> show all GPs under that block
          if (selectedBlockId) {
            return gramPanchayats.filter(gp => gp.block_id === selectedBlockId)
                                .map(gp => gp.name);
          }
          return [];
        case 'GPs':
          // GP -> show only that GP
          if (selectedGPId) {
            const selectedGP = gramPanchayats.find(gp => gp.id === selectedGPId);
            return selectedGP ? [selectedGP.name] : [];
          }
          return [];
        default:
          return districts.map(district => district.name);
      }
    }
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  };

  const xAxisCategories = getXAxisCategories();
  
  console.log('📊 X-axis Categories Debug:', {
    activeComplaintsFilter,
    activeScope,
    selectedDistrictId,
    xAxisCategories,
    categoriesLength: xAxisCategories.length
  });

  // Generate dynamic chart data based on x-axis categories and API response
  const getChartData = () => {
    const categoryCount = xAxisCategories.length;
    
    // Initialize data arrays
    const openData = Array(categoryCount).fill(0);
    const closedData = Array(categoryCount).fill(0);
    const totalData = Array(categoryCount).fill(0);
    
    if (!complaintsChartData || !complaintsChartData.response) {
      return { open: openData, closed: closedData, total: totalData };
    }

    if (activeComplaintsFilter === 'Time') {
      // For Time tab: Group data by month
      complaintsChartData.response.forEach(item => {
        // Get month from date if available, or distribute evenly
        // For now, we'll distribute based on location hash to months
        const monthIndex = Math.abs(item.geo_name?.charCodeAt(0) || 0) % 12;
        const status = item.status?.toUpperCase();
        const count = item.count || 0;

        totalData[monthIndex] += count;

        if (status === 'OPEN' || status === 'VERIFIED') {
          openData[monthIndex] += count;
        } else if (status === 'RESOLVED' || status === 'CLOSED' || status === 'DISPOSED') {
          closedData[monthIndex] += count;
        }
      });
    } else if (activeComplaintsFilter === 'Location') {
      // For Location tab: Group data by geography_name
      const locationMap = new Map();
      
      complaintsChartData.response.forEach(item => {
        const geoName = item.geography_name || item.geo_name || 'Unknown';
        const status = item.status?.toUpperCase();
        const count = item.count || 0;

        if (!locationMap.has(geoName)) {
          locationMap.set(geoName, { open: 0, closed: 0, total: 0 });
        }

        const loc = locationMap.get(geoName);
        loc.total += count;

        if (status === 'OPEN' || status === 'VERIFIED') {
          loc.open += count;
        } else if (status === 'RESOLVED' || status === 'CLOSED' || status === 'DISPOSED') {
          loc.closed += count;
        }
      });

      // Debug logging
      console.log('Location Map:', locationMap);
      console.log('X-axis Categories:', xAxisCategories);
      
      // Map location data to x-axis categories
      xAxisCategories.forEach((category, index) => {
        const data = locationMap.get(category);
        if (data) {
          openData[index] = data.open;
          closedData[index] = data.closed;
          totalData[index] = data.total;
          console.log(`Mapped ${category}:`, data);
        } else {
          console.log(`No data found for category: ${category}`);
        }
      });
    }
    
    return {
      open: openData,
      closed: closedData,
      total: totalData
    };
  };

  const chartData = getChartData();

  // Process performance API data and calculate metrics
  const processPerformanceData = () => {
    if (!performanceApiData || !performanceApiData.response) {
      return new Map();
    }

    const geographyMap = new Map();

    // Group data by geography_name
    performanceApiData.response.forEach(item => {
      const geoName = item.geography_name || 'Unknown';
      const status = item.status?.toUpperCase();
      const count = item.count || 0;
      const avgResolutionTime = item.average_resolution_time || 0;

      if (!geographyMap.has(geoName)) {
        geographyMap.set(geoName, {
          name: geoName,
          id: item.geography_id,
          totalComplaints: 0,
          closedComplaints: 0,
          totalResolutionTime: 0,
          statusCounts: {}
        });
      }

      const geo = geographyMap.get(geoName);
      geo.totalComplaints += count;
      geo.totalResolutionTime += avgResolutionTime;
      geo.statusCounts[status] = count;

      // Count closed complaints (RESOLVED, CLOSED, DISPOSED)
      if (status === 'RESOLVED' || status === 'CLOSED' || status === 'DISPOSED') {
        geo.closedComplaints += count;
      }
    });

    // Calculate metrics for each geography
    geographyMap.forEach((geo, name) => {
      // Calculate average resolution time in days
      const avgResolutionTimeDays = geo.totalResolutionTime > 0 
        ? (geo.totalResolutionTime / 86400) // Convert seconds to days
        : 0;
      
      geo.avgResolutionTimeDays = Math.round(avgResolutionTimeDays * 10) / 10; // Round to 1 decimal
      
      // Calculate completion percentage
      // Formula: (RESOLVED complaints) / (OPEN + RESOLVED + VERIFIED + CLOSED) * 100
      const resolvedCount = geo.statusCounts.RESOLVED || 0;
      const totalRelevantComplaints = (geo.statusCounts.OPEN || 0) + 
                                    (geo.statusCounts.RESOLVED || 0) + 
                                    (geo.statusCounts.VERIFIED || 0) + 
                                    (geo.statusCounts.CLOSED || 0);
      
      geo.completionPercentage = totalRelevantComplaints > 0 
        ? Math.round((resolvedCount / totalRelevantComplaints) * 100)
        : 0;
      
      // Debug logging for completion calculation
      console.log(`📊 Completion Calculation for ${geo.name}:`, {
        resolved: resolvedCount,
        open: geo.statusCounts.OPEN || 0,
        verified: geo.statusCounts.VERIFIED || 0,
        closed: geo.statusCounts.CLOSED || 0,
        totalRelevant: totalRelevantComplaints,
        completion: geo.completionPercentage + '%'
      });
    });

    return geographyMap;
  };

  // Process previous month data and calculate growth
  const processPreviousMonthData = () => {
    if (!previousMonthApiData || !previousMonthApiData.response) {
      return new Map();
    }

    const geographyMap = new Map();

    // Group data by geography_name
    previousMonthApiData.response.forEach(item => {
      const geoName = item.geography_name || 'Unknown';
      const status = item.status?.toUpperCase();
      const count = item.count || 0;

      if (!geographyMap.has(geoName)) {
        geographyMap.set(geoName, {
          name: geoName,
          id: item.geography_id,
          statusCounts: {}
        });
      }

      const geo = geographyMap.get(geoName);
      geo.statusCounts[status] = count;
    });

    // Calculate completion percentage for each geography
    geographyMap.forEach((geo, name) => {
      const resolvedCount = geo.statusCounts.RESOLVED || 0;
      const totalRelevantComplaints = (geo.statusCounts.OPEN || 0) + 
                                    (geo.statusCounts.RESOLVED || 0) + 
                                    (geo.statusCounts.VERIFIED || 0) + 
                                    (geo.statusCounts.CLOSED || 0);
      
      geo.completionPercentage = totalRelevantComplaints > 0 
        ? Math.round((resolvedCount / totalRelevantComplaints) * 100)
        : 0;
    });

    return geographyMap;
  };

  // Calculate growth percentage
  const calculateGrowth = (currentCompletion, previousCompletion) => {
    if (previousCompletion === 0) {
      return currentCompletion > 0 ? 100 : 0; // If no previous data, growth is 100% if current > 0
    }
    const growth = currentCompletion - previousCompletion;
    
    // Debug logging for growth calculation
    console.log('📈 Growth Calculation:', {
      currentCompletion,
      previousCompletion,
      growth: `${growth}%`
    });
    
    return growth;
  };

  // Filter performance data based on active tab
  const getFilteredPerformanceData = (data) => {
    let filteredData = [];
    
    if (activePerformanceTab === 'starPerformers') {
      filteredData = data.filter(item => item.completion >= 50);
    } else if (activePerformanceTab === 'underperformers') {
      filteredData = data.filter(item => item.completion < 50);
    } else {
      filteredData = data;
    }
    
    console.log(`📊 Performance Filter (${activePerformanceTab}):`, {
      totalItems: data.length,
      filteredItems: filteredData.length,
      threshold: activePerformanceTab === 'starPerformers' ? '>= 50%' : '< 50%'
    });
    
    return filteredData;
  };

  // Get performance data based on current scope
  const getPerformanceData = () => {
    const processedData = processPerformanceData();
    const previousMonthData = processPreviousMonthData();
    
    let performanceData = [];
    
    switch (activeScope) {
      case 'State':
        // State -> show all districts
        performanceData = districts.map(district => {
          const apiData = processedData.get(district.name);
          const previousData = previousMonthData.get(district.name);
          const growth = calculateGrowth(
            apiData?.completionPercentage || 0,
            previousData?.completionPercentage || 0
          );
          
          return {
            name: district.name,
            id: district.id,
            type: 'District',
            avgResolutionTime: apiData?.avgResolutionTimeDays || 0,
            completion: apiData?.completionPercentage || 0,
            growth: growth
          };
        });
        break;
      case 'Districts':
        // District -> show all blocks under that district
        if (selectedDistrictId) {
          performanceData = blocks.filter(block => block.district_id === selectedDistrictId)
                      .map(block => {
                        const apiData = processedData.get(block.name);
                        const previousData = previousMonthData.get(block.name);
                        const growth = calculateGrowth(
                          apiData?.completionPercentage || 0,
                          previousData?.completionPercentage || 0
                        );
                        
                        return {
                          name: block.name,
                          id: block.id,
                          type: 'Block',
                          avgResolutionTime: apiData?.avgResolutionTimeDays || 0,
                          completion: apiData?.completionPercentage || 0,
                          growth: growth
                        };
                      });
        }
        break;
      case 'Blocks':
        // Block -> show all GPs under that block
        if (selectedBlockId) {
          performanceData = gramPanchayats.filter(gp => gp.block_id === selectedBlockId)
                              .map(gp => {
                                const apiData = processedData.get(gp.name);
                                const previousData = previousMonthData.get(gp.name);
                                const growth = calculateGrowth(
                                  apiData?.completionPercentage || 0,
                                  previousData?.completionPercentage || 0
                                );
                                
                                return {
                                  name: gp.name,
                                  id: gp.id,
                                  type: 'GP',
                                  avgResolutionTime: apiData?.avgResolutionTimeDays || 0,
                                  completion: apiData?.completionPercentage || 0,
                                  growth: growth
                                };
                              });
        }
        break;
      case 'GPs':
        // GP -> show only that GP
        if (selectedGPId) {
          const selectedGP = gramPanchayats.find(gp => gp.id === selectedGPId);
          if (selectedGP) {
            const apiData = processedData.get(selectedGP.name);
            const previousData = previousMonthData.get(selectedGP.name);
            const growth = calculateGrowth(
              apiData?.completionPercentage || 0,
              previousData?.completionPercentage || 0
            );
            
            performanceData = [{
              name: selectedGP.name,
              id: selectedGP.id,
              type: 'GP',
              avgResolutionTime: apiData?.avgResolutionTimeDays || 0,
              completion: apiData?.completionPercentage || 0,
              growth: growth
            }];
          }
        }
        break;
      default:
        performanceData = [];
    }
    
    return getFilteredPerformanceData(performanceData);
  };

  const performanceData = getPerformanceData();

  // Get Top 3 data from API response
  const getTop3Data = () => {
    if (!top3ApiData || !Array.isArray(top3ApiData)) {
      return [];
    }
    
    // API already returns data sorted by score (descending)
    // Take only top 3 and map to our format
    return top3ApiData.slice(0, 3).map((item, index) => ({
      name: item.geo_name,
      id: item.geo_id,
      type: top3Scope,
      score: item.score,
      rating: '', // Empty as requested
      growth: '' // Empty as requested
    }));
  };

  const top3Data = getTop3Data();

  // Simple error boundary
  if (typeof window !== 'undefined') {
    console.log('DashboardContent rendering...');
  }

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
            Dashboard
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
            }}>
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
              }}>
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
        marginRight : '16px', 
        marginTop : '6px',
        borderRadius: '12px',
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
                    Done
                  </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading/Error State */}
        {analyticsError && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            <strong>Error:</strong> {analyticsError}
          </div>
        )}

        {/* Data Cards and Progress Summary */}
        <div style={{
          display: 'flex',
          gap: '24px',
          opacity: loadingAnalytics ? 0.6 : 1,
          transition: 'opacity 0.3s'
        }}>
          {/* Data Cards */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '60%'
          }}>
            {/* Top Row - 2 cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(180px, 1fr))',
              gap: '12px'
            }}>
              {complaintData.slice(0, 2).map((item, index) => (
                <div key={index} style={{
                  backgroundColor: 'white',
                  padding: '16px',
                  borderRadius: '12px',
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: item.color
                    }}></div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <item.icon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
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
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#111827',
                    marginBottom: '12px'
                  }}>
                    {item.value}
                  </div>

                  {/* Mini chart */}
                  <div style={{ height: '40px' }}>
                    <Chart
                      options={item.chartData.options}
                      series={item.chartData.series}
                      type="area"
                      height={40}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Row - 3 cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))',
              gap: '12px'
            }}>
              {complaintData.slice(2, 5).map((item, index) => (
                <div key={index + 2} style={{
                  backgroundColor: 'white',
                  padding: '16px',
                  borderRadius: '12px',
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: item.color
                    }}></div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <item.icon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
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
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#111827',
                    marginBottom: '12px'
                  }}>
                    {item.value}
                  </div>

                  {/* Mini chart */}
                  <div style={{ height: '40px' }}>
                    <Chart
                      options={item.chartData.options}
                      series={item.chartData.series}
                      type="area"
                      height={40}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Summary */}
          <div style={{
            flex: 1,
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid lightgray',
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

            <h3 style={{
              color: '#111827',
              fontFamily: 'Noto Sans, sans-serif',
              fontSize: '18px',
              fontStyle: 'normal',
              fontWeight: '500',
              lineHeight: 'normal',
              letterSpacing: '0',
              margin: '0 0 16px 0'
            }}>
              Progress summary
            </h3>

            {/* Divider */}
            <div style={{
              width: '100%',
              height: '1px',
              backgroundColor: '#e5e7eb',
            }}></div>

            {/* Custom SVG Gauge Chart */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '250px',
              width: '100%',
            }}>
              <SegmentedGauge 
                complaintData={loadingAnalytics ? {open: 0, verified: 0, resolved: 0, disposed: 0} : calculateComplaintCounts()}
                percentage={loadingAnalytics ? 0 : closedPercentage} 
                label="Complaints closed" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Complaints Section */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        marginLeft: '16px',
        marginRight: '16px',
        marginTop: '16px',
        borderRadius: '12px',
        border: '1px solid lightgray'
      }}>
        {/* Complaints Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>
            Complaints
          </h2>
          
          {/* Filter Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {/* Time/Location buttons */}
            <div style={{
              display: 'flex',
              backgroundColor: '#f3f4f6',
              borderRadius: '12px',
              padding: '4px',
              gap: '2px'
            }}>
              <button 
                onClick={() => setActiveComplaintsFilter('Time')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: activeComplaintsFilter === 'Time' ? '#10b981' : 'transparent',
                  color: activeComplaintsFilter === 'Time' ? 'white' : '#6b7280',
                  transition: 'all 0.2s'
                }}>
                Time
              </button>
              <button 
                onClick={() => setActiveComplaintsFilter('Location')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: activeComplaintsFilter === 'Location' ? '#10b981' : 'transparent',
                  color: activeComplaintsFilter === 'Location' ? 'white' : '#6b7280',
                  transition: 'all 0.2s'
                }}>
                Location
              </button>
            </div>

            {/* Year dropdown - always visible */}
            <div 
              data-complaints-year-dropdown
              style={{
                position: 'relative',
                minWidth: '120px'
              }}>
              <button 
                onClick={() => setShowComplaintsYearDropdown(!showComplaintsYearDropdown)}
                style={{
                width: '100%',
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '12px',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
                  <span>{selectedComplaintsYear}</span>
                </div>
                <ChevronDown style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
              </button>
              
              {/* Year Dropdown Menu */}
              {showComplaintsYearDropdown && (
                <div style={{
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
                }}>
                  {generateYears().map(year => (
                    <div
                      key={year}
                      onClick={() => {
                        setSelectedComplaintsYear(year);
                        setShowComplaintsYearDropdown(false);
                        console.log('Selected complaints year:', year);
                      }}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        backgroundColor: selectedComplaintsYear === year ? '#f3f4f6' : 'transparent',
                        borderBottom: year < generateYears()[generateYears().length - 1] ? '1px solid #f3f4f6' : 'none'
                      }}
                    >
                      {year}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

  {/* Divider */}
  <div style={{
          width: '100%',
          height: '1px',
          backgroundColor: '#e5e7eb',
          marginBottom: '20px'
        }}></div>

        {/* Loading/Error State */}
        {complaintsChartError && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            <strong>Error:</strong> {complaintsChartError}
          </div>
        )}

        {/* Legend */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#ef4444'
            }}></div>
            <span style={{ fontSize: '14px', color: '#374151' }}>Open</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#10b981'
            }}></div>
            <span style={{ fontSize: '14px', color: '#374151' }}>Closed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6'
            }}></div>
            <span style={{ fontSize: '14px', color: '#374151' }}>Total</span>
          </div>
        </div>

        {/* Bar Chart */}
        <div style={{ 
          height: '300px',
          opacity: loadingComplaintsChart ? 0.6 : 1,
          transition: 'opacity 0.3s'
        }}>
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
              dataLabels: {
                enabled: false
              },
              stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
              },
              xaxis: {
                categories: xAxisCategories
              },
              yaxis: {
                title: {
                  text: 'Number of Complaints'
                },
                min: 0,
                max: 150,
                tickAmount: 5
              },
              fill: {
                opacity: 1
              },
              colors: ['#ef4444', '#10b981', '#3b82f6'],
              legend: {
                show: false
              },
              grid: {
                borderColor: '#f1f5f9'
              }
            }}
            series={[
              {
                name: 'Open',
                data: chartData.open
              },
              {
                name: 'Closed',
                data: chartData.closed
              },
              {
                name: 'Total',
                data: chartData.total
              }
            ]}
            type="bar"
            height={300}
          />
        </div>
      </div>

      {/* Performance and Top 3 Section */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginLeft: '16px',
        marginRight: '16px',
        marginTop: '16px'
      }}>
        {/* Performance Section */}
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          paddingLeft: '24px',
          paddingRight: '24px',
          paddingTop: '14px',
          paddingBottom: '24px',
          borderRadius: '12px',
          border: '1px solid lightgray'
        }}>
          {/* Performance Header with Toggle Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              Performance
            </h2>
            
            {/* Toggle Buttons */}
            <div style={{
              display: 'flex',
              backgroundColor: '#f3f4f6',
              borderRadius: '12px',
              padding: '4px',
              gap: '2px'
            }}>
              <button 
                onClick={() => setActivePerformanceTab('starPerformers')}
                style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                  backgroundColor: activePerformanceTab === 'starPerformers' ? '#10b981' : 'transparent',
                  color: activePerformanceTab === 'starPerformers' ? 'white' : '#6b7280'
              }}>
                Star Performers
              </button>
              <button 
                onClick={() => setActivePerformanceTab('underperformers')}
                style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                  backgroundColor: activePerformanceTab === 'underperformers' ? '#10b981' : 'transparent',
                  color: activePerformanceTab === 'underperformers' ? 'white' : '#6b7280'
              }}>
                Underperformers
              </button>
            </div>
          </div>

          {/* Loading/Error State */}
          {performanceError && (
            <div style={{
              padding: '16px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              <strong>Error:</strong> {performanceError}
            </div>
          )}

          {/* Performance Table */}
          <div style={{
            overflowX: 'auto',
            opacity: loadingPerformance ? 0.6 : 1,
            transition: 'opacity 0.3s'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed' // Ensures consistent column widths
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
                    Avg Resolution Time
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Complaints closed
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Growth
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Action
                  </th>
                </tr>
              </thead>
            </table>
            <div style={{
              maxHeight: '350px', // Approximately 5 rows * 60px per row
              overflowY: 'auto',
              borderTop: '1px solid #e5e7eb',
              // Custom scrollbar styling
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db #f3f4f6'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed' // Ensures consistent column widths
              }}>
              <tbody>
                  {performanceData.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{
                        padding: '20px',
                        textAlign: 'center',
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        No data available
                      </td>
                    </tr>
                  ) : (
                    performanceData.map((item, index) => (
                    <tr key={item.id || index} style={{
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                        color: '#374151',
                        fontWeight: '500'
                    }}>
                        {item.name}
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                        {item.avgResolutionTime > 0 ? `${item.avgResolutionTime} days` : '-'}
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                        {item.completion > 0 ? `${item.completion}%` : '-'}
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                        color: '#374151'
                    }}>
                        -
                    </td>
                    <td style={{
                      padding: '12px'
                    }}>
                      <button style={{
                        padding: '6px 12px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
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
        </div>

        {/* Top 3 Section */}
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          paddingLeft: '24px',
          paddingRight: '24px',
          paddingTop: '14px',
          paddingBottom: '24px',
          borderRadius: '12px',
          border: '1px solid lightgray'
        }}>
          {/* Top 3 Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
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
                Top 3
              </h2>
              <Info style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
            </div>
            <div 
              data-top3-dropdown
              style={{
              position: 'relative',
              minWidth: '100px'
            }}>
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
              }}>
                <span>{top3Scope}</span>
                <ChevronDown style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
              </button>
              
              {showTop3Dropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  zIndex: 10,
                  marginTop: '4px'
                }}>
                  {['District', 'Block', 'GP'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setTop3Scope(option);
                        setShowTop3Dropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: 'none',
                        backgroundColor: top3Scope === option ? '#f3f4f6' : 'transparent',
                        color: top3Scope === option ? '#111827' : '#6b7280',
                        fontSize: '14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        margin: '2px'
                      }}>
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>


          {/* Loading/Error State */}
          {top3Error && (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              {top3Error}
            </div>
          )}

          {/* Top 3 Table */}
          <div style={{
            overflowX: 'auto',
            opacity: loadingTop3 ? 0.6 : 1,
            transition: 'opacity 0.3s'
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
                    Rank
                  </th>
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
                    Rating
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Growth
                  </th>
                
                </tr>
              </thead>
              <tbody>
                {top3Data.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{
                      padding: '20px',
                      textAlign: 'center',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      {loadingTop3 ? 'Loading...' : 'No data available'}
                    </td>
                  </tr>
                ) : (
                  top3Data.map((item, index) => (
                  <tr key={index} style={{
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      <img 
                        src={index === 0 ? number1 : index === 1 ? number2 : number3} 
                        alt={`Rank ${index + 1}`}
                        style={{
                          width: '100px',
                          height: '100px',
                          objectFit: 'contain'
                        }}
                      />
                    </td>
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
                      color: '#6b7280'
                    }}>
                      {item.rating || '-'}
                    </td>
                    <td style={{
                      padding: '12px',
                        fontSize: '14px',
                      color: '#6b7280'
                      }}>
                      {item.growth || '-'}
                    </td>
                   
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;