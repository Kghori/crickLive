import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, Calendar } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Live Scores', icon: Activity },
  { to: '/upcoming', label: 'Upcoming', icon: Calendar },
  // { to: '/news', label: 'News', icon: Newspaper },
];

const Header = memo(() => (
  <>
    <header className="z-50 border-b bg-card/80 backdrop-blur-xl md:sticky md:top-0">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            CricLive
          </span>
        </div>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>

    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-2 gap-1 px-3 py-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span className="mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  </>
));

Header.displayName = 'Header';
export default Header;
