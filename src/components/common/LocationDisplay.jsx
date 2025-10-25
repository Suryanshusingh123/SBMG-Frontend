import React, { useState } from 'react';
import { useLocation } from '../../context/LocationContext';

const LocationDisplay = () => {
  const { getCurrentLocationInfo, getChangeHistory, getLastChange, clearChangeHistory } = useLocation();
  const [showHistory, setShowHistory] = useState(false);
  
  const locationInfo = getCurrentLocationInfo();
  const changeHistory = getChangeHistory();
  const lastChange = getLastChange();

  return (
    <div style={{
      padding: '10px',
      backgroundColor: '#f3f4f6',
      borderRadius: '8px',
      margin: '10px 0',
      fontSize: '14px',
      fontFamily: 'monospace'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h4 style={{ margin: 0, color: '#374151' }}>Location Tracking:</h4>
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: '4px 8px',
              marginRight: '8px',
              fontSize: '12px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showHistory ? 'Hide' : 'Show'} History ({changeHistory.length})
          </button>
          <button
            onClick={clearChangeHistory}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>
      </div>

      <div style={{ color: '#6b7280' }}>
        <div><strong>Current Scope:</strong> {locationInfo.scope}</div>
        <div><strong>Current Location:</strong> {locationInfo.location}</div>
        <div><strong>Location ID:</strong> {locationInfo.locationId || 'N/A'}</div>
        <div><strong>District ID:</strong> {locationInfo.districtId || 'N/A'}</div>
        <div><strong>Block ID:</strong> {locationInfo.blockId || 'N/A'}</div>
        <div><strong>GP ID:</strong> {locationInfo.gpId || 'N/A'}</div>
      </div>

      {lastChange && (
        <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}>
          <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>
            Last Change ({lastChange.changeType}):
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            <div>From: {lastChange.previous.scope} - {lastChange.previous.location}</div>
            <div>To: {lastChange.current.scope} - {lastChange.current.location}</div>
            <div>Time: {new Date(lastChange.timestamp).toLocaleTimeString()}</div>
          </div>
        </div>
      )}

      {showHistory && (
        <div style={{ marginTop: '10px', maxHeight: '200px', overflowY: 'auto' }}>
          <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>
            Change History:
          </div>
          {changeHistory.length === 0 ? (
            <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>No changes yet</div>
          ) : (
            changeHistory.slice().reverse().map((change, index) => (
              <div key={index} style={{
                padding: '6px',
                marginBottom: '4px',
                backgroundColor: index === 0 ? '#dcfce7' : '#f9fafb',
                borderRadius: '4px',
                fontSize: '12px',
                border: index === 0 ? '1px solid #bbf7d0' : '1px solid #e5e7eb'
              }}>
                <div style={{ fontWeight: 'bold', color: '#374151' }}>
                  {change.changeType} - {new Date(change.timestamp).toLocaleTimeString()}
                </div>
                <div style={{ color: '#6b7280' }}>
                  {change.previous.scope} → {change.current.scope}
                </div>
                <div style={{ color: '#6b7280' }}>
                  {change.previous.location} → {change.current.location}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LocationDisplay;
