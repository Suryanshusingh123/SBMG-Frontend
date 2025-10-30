import React from 'react';
import { Search, Bell, ChevronDown, Menu } from 'lucide-react';

const Header = ({ onMenuClick }) => {
  return (
    <header style={{
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '6px 0px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Left side - Menu icon */}
      <div style={{display: 'flex', alignItems: 'center'}}>
        <button onClick={onMenuClick} style={{
          padding: '8px',
          marginLeft: '8px',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
          <Menu style={{width: '20px', height: '20px', color: '#6b7280'}} />
        </button>
      </div>

      {/* Right side - Search bar, Notifications and Profile */}
      <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginRight: '16px'}}>
        {/* Search bar */}
        <div style={{position: 'relative', width: '250px'}}>
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
              paddingRight: '40px',
              paddingTop: '5px',
              paddingBottom: '5px',
              border: '1px solid #d1d5db',
              borderRadius: '28px',
              outline: 'none'
            }}
          />
          <button style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}>
            <span style={{fontSize: '14px'}}>×</span>
          </button>
        </div>
        {/* Notification bell - Separate container */}
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '1px',
          borderRadius: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <button style={{
            padding: '6px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            position: 'relative'
          }}>
            <Bell style={{width: '18px', height: '18px', color: '#6b7280'}} />
          </button>
        </div>

        {/* User profile - Separate container */}
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '2px 5px',
          borderRadius: '20px',
          border: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '1px'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            backgroundColor: '#d1d5db',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{fontSize: '12px', fontWeight: '500', color: '#6b7280'}}>U</span>
          </div>
          <ChevronDown style={{width: '14px', height: '14px', color: '#6b7280'}} />
        </div>
      </div>
    </header>
  );
};

export default Header;