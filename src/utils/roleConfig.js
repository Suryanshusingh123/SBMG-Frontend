export const ROLES = {
  SUPERVISOR: 'supervisor',
  VDO: 'vdo',
  SMD: 'smd',
  BDO: 'bdo',
  CEO: 'ceo'
};

// Unified dashboard configuration - all roles use the same dashboard
export const unifiedDashboardConfig = {
  dashboardTitle: 'SBMG Dashboard',
  features: [
    'complaints-management',
    'attendance-tracking',
    'inspection-reports',
    'village-master-data',
    'schemes-management',
    'events-calendar',
    'gps-tracking',
    'notices-announcements'
  ],
  menuItems: [
    { name: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
    { name: 'Complaints', icon: 'FileText', path: '/complaints' },
    { name: 'Attendance', icon: 'CheckCircle', path: '/attendance' },
    { name: 'Inspection', icon: 'ListChecks', path: '/inspection' },
    { name: 'Village Master Data', icon: 'Database', path: '/village-master' },
    { name: 'Schemes', icon: 'Briefcase', path: '/schemes' },
    { name: 'Events', icon: 'Calendar', path: '/events' },
    { name: 'GPS Tracking', icon: 'Truck', path: '/gps-tracking' },
    { name: 'Notices', icon: 'Bell', path: '/notices' }
  ],
  color: '#059669',
  bgColor: 'bg-green-600'
};

export const hasAccess = (userRole, feature) => {
  // All roles have access to all features in the unified dashboard
  return unifiedDashboardConfig.features.includes(feature);
};

