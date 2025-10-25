import React, { useState, useEffect } from "react";
import { Plus, Calendar, ChevronDown, X, Upload, Search, Download, Info, List } from 'lucide-react';
import apiClient from '../../services/api';

const NotoficationContent = () => {
  const [sentNotices, setSentNotices] = useState([]);
  const [receivedNotices, setReceivedNotices] = useState([]);
  const [loadingSent, setLoadingSent] = useState(true);
  const [loadingReceived, setLoadingReceived] = useState(true);
  const [errorSent, setErrorSent] = useState(null);
  const [errorReceived, setErrorReceived] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Fetch sent notices
  useEffect(() => {
    const fetchSentNotices = async () => {
      try {
        setLoadingSent(true);
        const response = await apiClient.get('/notices/sent?skip=0&limit=50');
        console.log('✅ Sent Notices API Response:', response.data);
        setSentNotices(response.data || []);
        setErrorSent(null);
      } catch (error) {
        console.error('❌ Error fetching sent notices:', error);
        setErrorSent(error.message || 'Failed to fetch sent notices');
        setSentNotices([]);
      } finally {
        setLoadingSent(false);
      }
    };

    fetchSentNotices();
  }, []);

  // Fetch received notices
  useEffect(() => {
    const fetchReceivedNotices = async () => {
      try {
        setLoadingReceived(true);
        const response = await apiClient.get('/notices/received?skip=0&limit=50');
        console.log('✅ Received Notices API Response:', response.data);
        setReceivedNotices(response.data || []);
        setErrorReceived(null);
      } catch (error) {
        console.error('❌ Error fetching received notices:', error);
        setErrorReceived(error.message || 'Failed to fetch received notices');
        setReceivedNotices([]);
      } finally {
        setLoadingReceived(false);
      }
    };

    fetchReceivedNotices();
  }, []);

  // Filter notices based on search term
  const filteredNotices = receivedNotices.filter(notice => 
    notice.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notice.sender_info?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notice.text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (error) {
      return 'N/A';
    }
  };

  // Get sender name
  const getSenderName = (senderInfo) => {
    if (!senderInfo) return 'Unknown';
    const parts = [
      senderInfo.first_name,
      senderInfo.middle_name,
      senderInfo.last_name
    ].filter(Boolean);
    return parts.join(' ') || 'Unknown';
  };

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
                        Notices
                    </h1>
                </div>
            </div>

            {/* Summary Cards Section */}
            <div style={{
                display: 'flex',
                gap: '20px',
                marginLeft: '16px',
                marginRight: '16px',
                marginTop: '16px'
            }}>
                {/* Notices Sent Card */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    flex: 1,
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px'
                    }}>
                        <Info style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                    </div>
                    <h3 style={{
                                fontSize: '14px',
                                fontWeight: '500',
                        color: '#374151',
                        margin: '0 0 8px 0'
                    }}>
                        Notices sent
                                </h3>
                    <div style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: '#111827',
                        lineHeight: '1'
                    }}>
                        {loadingSent ? '...' : errorSent ? '0' : sentNotices.length}
                        </div>
                    </div>

                {/* Notices Received Card */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                    padding: '24px',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    flex: 1,
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px'
                    }}>
                        <Info style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                    </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                        gap: '8px',
                                marginBottom: '8px'
                            }}>
                        <List style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                                <h3 style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            margin: 0
                        }}>
                            Notices Recieved
                                </h3>
                    </div>
                    <div style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: '#111827',
                        lineHeight: '1'
                    }}>
                        {loadingReceived ? '...' : errorReceived ? '0' : receivedNotices.length}
                    </div>
                </div>
            </div>

            {/* Notices Table Section */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                marginLeft: '16px',
                marginRight: '16px',
                marginTop: '20px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
            }}>
                {/* Table Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div>
                            <h2 style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#111827',
                            margin: '0 0 4px 0'
                            }}>
                            Notices
                            </h2>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    margin: 0
                                }}>
                            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        {/* Search Bar */}
                        <div style={{ position: 'relative' }}>
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
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                    padding: '8px 12px 8px 40px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                    width: '200px',
                                            outline: 'none'
                                        }}
                                    />
                                </div>

                        {/* Export Button */}
                        <button style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                                            borderRadius: '8px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                                            fontSize: '14px',
                            fontWeight: '500'
                        }}>
                            <Download style={{ width: '16px', height: '16px' }} />
                            Export data
                        </button>

                        {/* Year Filter */}
                                        <div style={{ position: 'relative' }}>
                            <select 
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                style={{
                                padding: '8px 40px 8px 12px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                outline: 'none',
                                appearance: 'none'
                            }}>
                                <option value="2024">2024</option>
                                <option value="2025">2025</option>
                            </select>
                                            <Calendar style={{
                                                position: 'absolute',
                                                right: '12px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                width: '16px',
                                                height: '16px',
                                                color: '#6b7280',
                                                pointerEvents: 'none'
                                            }} />
                                        </div>
                                    </div>
                                </div>

                {/* Table */}
                <div style={{ overflow: 'auto' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse'
                    }}>
                        <thead>
                            <tr style={{
                                backgroundColor: '#f9fafb',
                                borderBottom: '1px solid #e5e7eb'
                            }}>
                                <th style={{
                                    padding: '12px 24px',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Date
                                        <ChevronDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                                    </div>
                                </th>
                                <th style={{
                                    padding: '12px 24px',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        From
                                        <ChevronDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                            </div>
                                </th>
                                <th style={{
                                    padding: '12px 24px',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Title
                                        <ChevronDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                        </div>
                                </th>
                                <th style={{
                                    padding: '12px 24px',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Category
                                        <ChevronDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                                    </div>
                                </th>
                                <th style={{
                                    padding: '12px 24px',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Location
                                        <ChevronDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                        </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingReceived ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                        Loading notices...
                                    </td>
                                </tr>
                            ) : errorReceived ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
                                        {errorReceived}
                                    </td>
                                </tr>
                            ) : filteredNotices.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                        No notices found
                                    </td>
                                </tr>
                            ) : (
                                filteredNotices.map((notice) => (
                                    <tr key={notice.id} style={{
                                        borderBottom: '1px solid #e5e7eb',
                                        backgroundColor: 'white'
                                    }}>
                                        <td style={{
                                            padding: '16px 24px',
                                            fontSize: '14px',
                                            color: '#374151'
                                        }}>
                                            {formatDate(notice.date)}
                                        </td>
                                        <td style={{
                                            padding: '16px 24px',
                                            fontSize: '14px',
                                            color: '#374151'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: '500' }}>{getSenderName(notice.sender_info)}</div>
                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>{notice.sender_info?.role_name || 'N/A'}</div>
                    </div>
                                        </td>
                                        <td style={{
                                            padding: '16px 24px',
                                            fontSize: '14px',
                                            color: '#374151'
                                        }}>
                                            {notice.title || 'N/A'}
                                        </td>
                                        <td style={{
                                            padding: '16px 24px',
                                            fontSize: '14px',
                                            color: '#374151'
                                        }}>
                                            Notice
                                        </td>
                                        <td style={{
                                            padding: '16px 24px',
                                            fontSize: '14px',
                                            color: '#374151'
                                        }}>
                                            {notice.sender_info?.district_name && (
                                                <div>
                                                    <div>{notice.sender_info.district_name}</div>
                                                    {notice.sender_info.block_name && (
                                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                            {notice.sender_info.block_name}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default NotoficationContent;