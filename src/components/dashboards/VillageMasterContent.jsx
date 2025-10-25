import React, { useState } from "react";
import { MapPin, ChevronDown, Calendar, List, Info, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Users, UserCheck, UserX, DollarSign, Target, TrendingUp, Database, BarChart3, ArrowUpDown } from 'lucide-react';
import Chart from 'react-apexcharts';

const VillageMasterContent = () => {
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeScope, setActiveScope] = useState('State');
    const [activePerformance, setActivePerformance] = useState('Time');
  
    const scopeButtons = ['State', 'Districts', 'Blocks', 'GPs'];
    const performanceButtons = ['Time', 'Location'];

    // Chart data for SBMG Target vs Achievement
    const chartOptions = {
      chart: {
        type: 'bar',
        toolbar: { show: false },
        background: 'transparent'
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%',
          borderRadius: 0
        }
      },
      dataLabels: { enabled: false },
      stroke: { show: false },
      xaxis: {
        categories: ['IHHL', 'CSC', 'RRC', 'PWMU', 'Soak pit', 'Magic pit', 'Leach pit', 'WSP', 'DEWATS'],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#6b7280', fontSize: '12px' } }
      },
      yaxis: {
        min: 0,
        max: 100,
        tickAmount: 5,
        labels: { style: { colors: '#6b7280', fontSize: '12px' } },
        axisBorder: { show: false }
      },
      grid: {
        borderColor: '#e5e7eb',
        strokeDashArray: 3,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } }
      },
      colors: ['#9ca3af', '#10b981'],
      legend: {
        show: false
      }
    };

    const chartSeries = [
      {
        name: 'Target',
        data: [8, 8, 8, 53, 53, 53, 53, 53, 53]
      },
      {
        name: 'Achievement',
        data: [23, 12, 12, 64, 42, 42, 42, 42, 42]
      }
    ];

    // Line chart data for Statewide Score trend
    const lineChartOptions = {
      chart: {
        type: 'line',
        toolbar: { show: false },
        background: 'transparent'
      },
      stroke: {
        curve: 'smooth',
        width: 3,
        colors: ['#10b981']
      },
      markers: {
        size: 0,
        hover: { size: 6 }
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#6b7280', fontSize: '12px' } }
      },
      yaxis: {
        min: 0,
        max: 100,
        tickAmount: 5,
        labels: { style: { colors: '#6b7280', fontSize: '12px' } },
        axisBorder: { show: false }
      },
      grid: {
        borderColor: '#e5e7eb',
        strokeDashArray: 3,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } }
      },
      colors: ['#10b981'],
      dataLabels: { enabled: false },
      annotations: {
        points: [{
          x: 'Jun',
          y: 42,
          marker: {
            size: 0
          },
          label: {
            text: '40%',
            style: {
              background: '#000000',
              color: '#ffffff',
              fontSize: '12px',
              padding: {
                left: 8,
                right: 8,
                top: 4,
                bottom: 4
              }
            },
            offsetY: -20
          }
        }]
      }
    };

    const lineChartSeries = [{
      name: 'Score',
      data: [18, 30, 28, 18, 35, 42, 35, 28, 35, 30, 40, 52]
    }];

    console.log('VillageMasterContent rendering...');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
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
            Village Master
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
           
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            cursor: 'pointer'
          }}>
            <Calendar style={{ width: '16px', height: '16px', color: '#6b7280' }} />
            <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>2024</span>
            <ChevronDown style={{ width: '14px', height: '14px', color: '#6b7280' }} />
          </div>
        </div>

        {/* Metrics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '16px'
        }}>
          {/* Total Village Master Data */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                margin: 0
              }}>
                Total Village Master Data
              </h3>
              <Database style={{ width: '20px', height: '20px', color: '#6b7280' }} />
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#111827',
              margin: 0
            }}>
              2,400
            </div>
          </div>

          {/* Village Master Data Coverage */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                margin: 0
              }}>
                Village Master Data Coverage
              </h3>
              <TrendingUp style={{ width: '20px', height: '20px', color: '#6b7280' }} />
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#111827',
              margin: 0
            }}>
              68%
            </div>
          </div>

          {/* Total funds sanctioned */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                margin: 0
              }}>
                Total funds sanctioned
              </h3>
              <DollarSign style={{ width: '20px', height: '20px', color: '#6b7280' }} />
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#111827',
              margin: 0
            }}>
              18 Cr
            </div>
          </div>

          {/* Total work order Amount */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                margin: 0
              }}>
                Total work order Amount
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Info style={{ width: '16px', height: '16px', color: '#6b7280', cursor: 'pointer' }} />
                <DollarSign style={{ width: '20px', height: '20px', color: '#6b7280' }} />
              </div>
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#111827',
              margin: 0
            }}>
              13 Cr
            </div>
          </div>

          {/* SBMG Target Achievement Rate */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                margin: 0
              }}>
                SBMG Target Achievement Rate
              </h3>
              <Info style={{ width: '16px', height: '16px', color: '#6b7280', cursor: 'pointer' }} />
              </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#111827',
              margin: 0
            }}>
              56%
            </div>
          </div>
        </div>

        {/* SBMG Target vs Achievement and Annual Overview Section */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginTop: '16px'
        }}>
          {/* SBMG Target vs Achievement Chart */}
          <div style={{
            flex: 2,
            backgroundColor: 'white',
            padding: '14px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                SBMG Target vs. Achievement
              </h3>
              {/* Legend */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#9ca3af',
                    borderRadius: '2px'
                  }}></div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Target</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#10b981',
                    borderRadius: '2px'
                  }}></div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Achievement</span>
                </div>
              </div>
            </div>
            <divider />
            <div style={{
              height: '1px',
              backgroundColor: '#e5e7eb',
              margin: '12px 0'
            }}></div>
            <div style={{ height: '400px' }}>
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="bar"
                height="100%"
              />
            </div>
          </div>
          <divider />
         
          {/* Annual Overview */}
          <div style={{
            flex: 1,
            backgroundColor: 'white',
            padding: '14px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: 0,
              marginBottom: '2px'
            }}>
              Annual Overview
            </h3>
            <divider />
            <div style={{
              height: '1px',
              backgroundColor: '#e5e7eb',
              margin: '12px 0'
            }}></div>
            <divider />
            
            {/* Metrics List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Fund Utilization rate */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '16px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <span style={{ fontSize: '16px', color: '#6b7280' }}>Fund Utilization rate</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>95.5%</span>
              </div>

              {/* Average Cost Per Household */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '16px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <span style={{ fontSize: '16px', color: '#6b7280' }}>Average Cost Per Household(D2D)</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>₹98</span>
              </div>

              {/* Household covered */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '16px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <span style={{ fontSize: '16px', color: '#6b7280' }}>Household covered (D2D)</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>1.2 M</span>
              </div>

              {/* GPs with Identified Asset Gaps */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '16px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <span style={{ fontSize: '16px', color: '#6b7280' }}>GPs with Identified Asset Gaps</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>35</span>
              </div>

              {/* Active Sanitation Bidders */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '16px', color: '#6b7280' }}>Active Sanitation Bidders</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>12</span>
              </div>
            </div>
          </div>
        </div>

       
      </div>

  {/* Statewide Score Trend Section */}
  <div style={{
          display: 'flex',
          gap: '14px',
          marginLeft: '16px',
          marginRight: '16px',
          marginTop: '16px'
        }}>
          {/* First Chart */}
          <div style={{
            flex: 1,
            backgroundColor: 'white',
            padding: '14px',
            borderRadius: '8px',
            border: '1px solid lightgray'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: 0,
              marginBottom: '12px'
            }}>
              Statewide Score trend
            </h3>
            <divider />
            <div style={{
              height: '1px',
              backgroundColor: '#e5e7eb',
              margin: '2px 0'
            }}></div>
            <divider />
            <div style={{ height: '300px' }}>
              <Chart
                options={lineChartOptions}
                series={lineChartSeries}
                type="line"
                height="100%"
              />
            </div>
          </div>

          {/* Second Chart */}
          <div style={{
            flex: 1,
            backgroundColor: 'white',
            padding: '14px',
            borderRadius: '8px',
            border: '1px solid lightgray'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: 0,
              marginBottom: '12px'
            }}>
              Statewide Score trend
            </h3>
            <divider />
            <div style={{
              height: '1px',
              backgroundColor: '#e5e7eb',
              margin: '12px 0'
            }}></div>
            <divider />
            <div style={{ height: '300px' }}>
              <Chart
                options={lineChartOptions}
                series={lineChartSeries}
                type="line"
                height="100%"
              />
            </div>
          </div>
        </div>

        {/* Financial Efficiency Table Section */}
        <div style={{
          backgroundColor: 'white',
          padding: '14px',
          marginLeft: '16px',
          marginRight: '16px',
          marginTop: '16px',
          borderRadius: '8px',
          border: '1px solid lightgray'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            margin: 0,
            marginBottom: '12px'
          }}>
            Financial Efficiency (Cost vs. Service)
          </h3>

          {/* Table */}
          <div style={{
            overflow: 'hidden',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              backgroundColor: '#f9fafb',
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                District
                <ArrowUpDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Avg. Cost / Household (₹)
                <ArrowUpDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Avg. Cost / km Drain (₹)
                <ArrowUpDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Total Funds Utilized (Cr)
                <ArrowUpDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
              </div>
            </div>

            {/* Table Rows */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: 'white'
            }}>
              <div style={{ fontSize: '14px', color: '#111827' }}>Jodhpur</div>
              <div style={{ fontSize: '14px', color: '#111827' }}>₹ 2,150</div>
              <div style={{ fontSize: '14px', color: '#111827' }}>₹ 78,000</div>
              <div style={{ fontSize: '14px', color: '#111827' }}>₹ 2.5 Cr</div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: 'white'
            }}>
              <div style={{ fontSize: '14px', color: '#111827' }}>Jaipur</div>
              <div style={{ fontSize: '14px', color: '#111827' }}>₹ 2,450</div>
              <div style={{ fontSize: '14px', color: '#111827' }}>₹ 85,000</div>
              <div style={{ fontSize: '14px', color: '#111827' }}>₹ 2.5 Cr</div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: 'white'
            }}>
              <div style={{ fontSize: '14px', color: '#111827' }}>Udaipur</div>
              <div style={{ fontSize: '14px', color: '#111827' }}>₹ 2,650</div>
              <div style={{ fontSize: '14px', color: '#111827' }}>₹ 88,000</div>
              <div style={{ fontSize: '14px', color: '#111827' }}>₹ 2.5 Cr</div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: 'white'
            }}>
              <div style={{ fontSize: '14px', color: '#111827' }}>Bikaner</div>
              <div style={{ fontSize: '14px', color: '#111827' }}>₹ 2,890</div>
              <div style={{ fontSize: '14px', color: '#111827' }}>₹ 92,000</div>
              <div style={{ fontSize: '14px', color: '#111827' }}>₹ 2.5 Cr</div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              padding: '12px 16px',
              backgroundColor: 'white'
            }}>
              <div style={{ fontSize: '14px', color: '#111827' }}>Ajmer</div>
              <div style={{ fontSize: '14px', color: '#111827' }}>₹ 2,890</div>
              <div style={{ fontSize: '14px', color: '#111827' }}>₹ 98,000</div>
              <div style={{ fontSize: '14px', color: '#111827' }}>₹ 2.5 Cr</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

export default VillageMasterContent;