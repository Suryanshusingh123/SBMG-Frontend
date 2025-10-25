import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown, Calendar, List, Info, TrendingUp } from 'lucide-react';
import Chart from 'react-apexcharts';
import number1 from '../../assets/images/number1.png';
import number2 from '../../assets/images/nnumber2.png';
import number3 from '../../assets/images/number3.png';
import apiClient from '../../services/api';

const SegmentedGauge = ({ percentage, label = "Complaints closed" }) => {
  // Calculate which segments should be filled based on percentage
  const getSegmentColor = (segmentIndex) => {
    const segmentThreshold = (segmentIndex + 1) * 33.33; // Each segment represents ~33%
    
    if (percentage >= segmentThreshold) {
      // Fully filled
      if (segmentIndex === 0) return '#10b981'; // Green
      if (segmentIndex === 1) return '#fbbf24'; // Yellow
      if (segmentIndex === 2) return '#ef4444'; // Red
    } else if (percentage > (segmentIndex * 33.33)) {
      // Partially filled - show appropriate color
      if (segmentIndex === 0) return '#10b981';
      if (segmentIndex === 1) return '#fbbf24';
      if (segmentIndex === 2) return '#ef4444';
    }
    return '#f3f4f6'; // Gray (unfilled)
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

  // Segment angles (200° total, divided into 3 segments with gaps)
  const gapSize = 19; // degrees
  const totalAngle = 200;
  const segmentAngle = (totalAngle - (2 * gapSize)) / 3;
  
  const segments = [
    { start: -90, end: -90 + segmentAngle, color: getSegmentColor(0) },
    { start: -90 + segmentAngle + gapSize, end: -90 + (2 * segmentAngle) + gapSize, color: getSegmentColor(1) },
    { start: -90 + (2 * segmentAngle) + (2 * gapSize), end: 90, color: getSegmentColor(2) }
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

const DashboardContent = () => {
  const [activeScope, setActiveScope] = useState('State');
  const [selectedLocation, setSelectedLocation] = useState('Rajashtan / All');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState(null);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [gramPanchayats, setGramPanchayats] = useState([]);
  const [selectedGPId, setSelectedGPId] = useState(null);
  const [loadingGPs, setLoadingGPs] = useState(false);
  
  // Hierarchical dropdown state
  const [dropdownLevel, setDropdownLevel] = useState('districts'); // 'districts', 'blocks', 'gps'
  const [selectedDistrictForHierarchy, setSelectedDistrictForHierarchy] = useState(null);
  const [selectedBlockForHierarchy, setSelectedBlockForHierarchy] = useState(null);
  
  // Date selection state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null); // null means not selected
  const [selectedDay, setSelectedDay] = useState(null); // null means not selected
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [selectionStep, setSelectionStep] = useState('year'); // 'year', 'month', 'day'
  
  // Date range state
  const [selectedDateRange, setSelectedDateRange] = useState('Last 30 Days');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isCustomRange, setIsCustomRange] = useState(false);
  
  // Complaints year selection state
  const [selectedComplaintsYear, setSelectedComplaintsYear] = useState(new Date().getFullYear());
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
    setActiveScope(scope);
    
    // Close dropdown immediately to prevent showing stale options
    setShowLocationDropdown(false);
    
    if (scope === 'State') {
      // For State scope, set Rajasthan as default and disable dropdown
      setSelectedLocation('Rajashtan / All');
      setSelectedDistrictId(null);
      setSelectedBlockId(null);
      setSelectedGPId(null);
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    } else if (scope === 'Districts') {
      // Set first district as selected (districts are already loaded)
      if (districts.length > 0) {
        setSelectedLocation(districts[0].name);
        setSelectedDistrictId(districts[0].id);
        setSelectedBlockId(null);
        setSelectedGPId(null);
      }
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    } else if (scope === 'Blocks') {
      // For blocks, start with districts level
      fetchBlocks();
      setSelectedDistrictId(null);
      setSelectedBlockId(null);
      setSelectedGPId(null);
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
      setSelectedLocation('Select District');
    } else if (scope === 'GPs') {
      // For GPs, start with districts level
      fetchBlocks();
      fetchGramPanchayats();
      setSelectedDistrictId(null);
      setSelectedBlockId(null);
      setSelectedGPId(null);
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
      setSelectedLocation('Select District');
    } else {
      // For other scopes, reset to first option
      const options = getLocationOptions();
      if (options.length > 0) {
        setSelectedLocation(options[0].name);
        setSelectedDistrictId(null);
        setSelectedBlockId(null);
        setSelectedGPId(null);
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
        setSelectedLocation(item.name);
        setSelectedBlockId(item.id);
        setSelectedDistrictId(selectedDistrictForHierarchy?.id);
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
        setSelectedLocation(item.name);
        setSelectedGPId(item.id);
        setSelectedBlockId(selectedBlockForHierarchy?.id);
        setSelectedDistrictId(selectedDistrictForHierarchy?.id);
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
      const start = new Date(today);
      start.setDate(today.getDate() - range.days);
      
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDateDropdown, showLocationDropdown, showComplaintsYearDropdown]);

  const complaintData = [
    {
      title: 'Total complaints',
      value: '3,452',
      icon: List,
      color: '#3b82f6',
      trend: 'up',
      chartData: {
        series: [{
          data: [2800, 3000, 3200, 3452]
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
      value: '452',
      icon: List,
      color: '#ef4444',
      trend: 'up',
      chartData: {
        series: [{
          data: [400, 420, 440, 452]
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
      value: '3,000',
      icon: List,
      color: '#f97316',
      trend: 'up',
      chartData: {
        series: [{
          data: [2500, 2700, 2800, 3000]
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
      title: 'Disposed complaints',
      value: '2,000',
      icon: List,
      color: '#10b981',
      trend: 'up',
      chartData: {
        series: [{
          data: [1500, 1700, 1800, 2000]
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
                          setSelectedLocation(location.name);
                          setSelectedDistrictId(location.id);
                          setSelectedBlockId(null);
                          setSelectedGPId(null);
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
          {activeScope === 'State' ? selectedLocation : `Rajashtan / ${selectedLocation}`}
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
                            setStartDate(null);
                            setEndDate(null);
                            setIsCustomRange(false);
                            setSelectedDateRange('Last 30 Days');
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

        {/* Data Cards and Progress Summary */}
        <div style={{
          display: 'flex',
          gap: '24px'
        }}>
          {/* Data Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(180px, 1fr))',
            gap: '12px',
            width: '60%'
          }}>
            {complaintData.map((item, index) => (
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
              <SegmentedGauge percentage={70} label="Complaints closed" />
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
        <div style={{ height: '300px' }}>
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
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
              },
              yaxis: {
                title: {
                  text: 'Number of Complaints'
                },
                min: 0,
                max: 300,
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
                data: [45, 52, 38, 42, 55, 48, 62, 58, 51, 47, 53, 49]
              },
              {
                name: 'Closed',
                data: [120, 135, 110, 125, 140, 130, 155, 145, 135, 125, 140, 135]
              },
              {
                name: 'Total',
                data: [165, 187, 148, 167, 195, 178, 217, 203, 186, 172, 193, 184]
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
              <button style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: '#10b981',
                color: 'white'
              }}>
                Star Performers
              </button>
              <button style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: 'transparent',
                color: '#6b7280'
              }}>
                Underperformers
              </button>
            </div>
          </div>

          {/* Performance Table */}
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
                    Avg Response
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Completion
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
              <tbody>
                {[
                  { district: 'District A', response: '3 days', completion: '56%', growth: '+10%', growthColor: '#10b981' },
                  { district: 'District B', response: '3.3 days', completion: '56%', growth: '0%', growthColor: '#6b7280' },
                  { district: 'District C', response: '4 days', completion: '56%', growth: '-10%', growthColor: '#ef4444' },
                  { district: 'District D', response: '4.5 days', completion: '56%', growth: '+5%', growthColor: '#10b981' },
                  { district: 'District E', response: '5 days', completion: '56%', growth: '+2%', growthColor: '#10b981' }
                ].map((row, index) => (
                  <tr key={index} style={{
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      {row.district}
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      {row.response}
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      {row.completion}
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: row.growthColor,
                      fontWeight: '500'
                    }}>
                      {row.growth}
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
                ))}
              </tbody>
            </table>
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
                    Rank
                  </th>
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
                {[
                  { rank: 1, name: 'District name', rating: '9.8', growth: '+1', image: number1 },
                  { rank: 2, name: 'District name', rating: '9.0', growth: '+2', image: number2 },
                  { rank: 3, name: 'District name', rating: '8.2', growth: '+3', image: number3 }
                ].map((item, index) => (
                  <tr key={index} style={{
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      <img 
                        src={item.image} 
                        alt={`Rank ${item.rank}`}
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
                      color: '#374151'
                    }}>
                      {item.rating}
                    </td>
                    <td style={{
                      padding: '12px'
                    }}>
                      <div style={{
                        display: 'inline-block',
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        padding: '1px 8px',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '400',
                        border: '1px solid #bbf7d0'
                      }}>
                        {item.growth}
                      </div>
                    </td>
                   
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;