import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, History } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Create Invoice', path: '/create', icon: FileText },
    { name: 'History', path: '/history', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - hidden when printing */}
      <aside className="w-64 bg-white border-r border-gray-200 no-print flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">GST Invoice</h1>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-auto p-4 md:p-8 no-print-bg">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
