import React, { useState } from 'react';
import { MapPin, ChevronDown, Calendar, List, Info, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Users, UserCheck, UserX } from 'lucide-react';
import Chart from 'react-apexcharts';

const SegmentedGauge = ({ percentage, label = "Present" }) => {
  // Calculate which segments should be filled based on percentage
  const getSegmentColor = (segmentIndex) => {
    const segmentThreshold = (segmentIndex + 1) * 50; // Each segment represents 50%
    
    if (percentage >= segmentThreshold) {
      // Fully filled
      if (segmentIndex === 0) return '#10b981'; // Green
      if (segmentIndex === 1) return '#ef4444'; // Red
    } else if (percentage > (segmentIndex * 50)) {
      // Partially filled - show appropriate color
      if (segmentIndex === 0) return '#10b981';
      if (segmentIndex === 1) return '#ef4444';
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
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeScope, setActiveScope] = useState('State');
    const [activePerformance, setActivePerformance] = useState('Time');
  
    const scopeButtons = ['State', 'Districts', 'Blocks', 'GPs'];
    const performanceButtons = ['Time', 'Location'];
  
    const filterButtons = ['All', 'Present', 'Absent', 'Leave', 'Holiday'];

    const attendanceMetrics = [
      {
        title: 'Total Vendor/Supervisor',
        value: '452',
        icon: List,
        color: '#3b82f6'
      },
      {
        title: 'Vendor/Supervisor Present',
        value: '400',
        icon: UserCheck,
        color: '#10b981'
      },
      {
        title: 'Vendor/Supervisor Absent',
        value: '52',
        icon: UserX,
        color: '#ef4444'
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
            fontSize: '14px',
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
                color: '#111827',
                marginTop: '0px',
                marginLeft: '20px'
              }}>
                {attendanceMetrics[0].value}
              </div>
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
                    color: '#111827',
                    marginLeft: '20px'
                  }}>
                    {item.value}
                  </div>
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
                12, January 2025
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
              <SegmentedGauge percentage={82} label="Present" />
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