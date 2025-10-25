import React, { useState } from "react";
import { Plus, Calendar, ChevronDown, X, Upload, Search, Download, Info, List } from 'lucide-react';

const NotoficationContent = () => {
  
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
                        234
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
                        3,452
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
                            12, January 2025
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
                            <select style={{
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
                                        Assigned to
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
                                        Notice Count
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
                                        Subject
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
                                        Status
                                        <ChevronDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                        </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{
                                borderBottom: '1px solid #e5e7eb',
                                backgroundColor: 'white'
                            }}>
                                <td style={{
                                    padding: '16px 24px',
                                    fontSize: '14px',
                                    color: '#374151'
                                }}>
                                    12/02/2023
                                </td>
                                <td style={{
                                    padding: '16px 24px',
                                    fontSize: '14px',
                                    color: '#374151'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '500' }}>Gram Panchayat</div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>District - Block</div>
                    </div>
                                </td>
                                <td style={{
                                    padding: '16px 24px',
                                    fontSize: '14px',
                                    color: '#374151'
                                }}>
                                    1
                                </td>
                                <td style={{
                                    padding: '16px 24px',
                                    fontSize: '14px',
                                    color: '#374151'
                                }}>
                                    Category
                                </td>
                                <td style={{
                                    padding: '16px 24px',
                                    fontSize: '14px',
                                    color: '#374151'
                                }}>
                                    Avg Response Time
                                </td>
                                <td style={{
                                    padding: '16px 24px',
                                    fontSize: '14px',
                                    color: '#374151'
                                }}>
                                    <span style={{
                                        backgroundColor: '#fef2f2',
                                        color: '#dc2626',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '500'
                                    }}>
                                        Open
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default NotoficationContent;