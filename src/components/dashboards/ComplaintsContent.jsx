import React, { useState } from 'react';
import { MapPin, ChevronDown, Calendar, List, Info, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import Chart from 'react-apexcharts';

const ComplaintsContent = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeScope, setActiveScope] = useState('State');

  const scopeButtons = ['State', 'Districts', 'Blocks', 'GPs'];

  const filterButtons = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];

  const complaintMetrics = [
    {
      title: 'Total Complaints',
      value: '3,452',
      icon: List,
      color: '#3b82f6',
      chartData: {
        series: [{
          data: [2800, 3000, 3200, 3452]
        }],
        options: {
          chart: {
            type: 'area',
            height: 60,
            sparkline: { enabled: false },
            toolbar: { show: false },
            zoom: { enabled: false }
          },
          stroke: { curve: 'smooth', width: 2, colors: ['#3b82f6'] },
          fill: {
            type: 'solid',
            opacity: 0.10,
            colors: ['#3b82f6']
          },
          tooltip: { enabled: false },
          grid: { 
            show: false,
            padding: {
              top: -10,
              right: 0,
              bottom: -10,
              left: 0
            }
          },
          xaxis: { 
            labels: { show: false },
            axisBorder: { show: false },
            axisTicks: { show: false },
            crosshairs: { show: false }
          },
          yaxis: { 
            show: false,
            labels: { show: false },
            min: 2600,
            max: 3600,
            forceNiceScale: false,
            floating: false
          },
          dataLabels: { enabled: false },
          markers: { size: 0 },
          legend: { show: false }
        }
      }
    },
    {
      title: 'Open Complaints',
      value: '452',
      icon: List,
      color: '#ef4444',
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
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.3,
              opacityTo: 0.05,
              stops: [0, 100]
            }
          },
          tooltip: { enabled: false },
          grid: { show: false },
          xaxis: { labels: { show: false } },
          yaxis: { 
            labels: { show: false },
            min: 0,
            max: 480
          },
          dataLabels: { enabled: false }
        }
      }
    },
    {
      title: 'Verified',
      value: '3,000',
      icon: List,
      color: '#f97316',
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
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.3,
              opacityTo: 0.05,
              stops: [0, 100]
            }
          },
          tooltip: { enabled: false },
          grid: { show: false },
          xaxis: { labels: { show: false } },
          yaxis: { 
            labels: { show: false },
            min: 0,
            max: 3200
          },
          dataLabels: { enabled: false }
        }
      }
    },
    {
      title: 'Disposed',
      value: '2,000',
      icon: List,
      color: '#10b981',
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
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.3,
              opacityTo: 0.05,
              stops: [0, 100]
            }
          },
          tooltip: { enabled: false },
          grid: { show: false },
          xaxis: { labels: { show: false } },
          yaxis: { 
            labels: { show: false },
            min: 0,
            max: 2100
          },
          dataLabels: { enabled: false }
        }
      }
    }
  ];

  const complaintsData = [
    {
      id: 'COMP-001',
      title: 'Water Supply Issue',
      description: 'No water supply in Ward 5 for the past 3 days',
      status: 'Open',
      priority: 'High',
      location: 'Ward 5, Block A',
      submittedBy: 'Rajesh Kumar',
      submittedDate: '2025-01-15',
      assignedTo: 'Sanitation Team',
      statusColor: '#ef4444'
    },
    {
      id: 'COMP-002',
      title: 'Garbage Collection Delay',
      description: 'Garbage not collected for 2 days in residential area',
      status: 'In Progress',
      priority: 'Medium',
      location: 'Ward 3, Block B',
      submittedBy: 'Priya Sharma',
      submittedDate: '2025-01-14',
      assignedTo: 'Waste Management',
      statusColor: '#f59e0b'
    },
    {
      id: 'COMP-003',
      title: 'Street Light Repair',
      description: 'Street light not working near school gate',
      status: 'Resolved',
      priority: 'Low',
      location: 'Ward 2, Block C',
      submittedBy: 'Amit Singh',
      submittedDate: '2025-01-13',
      assignedTo: 'Electrical Team',
      statusColor: '#10b981'
    },
    {
      id: 'COMP-004',
      title: 'Drainage Problem',
      description: 'Water logging due to blocked drainage',
      status: 'Closed',
      priority: 'High',
      location: 'Ward 1, Block D',
      submittedBy: 'Sunita Devi',
      submittedDate: '2025-01-12',
      assignedTo: 'Drainage Team',
      statusColor: '#6b7280'
    },
    {
      id: 'COMP-005',
      title: 'Road Repair Required',
      description: 'Potholes on main road causing traffic issues',
      status: 'Open',
      priority: 'Medium',
      location: 'Ward 4, Block E',
      submittedBy: 'Vikram Patel',
      submittedDate: '2025-01-11',
      assignedTo: 'Road Maintenance',
      statusColor: '#ef4444'
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Open':
        return <XCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />;
      case 'In Progress':
        return <Clock style={{ width: '16px', height: '16px', color: '#f59e0b' }} />;
      case 'Resolved':
        return <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />;
      case 'Closed':
        return <CheckCircle style={{ width: '16px', height: '16px', color: '#6b7280' }} />;
      default:
        return <Clock style={{ width: '16px', height: '16px', color: '#6b7280' }} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return '#ef4444';
      case 'Medium':
        return '#f59e0b';
      case 'Low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const filteredComplaints = complaintsData.filter(complaint => {
    const matchesFilter = activeFilter === 'All' || complaint.status === activeFilter;
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
            Complaints
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
            <button style={{
              width: '100%',
              padding: '5px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '10px',
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
                <span>Select option</span>
              </div>
              <ChevronDown style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
            </button>
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
          Rajasthan / All
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
              • January 2025
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            <Calendar style={{ width: '16px', height: '16px' }} />
            <span>Today</span>
            <ChevronDown style={{ width: '16px', height: '16px' }} />
          </div>
        </div>

        {/* Metrics Cards */}
        <div style={{
          display: 'flex',
          gap: '24px'
        }}>
          {/* Total Complaints - Large Card */}
          <div style={{
            width: '70%',
            backgroundColor: 'white',
            padding: '20px',
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
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: complaintMetrics[0].color
              }}></div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  {complaintMetrics[0].title}
                </span>
              </div>
            </div>

            {/* Value */}
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '16px'
            }}>
              {complaintMetrics[0].value}
            </div>

            {/* Chart */}
            <div style={{ height: '60%' }}>
              <Chart
                options={complaintMetrics[0].chartData.options}
                series={complaintMetrics[0].chartData.series}
                type="area"
                height="100%"
              />
            </div>
          </div>

          {/* Right Side - Cards Layout */}
          <div style={{
            width: '28%',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Open Complaints - Full Width */}
            <div style={{
                
              backgroundColor: 'white',
              padding: '16px',
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
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: complaintMetrics[1].color
                }}></div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    {complaintMetrics[1].title}
                  </span>
                </div>
              </div>

              {/* Value */}
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '12px'
              }}>
                {complaintMetrics[1].value}
              </div>

              {/* Mini chart */}
              <div style={{ height: '40px' }}>
                <Chart
                  options={complaintMetrics[1].chartData.options}
                  series={complaintMetrics[1].chartData.series}
                  type="area"
                  height={40}
                />
              </div>
            </div>

            {/* Verified and Disposed - In Same Row */}
            <div style={{
              display: 'flex',
              gap: '12px',
              width: '98%'
            }}>
              {complaintMetrics.slice(2).map((item, index) => (
                <div key={index} style={{
                  backgroundColor: 'white',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  position: 'relative',
                  width: '50%'
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
        </div>
      </div>

      {/* Complaints Table Section */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        marginLeft: '16px',
        marginRight: '16px',
        marginTop: '16px',
        borderRadius: '8px',
        border: '1px solid lightgray'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              Complaints
            </h2>
            <span style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              12, January 2025
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Status Filter */}
            <div style={{
              position: 'relative',
              minWidth: '120px'
            }}>
              <button style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151'
              }}>
                <span>Open</span>
                <ChevronDown style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
              </button>
            </div>

            {/* Search Bar */}
            <div style={{
              position: 'relative',
              width: '200px'
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
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Export Button */}
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Download style={{ width: '16px', height: '16px' }} />
              Export data
            </button>
          </div>
        </div>

        {/* Complaints Table */}
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
                  User
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
                  Address(GP)
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
                  Type of complaint
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
                  Date of complaint
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
                  Status
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
                    <div>
                      <div style={{
                        fontWeight: '500',
                        marginBottom: '2px'
                      }}>
                        Name
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        Contact
                      </div>
                    </div>
                  </td>
                  <td style={{
                    padding: '12px',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Gram panchayat
                  </td>
                  <td style={{
                    padding: '12px',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Door to door collection issue
                  </td>
                  <td style={{
                    padding: '12px',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    12 July 2025
                  </td>
                  <td style={{
                    padding: '12px',
                    fontSize: '14px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '90%'
                    }}>
                      <div style={{
                        display: 'inline-block',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        Open
                      </div>
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
                    </div>
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

export default ComplaintsContent;