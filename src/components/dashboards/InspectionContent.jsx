import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, ChevronDown, ChevronRight, Calendar, List, Info, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Users, UserCheck, UserX } from 'lucide-react';
import Chart from 'react-apexcharts';
import number1 from '../../assets/images/number1.png';
import number2 from '../../assets/images/nnumber2.png';
import number3 from '../../assets/images/number3.png';
import apiClient from '../../services/api';


const InspectionContent = () => {
  // Refs to prevent duplicate API calls
  const hasFetchedInitialData = useRef(false);

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

  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [activePerformance, setActivePerformance] = useState('Time');

  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  // Critical issues data state
  const [criticalIssuesData, setCriticalIssuesData] = useState(null);
  const [loadingCriticalIssues, setLoadingCriticalIssues] = useState(false);
  const [criticalIssuesError, setCriticalIssuesError] = useState(null);

  // Top Performers data state
  const [topPerformersData, setTopPerformersData] = useState(null);
  const [loadingTopPerformers, setLoadingTopPerformers] = useState(false);
  const [topPerformersError, setTopPerformersError] = useState(null);

  // Your Inspections data state
  const [yourInspectionsData, setYourInspectionsData] = useState(null);
  const [loadingYourInspections, setLoadingYourInspections] = useState(false);
  const [yourInspectionsError, setYourInspectionsError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Top Performers dropdown state
  const [showPerformersDropdown1, setShowPerformersDropdown1] = useState(false);
  const [showPerformersDropdown2, setShowPerformersDropdown2] = useState(false);
  const [showPerformanceReportDropdown, setShowPerformanceReportDropdown] = useState(false);
  const [selectedPerformersFilter1, setSelectedPerformersFilter1] = useState('District');
  const [selectedPerformersFilter2, setSelectedPerformersFilter2] = useState('District');
  const [selectedPerformanceReportFilter, setSelectedPerformanceReportFilter] = useState('District');

  // Refs to prevent duplicate API calls
  const analyticsCallInProgress = useRef(false);
  const criticalIssuesCallInProgress = useRef(false);
  const topPerformersCallInProgress = useRef(false);
  const yourInspectionsCallInProgress = useRef(false);

  // Date selection state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [selectionStep, setSelectionStep] = useState('year');
  
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
      console.log('Districts API Response:', response.data);
      setDistricts(response.data);
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Fetch blocks for a specific district
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

  // Fetch gram panchayats for a specific district & block
  const fetchGramPanchayats = useCallback(async (districtId, blockId) => {
    if (!districtId || !blockId) {
      setGramPanchayats([]);
      return;
    }

    try {
      setLoadingGPs(true);
      const response = await apiClient.get('/geography/grampanchayats', {
        params: {
          district_id: districtId,
          block_id: blockId,
          skip: 0,
          limit: 100
        }
      });
      console.log('GPs API Response:', response.data);
      setGramPanchayats(response.data);
    } catch (error) {
      console.error('Error fetching gram panchayats:', error);
      setGramPanchayats([]);
    } finally {
      setLoadingGPs(false);
    }
  }, []);

  // Effect to fetch initial data
  useEffect(() => {
    if (hasFetchedInitialData.current) return;
    
    if (activeScope === 'State') {
      fetchDistricts();
      hasFetchedInitialData.current = true;
    }
  }, [activeScope]);

  // Effect to fetch data when scope changes
  useEffect(() => {
    if (activeScope === 'Districts' || activeScope === 'Blocks' || activeScope === 'GPs') {
      fetchDistricts();
      if (activeScope !== 'Districts') {
        setBlocks([]);
        setGramPanchayats([]);
      }
    }
  }, [activeScope]);

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

  // Helper functions
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
        return gramPanchayats.filter(gp => gp.block_id === selectedBlockForHierarchy?.id);
      }
    }
    return [];
  };

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
      setSelectedDistrictId(district.id);
      setSelectedLocation(district.name);
      setSelectedLocationId(district.id);
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
      if (district) {
        setSelectedDistrictId(district.id);
        setSelectedDistrictForHierarchy(district);
      }
      setSelectedBlockId(block.id);
      setSelectedBlockForHierarchy(block);
      setSelectedLocation(block.name);
      fetchGramPanchayats(district?.id, block.id);
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
    const district = districts.find(d => d.id === (block?.district_id || selectedDistrictForHierarchy?.id || selectedDistrictId)) || selectedDistrictForHierarchy;

    if (district) {
      setSelectedDistrictId(district.id);
      setSelectedDistrictForHierarchy(district);
    }
    if (block) {
      setSelectedBlockId(block.id);
      setSelectedBlockForHierarchy(block);
    }

    setSelectedGPId(gp.id);
    setSelectedLocation(gp.name);
    fetchGramPanchayats(district?.id, block?.id || gp.block_id);
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

  // Date helper functions
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

  const handleCalendarClick = () => {
    setShowDateDropdown(!showDateDropdown);
  };

  const handleDateRangeSelection = (range) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (range.value === 'custom') {
      setIsCustomRange(true);
      setSelectedDateRange('Custom');
    } else {
      setIsCustomRange(false);
      setSelectedDateRange(range.label);
      
      if (range.days !== null) {
        const start = new Date(today);
        start.setDate(start.getDate() - range.days);
        const startStr = start.toISOString().split('T')[0];
        setStartDate(startStr);
        setEndDate(todayStr);
      }
      
      // Close dropdown after selection
      setShowDateDropdown(false);
    }
  };

  // Fetch inspection analytics data from API
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

      console.log('🔄 ===== INSPECTION ANALYTICS API CALL =====');
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

      const url = `/inspections/analytics?${params.toString()}`;
      console.log('🌐 Full API URL:', url);
      console.log('🔗 Complete URL:', `${apiClient.defaults.baseURL}${url}`);
      
      const response = await apiClient.get(url);
      
      console.log('✅ Inspection Analytics API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      setAnalyticsData(response.data);
      
      console.log('🔄 ===== END INSPECTION ANALYTICS API CALL =====\n');
      
    } catch (error) {
      console.error('❌ ===== INSPECTION ANALYTICS API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END INSPECTION ANALYTICS API ERROR =====\n');
      
      setAnalyticsError(error.message || 'Failed to fetch analytics data');
      setAnalyticsData(null);
    } finally {
      setLoadingAnalytics(false);
      analyticsCallInProgress.current = false;
    }
  }, [activeScope, selectedLocation, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate]);

  // Fetch critical issues data from API
  const fetchCriticalIssuesData = useCallback(async () => {
    // Prevent duplicate calls
    if (criticalIssuesCallInProgress.current) {
      console.log('⏸️ Critical Issues API call already in progress, skipping...');
      return;
    }
    
    try {
      criticalIssuesCallInProgress.current = true;
      setLoadingCriticalIssues(true);
      setCriticalIssuesError(null);

      console.log('🔄 ===== CRITICAL ISSUES API CALL =====');
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

      const url = `/inspections/criticals?${params.toString()}`;
      console.log('🌐 Full API URL:', url);
      console.log('🔗 Complete URL:', `${apiClient.defaults.baseURL}${url}`);
      
      const response = await apiClient.get(url);
      
      console.log('✅ Critical Issues API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      setCriticalIssuesData(response.data);
      
      console.log('🔄 ===== END CRITICAL ISSUES API CALL =====\n');
      
    } catch (error) {
      console.error('❌ ===== CRITICAL ISSUES API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END CRITICAL ISSUES API ERROR =====\n');
      
      setCriticalIssuesError(error.message || 'Failed to fetch critical issues data');
      setCriticalIssuesData(null);
    } finally {
      setLoadingCriticalIssues(false);
      criticalIssuesCallInProgress.current = false;
    }
  }, [activeScope, selectedLocation, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate]);

  // Fetch top performers data from API
  const fetchTopPerformersData = useCallback(async (level) => {
    // Prevent duplicate calls
    if (topPerformersCallInProgress.current) {
      console.log('⏸️ Top Performers API call already in progress, skipping...');
      return;
    }
    
    try {
      topPerformersCallInProgress.current = true;
      setLoadingTopPerformers(true);
      setTopPerformersError(null);

      console.log('🔄 ===== TOP PERFORMERS API CALL =====');
      console.log('📍 Level:', level);

      // Map dropdown selection to API level
      let apiLevel = 'DISTRICT';
      if (level === 'Block') {
        apiLevel = 'BLOCK';
      } else if (level === 'GP') {
        apiLevel = 'VILLAGE';
      }

      const url = `/inspections/top-performers?level=${apiLevel}`;
      console.log('🌐 Full API URL:', url);
      console.log('🔗 Complete URL:', `${apiClient.defaults.baseURL}${url}`);
      
      const response = await apiClient.get(url);
      
      console.log('✅ Top Performers API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      setTopPerformersData(response.data);
      
      console.log('🔄 ===== END TOP PERFORMERS API CALL =====\n');
      
    } catch (error) {
      console.error('❌ ===== TOP PERFORMERS API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END TOP PERFORMERS API ERROR =====\n');
      
      setTopPerformersError(error.message || 'Failed to fetch top performers data');
      setTopPerformersData(null);
    } finally {
      setLoadingTopPerformers(false);
      topPerformersCallInProgress.current = false;
    }
  }, []);

  // Fetch Your Inspections data from API
  const fetchYourInspectionsData = useCallback(async (page = 1) => {
    // Prevent duplicate calls
    if (yourInspectionsCallInProgress.current) {
      console.log('⏸️ Your Inspections API call already in progress, skipping...');
      return;
    }
    
    try {
      yourInspectionsCallInProgress.current = true;
      setLoadingYourInspections(true);
      setYourInspectionsError(null);

      console.log('🔄 ===== YOUR INSPECTIONS API CALL =====');
      console.log('📍 Page:', page);

      // Get current year dates
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '20',
        start_date: startDate,
        end_date: endDate
      });

      const url = `/inspections/my?${params.toString()}`;
      console.log('🌐 Full API URL:', url);
      console.log('🔗 Complete URL:', `${apiClient.defaults.baseURL}${url}`);
      
      const response = await apiClient.get(url);
      
      console.log('✅ Your Inspections API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      setYourInspectionsData(response.data);
      setCurrentPage(response.data.page || 1);
      setTotalPages(response.data.total_pages || 1);
      
      console.log('🔄 ===== END YOUR INSPECTIONS API CALL =====\n');
      
    } catch (error) {
      console.error('❌ ===== YOUR INSPECTIONS API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END YOUR INSPECTIONS API ERROR =====\n');
      
      setYourInspectionsError(error.message || 'Failed to fetch your inspections data');
      setYourInspectionsData(null);
    } finally {
      setLoadingYourInspections(false);
      yourInspectionsCallInProgress.current = false;
    }
  }, []);

  // Effect to fetch analytics when scope or location changes
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Effect to fetch critical issues when scope or location changes
  useEffect(() => {
    fetchCriticalIssuesData();
  }, [fetchCriticalIssuesData]);

  // Effect to fetch top performers data when dropdown selection changes
  useEffect(() => {
    fetchTopPerformersData(selectedPerformersFilter1);
  }, [selectedPerformersFilter1, fetchTopPerformersData]);

  // Effect to fetch Your Inspections data when component mounts
  useEffect(() => {
    fetchYourInspectionsData(1);
  }, [fetchYourInspectionsData]);

  // Effect to close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close all dropdowns when clicking outside
      if (!event.target.closest('[data-dropdown]')) {
        setShowPerformersDropdown1(false);
        setShowPerformersDropdown2(false);
        setShowPerformanceReportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper functions to extract values from analyticsData
  const getAverageScore = () => {
    if (loadingAnalytics) return '...';
    if (analyticsError || !analyticsData || !analyticsData.response || analyticsData.response.length === 0) {
      return '0%';
    }
    
    const scores = analyticsData.response.map(item => item.average_score || 0);
    const sum = scores.reduce((acc, score) => acc + score, 0);
    const average = scores.length > 0 ? sum / scores.length : 0;
    return `${average.toFixed(0)}%`;
  };

  const getTotalInspections = () => {
    if (loadingAnalytics) return '...';
    if (analyticsError || !analyticsData || !analyticsData.response || analyticsData.response.length === 0) {
      return '0';
    }
    
    // Sum up inspections based on geo_type
    const total = analyticsData.response.reduce((acc, item) => {
      if (analyticsData.geo_type === 'DISTRICT') {
        return acc + (item.inspected_blocks || 0);
      } else if (analyticsData.geo_type === 'BLOCK' || analyticsData.geo_type === 'VILLAGE') {
        return acc + (item.inspected_gps || 0);
      }
      return acc;
    }, 0);
    
    return total.toLocaleString();
  };

  const getVillageCoverage = () => {
    if (loadingAnalytics) return '0/0';
    if (analyticsError || !analyticsData || !analyticsData.response || analyticsData.response.length === 0) {
      return '0/0';
    }
    
    const inspectedGPs = analyticsData.response.reduce((acc, item) => acc + (item.inspected_gps || 0), 0);
    const totalGPs = analyticsData.response.reduce((acc, item) => acc + (item.total_gps || 0), 0);
    
    return `${inspectedGPs.toLocaleString()}/${totalGPs.toLocaleString()}`;
  };

  // Helper functions to extract values from criticalIssuesData
  const getCriticalIssuesCount = (issueType) => {
    if (loadingCriticalIssues) return '...';
    if (criticalIssuesError || !criticalIssuesData) {
      return '0';
    }
    
    return criticalIssuesData[issueType]?.toLocaleString() || '0';
  };

  // Helper functions to extract values from topPerformersData
  const getTopPerformers = () => {
    if (loadingTopPerformers) return [];
    if (topPerformersError || !topPerformersData || !Array.isArray(topPerformersData) || topPerformersData.length === 0) {
      return [];
    }
    
    // Get the first item from the response array and return its inspectors
    const firstItem = topPerformersData[0];
    return firstItem?.inspectors || [];
  };

  // Helper functions to extract values from yourInspectionsData
  const getYourInspections = () => {
    if (loadingYourInspections) return [];
    if (yourInspectionsError || !yourInspectionsData || !yourInspectionsData.items) {
      return [];
    }
    
    return yourInspectionsData.items || [];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  };

  // Dropdown options for Top Performers
  const performersFilterOptions1 = ['District', 'Block', 'GP'];
  const performersFilterOptions2 = ['District', 'Block', 'GP'];

  // Dropdown click handlers
  const handlePerformersDropdown1Click = () => {
    setShowPerformersDropdown1(!showPerformersDropdown1);
    setShowPerformersDropdown2(false); // Close other dropdown
    setShowPerformanceReportDropdown(false); // Close other dropdown
  };

  const handlePerformersDropdown2Click = () => {
    setShowPerformersDropdown2(!showPerformersDropdown2);
    setShowPerformersDropdown1(false); // Close other dropdown
    setShowPerformanceReportDropdown(false); // Close other dropdown
  };

  const handlePerformanceReportDropdownClick = () => {
    setShowPerformanceReportDropdown(!showPerformanceReportDropdown);
    setShowPerformersDropdown1(false); // Close other dropdown
    setShowPerformersDropdown2(false); // Close other dropdown
  };

  const handlePerformersFilter1Select = (filter) => {
    setSelectedPerformersFilter1(filter);
    setShowPerformersDropdown1(false);
  };

  const handlePerformersFilter2Select = (filter) => {
    setSelectedPerformersFilter2(filter);
    setShowPerformersDropdown2(false);
  };

  const handlePerformanceReportFilterSelect = (filter) => {
    setSelectedPerformanceReportFilter(filter);
    setShowPerformanceReportDropdown(false);
  };

  // Chart data for State Performance Score
  const chartOptions = {
    chart: {
      type: 'bar',
      height: 300,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 2
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: ['Ajmer', 'Anupgarh', 'Balotra', 'Baran', 'Barmer', 'Beawar', 'Bharatpur', 'Bhilwara', 'Bikaner', 'Bundi', 'Chittorgarh', 'Dausa', 'Deeg', 'Location 15', 'Didwana-Kuchaman', 'Dholpur'],
      labels: {
        style: {
          fontSize: '11px',
          colors: '#6b7280'
        },
        rotate: -45,
        rotateAlways: true
      }
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      labels: {
        style: {
          fontSize: '12px',
          colors: '#6b7280'
        }
      }
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    colors: ['#ef4444', '#10b981'],
    legend: {
      show: false
    },
    theme: {
      mode: 'light'
    },
    annotations: {
      yaxis: [
        {
          y: 65,
          borderColor: '#9ca3af',
          borderWidth: 2,
          strokeDashArray: 5,
          label: {
            text: 'State Average',
            style: {
              color: '#6b7280',
              fontSize: '12px'
            },
            offsetX: -10
          }
        }
      ]
    }
  };

  const chartSeries = [
    {
      name: 'Below state average',
      data: [15, 15, 0, 0, 38, 0, 43, 42, 0, 0, 0, 0, 0, 49, 54, 0]
    },
    {
      name: 'Above state average', 
      data: [0, 0, 72, 72, 0, 72, 0, 0, 75, 75, 75, 76, 76, 0, 0, 80]
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
            Inspection
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
                onClick={() => setActiveScope(scope)}
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
          <div style={{
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

          {/* KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            {/* Statewide Avg Score */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  margin: 0
                }}>
                  Statewide Avg Score
                </h3>
                <Info style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>
                {getAverageScore()}
              </div>
            </div>

            {/* Total inspections */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <List style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    Total inspections
                  </h3>
                </div>
                <Info style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>
                {getTotalInspections()}
              </div>
            </div>

            {/* Village covered */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  margin: 0
                }}>
                  Village covered
                </h3>
                <Info style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>
                {getVillageCoverage()}
              </div>
            </div>
          </div>

          {/* State Performance Score Chart */}
          <div style={{
            backgroundColor: 'white',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                State performance score
              </h3>
              
              {/* Legend */}
              <div style={{
                display: 'flex',
                  gap: '6px'
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
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Below state average</span>
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
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Above state average</span>
                </div>
              </div>
            </div>
            <divider />
            <div style={{
              height: '1px',
              backgroundColor: '#e5e7eb',
              margin: '12px 0'
            }}></div>
            {/* Chart */}
            <Chart
              options={chartOptions}
              series={chartSeries}
              type="bar"
              height={300}
              width="100%"
              backgroundColor="white"
            />
          </div>
        </div>

        {/* Bottom Sections - Critical Issues and Top Performers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginTop: '16px'
        }}>
          {/* Top Critical Issues */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            marginLeft: '16px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 10px 0'
            }}>
              Top Critical Issues
            </h3>
            
            <divider />
            <div style={{
              height: '1px',
              backgroundColor: '#e5e7eb',
              margin: '2px 0'
            }}></div>

            {/* Loading State */}
            {loadingCriticalIssues && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px 20px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Loading critical issues...
              </div>
            )}

            {/* Error State */}
            {criticalIssuesError && !loadingCriticalIssues && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px 20px',
                color: '#ef4444',
                fontSize: '14px',
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                margin: '10px 0'
              }}>
                Error: {criticalIssuesError}
              </div>
            )}

            {/* Data State */}
            {!loadingCriticalIssues && !criticalIssuesError && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {/* Issue 1 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 12px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <span style={{ fontSize: '16px', color: '#374151' }}>No Safety Equipment</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  {getCriticalIssuesCount('no_safety_equipment')}
                </span>
              </div>
              
              {/* Issue 2 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 12px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <span style={{ fontSize: '16px', color: '#6b7280' }}>CSC without water/Elec.</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  {getCriticalIssuesCount('csc_wo_water_or_electricity')}
                </span>
              </div>
              
              {/* Issue 3 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 12px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <span style={{ fontSize: '16px', color: '#374151' }}>Firm Not Paid</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  {getCriticalIssuesCount('firm_not_paid')}
                </span>
              </div>
              
              {/* Issue 4 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 12px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <span style={{ fontSize: '16px', color: '#6b7280' }}>Staff Not Paid</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  {getCriticalIssuesCount('staff_not_paid')}
                </span>
              </div>
              
              {/* Issue 5 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 12px'
              }}>
                <span style={{ fontSize: '16px', color: '#6b7280' }}>Visibly Not Clean</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  {getCriticalIssuesCount('visibly_unclean_village')}
                </span>
              </div>
            </div>
            )}
          </div>

          {/* Top 3 Performers */}
          <div style={{
            backgroundColor: 'white',
            marginRight: '16px',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                Top 3 Performers
              </h3>
              
              {/* Dropdown */}
              <div 
                data-dropdown
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer'
                }}
                onClick={handlePerformersDropdown1Click}>
                <span style={{ fontSize: '14px', color: '#374151' }}>{selectedPerformersFilter1}</span>
                <ChevronDown style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                
                {/* Dropdown Menu */}
                {showPerformersDropdown1 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    marginTop: '4px',
                    minWidth: '120px'
                  }}>
                    {performersFilterOptions1.map((option) => (
                      <div
                        key={option}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePerformersFilter1Select(option);
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#374151',
                          backgroundColor: selectedPerformersFilter1 === option ? '#f3f4f6' : 'transparent',
                          borderBottom: option !== performersFilterOptions1[performersFilterOptions1.length - 1] ? '1px solid #f3f4f6' : 'none'
                        }}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 1fr 100px',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase'
            }}>
              <div>Rank</div>
              <div>Name</div>
              <div>District</div>
              <div>Inspections</div>
            </div>
            
            {/* Loading State */}
            {loadingTopPerformers && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px 20px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Loading top performers...
              </div>
            )}

            {/* Error State */}
            {topPerformersError && !loadingTopPerformers && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px 20px',
                color: '#ef4444',
                fontSize: '14px',
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                margin: '10px 0'
              }}>
                Error: {topPerformersError}
              </div>
            )}

            {/* Data State */}
            {!loadingTopPerformers && !topPerformersError && getTopPerformers().map((performer, index) => {
              const rankImages = [number1, number2, number3];
              const rankImage = rankImages[index] || number3;
              
              return (
                <div key={performer.geo_id || index} style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 1fr 100px',
                  gap: '12px',
                  padding: '12px',
                  alignItems: 'center',
                  borderBottom: index < 2 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'start' }}>
                    <img 
                      src={rankImage} 
                      alt={`Rank ${index + 1}`} 
                      style={{ 
                        width: '52px', 
                        height: '52px',
                        objectFit: 'contain'
                      }} 
                    />
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>{performer.inspector_name || 'N/A'}</div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>{performer.geo_name || 'N/A'}</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{performer.inspections_count || 0}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Sections - Top 3 Performers and Performance Report */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '16px',
          marginTop: '16px',
          marginLeft: '16px',
        }}>
          {/* Top 3 Performers - Updated Version */}
          <div style={{
            backgroundColor: 'white',
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                Top 3 Performers
              </h3>
              
              {/* District Dropdown */}
              <div 
                data-dropdown
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer'
                }}
                onClick={handlePerformersDropdown2Click}>
                <span style={{ fontSize: '14px', color: '#374151' }}>{selectedPerformersFilter2}</span>
                <ChevronDown style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                
                {/* Dropdown Menu */}
                {showPerformersDropdown2 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    marginTop: '4px',
                    minWidth: '120px'
                  }}>
                    {performersFilterOptions2.map((option) => (
                      <div
                        key={option}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePerformersFilter2Select(option);
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#374151',
                          backgroundColor: selectedPerformersFilter2 === option ? '#f3f4f6' : 'transparent',
                          borderBottom: option !== performersFilterOptions2[performersFilterOptions2.length - 1] ? '1px solid #f3f4f6' : 'none'
                        }}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr 100px',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase'
            }}>
              <div>Rank</div>
              <div>District</div>
              <div>Score</div>
            </div>
            
            {/* Loading State */}
            {loadingTopPerformers && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px 20px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Loading top performers...
              </div>
            )}

            {/* Error State */}
            {topPerformersError && !loadingTopPerformers && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px 20px',
                color: '#ef4444',
                fontSize: '14px',
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                margin: '10px 0'
              }}>
                Error: {topPerformersError}
              </div>
            )}

            {/* Data State */}
            {!loadingTopPerformers && !topPerformersError && getTopPerformers().map((performer, index) => {
              const rankImages = [number1, number2, number3];
              const rankImage = rankImages[index] || number3;
              
              return (
                <div key={performer.geo_id || index} style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 100px',
                  gap: '12px',
                  padding: '12px',
                  alignItems: 'center',
                  borderBottom: index < 2 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'start' }}>
                    <img 
                      src={rankImage} 
                      alt={`Rank ${index + 1}`} 
                      style={{ 
                        width: '50px', 
                        height: '50px',
                        objectFit: 'contain'
                      }} 
                    />
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>{performer.geo_name || 'N/A'}</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{performer.inspections_count || 0}</div>
                </div>
              );
            })}
          </div>

          {/* Performance Report */}
          <div style={{
            backgroundColor: 'white',
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            marginRight: '16px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                Performance report
              </h3>
              
              {/* District Dropdown */}
              <div 
                data-dropdown
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer'
                }}
                onClick={handlePerformanceReportDropdownClick}>
                <span style={{ fontSize: '14px', color: '#374151' }}>{selectedPerformanceReportFilter}</span>
                <ChevronDown style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                
                {/* Dropdown Menu */}
                {showPerformanceReportDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    marginTop: '4px',
                    minWidth: '120px'
                  }}>
                    {performersFilterOptions2.map((option) => (
                      <div
                        key={option}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePerformanceReportFilterSelect(option);
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#374151',
                          backgroundColor: selectedPerformanceReportFilter === option ? '#f3f4f6' : 'transparent',
                          borderBottom: option !== performersFilterOptions2[performersFilterOptions2.length - 1] ? '1px solid #f3f4f6' : 'none'
                        }}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Table Header with Sort Icons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 190px 190px 100px',
              gap: '1px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase'
            }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'start', gap: '4px' }}>
                District
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▲</span>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▼</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Score
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▲</span>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▼</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Inspections
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▲</span>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▼</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Coverage
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▲</span>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▼</span>
                </div>
              </div>
            </div>
            
            {/* Performance Data Rows */}
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {/* Row 1 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 190px 190px 100px',
                gap: '1px',
                padding: '12px',
                alignItems: 'center',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <div style={{ fontSize: '14px', color: '#374151' }}>Jodhpur</div>
                <div style={{ fontSize: '14px', fontWeight: '400', color: '#111827' }}>80%</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>350</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>80%</div>
              </div>
              
              {/* Row 2 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 190px 190px 100px',
                gap: '1px',
                padding: '12px',
                alignItems: 'center',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <div style={{ fontSize: '14px', color: '#374151' }}>Jaipur</div>
                <div style={{ fontSize: '14px', fontWeight: '400', color: '#111827' }}>80%</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>325</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>75%</div>
              </div>
              
              {/* Row 3 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 190px 190px 100px',
                gap: '1px',
                padding: '12px',
                alignItems: 'center',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <div style={{ fontSize: '14px', color: '#374151' }}>Udaipur</div>
                <div style={{ fontSize: '14px', fontWeight: '400', color: '#111827' }}>60%</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>280</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>70%</div>
              </div>
              
              {/* Row 4 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 190px 190px 100px',
                gap: '1px',  
                padding: '12px',
                alignItems: 'center',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <div style={{ fontSize: '14px', color: '#374151' }}>Ajmer</div>
                <div style={{ fontSize: '14px', fontWeight: '400', color: '#111827' }}>45%</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>200</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>60%</div>
              </div>
              
              {/* Row 5 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 190px 190px 100px',
                gap: '1px',
                padding: '12px',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#374151' }}>Bikaner</div>
                <div style={{ fontSize: '14px', fontWeight: '400', color: '#111827' }}>70%</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>250</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>65%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Your Inspections Table */}
        <div style={{
          marginTop: '16px',
          marginLeft: '16px',
          marginRight: '16px',
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 20px 0'
            }}>
              Your Inspections
            </h3>
            
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
              gap: '20px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Date
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▲</span>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▼</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Block Name
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▲</span>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▼</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                GP Name
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▲</span>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▼</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Cleaning Score
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▲</span>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▼</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Visibly Clean
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▲</span>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▼</span>
                </div>
              </div>
              <div>Action</div>
            </div>
            
            {/* Loading State */}
            {loadingYourInspections && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px 20px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Loading your inspections...
              </div>
            )}

            {/* Error State */}
            {yourInspectionsError && !loadingYourInspections && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px 20px',
                color: '#ef4444',
                fontSize: '14px',
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                margin: '10px 0'
              }}>
                Error: {yourInspectionsError}
              </div>
            )}

            {/* Data State */}
            {!loadingYourInspections && !yourInspectionsError && (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {getYourInspections().map((inspection, index) => (
                  <div key={inspection.id || index} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
                    gap: '20px',
                    padding: '12px',
                    alignItems: 'center',
                    borderBottom: index < getYourInspections().length - 1 ? '1px solid #f3f4f6' : 'none'
                  }}>
                    <div style={{ fontSize: '14px', color: '#374151' }}>
                      {formatDate(inspection.date)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#374151' }}>
                      {inspection.block_name || 'N/A'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#374151' }}>
                      {inspection.village_name || 'N/A'}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                      {inspection.overall_score || 0}%
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '500',
                      color: inspection.visibly_clean ? '#10b981' : '#ef4444'
                    }}>
                      {inspection.visibly_clean ? 'Yes' : 'No'}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#6b7280', 
                      cursor: 'pointer', 
                      textDecoration: 'underline' 
                    }}>
                      Download report
                    </div>
                  </div>
                ))}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '20px',
                    borderTop: '1px solid #f3f4f6'
                  }}>
                    <button
                      onClick={() => fetchYourInspectionsData(currentPage - 1)}
                      disabled={currentPage <= 1}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: currentPage <= 1 ? '#f9fafb' : 'white',
                        color: currentPage <= 1 ? '#9ca3af' : '#374151',
                        cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Previous
                    </button>
                    
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => fetchYourInspectionsData(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: currentPage >= totalPages ? '#f9fafb' : 'white',
                        color: currentPage >= totalPages ? '#9ca3af' : '#374151',
                        cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default InspectionContent;