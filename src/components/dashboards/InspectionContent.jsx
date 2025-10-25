import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, ChevronDown, Calendar, List, Info, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Users, UserCheck, UserX } from 'lucide-react';
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
      const response = await apiClient.get('/geography/grampanchayats?skip=0&limit=100');
      console.log('GPs API Response:', response.data);
      setGramPanchayats(response.data);
    } catch (error) {
      console.error('Error fetching gram panchayats:', error);
    } finally {
      setLoadingGPs(false);
    }
  };

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
    if (activeScope === 'Districts') {
      fetchDistricts();
    } else if (activeScope === 'Blocks') {
      fetchDistricts();
      fetchBlocks();
    } else if (activeScope === 'GPs') {
      fetchDistricts();
      fetchBlocks();
      fetchGramPanchayats();
    }
  }, [activeScope]);

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

  const handleHierarchicalSelection = (location) => {
    if (activeScope === 'Blocks') {
      if (dropdownLevel === 'districts') {
        setSelectedDistrictForHierarchy(location);
        setDropdownLevel('blocks');
        setSelectedLocation('Select Block');
        fetchBlocks();
      } else if (dropdownLevel === 'blocks') {
        setSelectedDistrictId(selectedDistrictForHierarchy.id);
        setSelectedBlockId(location.id);
        setSelectedLocation(location.name);
        setShowLocationDropdown(false);
      }
    } else if (activeScope === 'GPs') {
      if (dropdownLevel === 'districts') {
        setSelectedDistrictForHierarchy(location);
        setDropdownLevel('blocks');
        setSelectedLocation('Select Block');
        fetchBlocks();
      } else if (dropdownLevel === 'blocks') {
        setSelectedBlockForHierarchy(location);
        setDropdownLevel('gps');
        setSelectedLocation('Select GP');
        fetchGramPanchayats();
      } else if (dropdownLevel === 'gps') {
        setSelectedDistrictId(selectedDistrictForHierarchy.id);
        setSelectedBlockId(selectedBlockForHierarchy.id);
        setSelectedGPId(location.id);
        setSelectedLocation(location.name);
        setShowLocationDropdown(false);
      }
    }
  };

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
                {/* Breadcrumb/Back button */}
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
                      setDropdownLevel('districts');
                      setSelectedDistrictForHierarchy(null);
                      setSelectedLocation('Select District');
                    } else if (activeScope === 'GPs' && dropdownLevel === 'blocks') {
                      setDropdownLevel('districts');
                      setSelectedDistrictForHierarchy(null);
                      setSelectedLocation('Select District');
                    } else if (activeScope === 'GPs' && dropdownLevel === 'gps') {
                      setDropdownLevel('blocks');
                      setSelectedBlockForHierarchy(null);
                      setSelectedLocation('Select Block');
                    }
                  }}>
                    <span>←</span>
                    <span>Back to {dropdownLevel === 'gps' ? 'Blocks' : 'Districts'}</span>
                  </div>
                )}
                
                {/* Loading state */}
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
                          setSelectedDistrictId(location.id);
                          setSelectedLocation(location.name);
                          setShowLocationDropdown(false);
                        } else {
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
                76%
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
                3,452
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
                400/3000
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
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>2,150</span>
              </div>
              
              {/* Issue 2 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 12px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <span style={{ fontSize: '16px', color: '6b7280' }}>CSC without water/Elec.</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>1,830</span>
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
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>1,204</span>
              </div>
              
              {/* Issue 4 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 12px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <span style={{ fontSize: '16px', color: '6b7280' }}>Staff Not Paid</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>980</span>
              </div>
              
              {/* Issue 5 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 12px'
              }}>
                <span style={{ fontSize: '16px', color: '6b7280' }}>Visibly Not Clean</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>850</span>
              </div>
            </div>
          </div>

          {/* Top 3 Performers */}
          <div style={{
            backgroundColor: 'white',
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
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                cursor: 'pointer'
              }}>
                <span style={{ fontSize: '14px', color: '#374151' }}>CEO</span>
                <ChevronDown style={{ width: '16px', height: '16px', color: '#6b7280' }} />
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
            
            {/* Performer 1 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 1fr 100px',
              gap: '12px',
              padding: '12px',
              alignItems: 'center',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'start' }}>
                <img 
                  src={number1} 
                  alt="Rank 1" 
                  style={{ 
                    width: '52px', 
                    height: '52px',
                    objectFit: 'contain'
                  }} 
                />
              </div>
              <div style={{ fontSize: '14px', color: '#374151' }}>Er. Rohan</div>
              <div style={{ fontSize: '14px', color: '#374151' }}>Jodhpur</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>123</div>
            </div>
            
            {/* Performer 2 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 1fr 100px',
              gap: '12px',
              padding: '12px',
              alignItems: 'center',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'start' }}>
                <img 
                  src={number2} 
                  alt="Rank 2" 
                  style={{ 
                    width: '52px', 
                    height: '52px',
                    objectFit: 'contain'
                  }} 
                />
              </div>
              <div style={{ fontSize: '14px', color: '#374151' }}>Er. Mohan</div>
              <div style={{ fontSize: '14px', color: '#374151' }}>Jaipur</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>122</div>
            </div>
            
            {/* Performer 3 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 1fr 100px',
              gap: '12px',
              padding: '12px',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'start' }}>
                <img 
                  src={number3} 
                  alt="Rank 3" 
                  style={{ 
                    width: '52px', 
                    height: '52px',
                    objectFit: 'contain'
                  }} 
                />
              </div>
              <div style={{ fontSize: '14px', color: '#374151' }}>Er. Sohan</div>
              <div style={{ fontSize: '14px', color: '#374151' }}>Udaipur</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>121</div>
            </div>
          </div>
        </div>

        {/* Additional Sections - Top 3 Performers and Performance Report */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '16px',
          marginTop: '16px'
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
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                cursor: 'pointer'
              }}>
                <span style={{ fontSize: '14px', color: '#374151' }}>District</span>
                <ChevronDown style={{ width: '16px', height: '16px', color: '#6b7280' }} />
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
            
            {/* Performer 1 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr 100px',
              gap: '12px',
              padding: '12px',
              alignItems: 'center',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'start' }}>
                <img 
                  src={number1} 
                  alt="Rank 1" 
                  style={{ 
                    width: '50px', 
                    height: '50px',
                    objectFit: 'contain'
                  }} 
                />
              </div>
              <div style={{ fontSize: '14px', color: '#374151' }}>Jodhpur</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>80%</div>
            </div>
            
            {/* Performer 2 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr 100px',
              gap: '12px',
              padding: '12px',
              alignItems: 'center',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'start' }}>
                <img 
                  src={number2} 
                  alt="Rank 2" 
                  style={{ 
                    width: '50px', 
                    height: '50px',
                    objectFit: 'contain'
                  }} 
                />
              </div>
              <div style={{ fontSize: '14px', color: '#374151' }}>Jaipur</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>75%</div>
            </div>
            
            {/* Performer 3 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr 100px',
              gap: '12px',
              padding: '12px',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'start' }}>
                <img 
                  src={number3} 
                  alt="Rank 3" 
                  style={{ 
                    width: '50px', 
                    height: '50px',
                    objectFit: 'contain'
                  }} 
                />
              </div>
              <div style={{ fontSize: '14px', color: '#374151' }}>Udaipur</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>60%</div>
            </div>
          </div>

          {/* Performance Report */}
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
                Performance report
              </h3>
              
              {/* District Dropdown */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                cursor: 'pointer'
              }}>
                <span style={{ fontSize: '14px', color: '#374151' }}>District</span>
                <ChevronDown style={{ width: '16px', height: '16px', color: '#6b7280' }} />
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
          marginTop: '16px'
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
                Village Name
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
            
            {/* Table Data Rows */}
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {/* Row 1 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
                gap: '20px',
                padding: '12px',
                alignItems: 'center',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <div style={{ fontSize: '14px', color: '#374151' }}>12/02/2025</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>Village name</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>GP name</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>76%</div>
                <div style={{ fontSize: '14px', color: '#10b981', fontWeight: '500' }}>Yes</div>
                <div style={{ fontSize: '14px', color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}>Download report</div>
              </div>
              
              {/* Row 2 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
                gap: '20px',
                padding: '12px',
                alignItems: 'center',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <div style={{ fontSize: '14px', color: '#374151' }}>12/02/2025</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>Village name</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>GP name</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>76%</div>
                <div style={{ fontSize: '14px', color: '#10b981', fontWeight: '500' }}>Yes</div>
                <div style={{ fontSize: '14px', color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}>Download report</div>
              </div>
              
              {/* Row 3 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
                gap: '20px',
                padding: '12px',
                alignItems: 'center',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <div style={{ fontSize: '14px', color: '#374151' }}>12/02/2025</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>Village name</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>GP name</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>76%</div>
                <div style={{ fontSize: '14px', color: '#ef4444', fontWeight: '500' }}>No</div>
                <div style={{ fontSize: '14px', color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}>Download report</div>
              </div>
              
              {/* Row 4 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
                gap: '20px',
                padding: '12px',
                alignItems: 'center',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <div style={{ fontSize: '14px', color: '#374151' }}>12/02/2025</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>Village name</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>GP name</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>76%</div>
                <div style={{ fontSize: '14px', color: '#10b981', fontWeight: '500' }}>Yes</div>
                <div style={{ fontSize: '14px', color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}>Download report</div>
              </div>
              
              {/* Row 5 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
                gap: '20px',
                padding: '12px',
                alignItems: 'center',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <div style={{ fontSize: '14px', color: '#374151' }}>12/02/2025</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>Village name</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>GP name</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>76%</div>
                <div style={{ fontSize: '14px', color: '#10b981', fontWeight: '500' }}>Yes</div>
                <div style={{ fontSize: '14px', color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}>Download report</div>
              </div>
              
              {/* Row 6 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
                gap: '20px',
                padding: '12px',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#374151' }}>12/02/2025</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>Village name</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>GP name</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>76%</div>
                <div style={{ fontSize: '14px', color: '#10b981', fontWeight: '500' }}>Yes</div>
                <div style={{ fontSize: '14px', color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}>Download report</div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default InspectionContent;