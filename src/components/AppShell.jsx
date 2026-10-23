import {
  ArrowDownToLine,
  ArrowLeftRight,
  Bell,
  Boxes,
  Camera,
  ClipboardList,
  Clock3,
  Home,
  LogOut,
  Menu,
  QrCode,
  Search,
  Video,
} from 'lucide-react'
import { useBorrowing } from '@/context/useBorrowing'
import { useAuth } from '@/context/useAuth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const studentNavigation = [{
  heading: 'STUDENT',
  links: [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'scan', label: 'Scan student ID', icon: QrCode },
    { id: 'borrow', label: 'Borrow equipment', icon: ArrowDownToLine },
    { id: 'return', label: 'My borrowings', icon: ArrowLeftRight },
    { id: 'history', label: 'My borrowing history', icon: ClipboardList },
  ],
}]

const staffNavigation = [{
  heading: 'STAFF PORTAL',
  links: [
    { id: 'dashboard', label: 'Overview', icon: Video },
    { id: 'pickups', label: 'Pickups', icon: QrCode },
    { id: 'returns', label: 'Returns', icon: ArrowLeftRight },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'history', label: 'Borrowing history', icon: ClipboardList },
  ],
}]

const pageLabels = {
  home: 'Home',
  login: 'Student access',
  scan: 'Student ID scan',
  borrow: 'Borrow equipment',
  confirmation: 'Request confirmed',
  notifications: 'Notifications',
  dashboard: 'Staff overview',
  pickups: 'Pickups',
  returns: 'Returns',
  inventory: 'Equipment inventory',
  return: 'My borrowings',
  history: 'Borrowing history',
}

export function AppShell({ page, navigate, children }) {
  const { notifications } = useBorrowing()
  const { user, logout } = useAuth()
  const isStaff = user.role !== 'student'
  const navigation = isStaff ? staffNavigation : studentNavigation
  const unreadCount = notifications.filter((notification) => !notification.read).length
  const displayName = user.name || user.email.split('@')[0]
  const initial = displayName.charAt(0).toUpperCase()

  const signOut = () => {
    logout()
    navigate('login')
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <button className="brand" onClick={() => navigate(isStaff ? 'dashboard' : 'home')} aria-label="Go to home">
          <span className="brand-mark"><Video size={19} strokeWidth={2.4} /></span>
          <span className="brand-copy">
            <strong>AVR<span>+</span></strong>
            <small>Equipment desk</small>
          </span>
        </button>

        <div className="workspace-switcher">
          <span className="workspace-icon"><Camera size={16} /></span>
          <span><strong>UIC Media Center</strong><small>Borrowing portal</small></span>
          <Menu size={15} className="workspace-menu" />
        </div>

        <nav className="side-navigation" aria-label="Main navigation">
          {navigation.map((section) => (
            <div className="nav-section" key={section.heading}>
              <p className="nav-heading">{section.heading}</p>
              {section.links.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  data-page={id}
                  className={`nav-link ${page === id ? 'active' : ''}`}
                  onClick={() => navigate(id)}
                >
                  <Icon size={17} strokeWidth={1.8} />
                  <span>{label}</span>
                  {id === 'notifications' && unreadCount > 0 && (
                    <span className="nav-count">{unreadCount}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!isStaff && <div className="help-card">
            <span className="help-icon"><Clock3 size={16} /></span>
            <strong>Need equipment?</strong>
            <p>Reserve AV gear for your next class or event.</p>
            <button onClick={() => navigate('borrow')}>Start a request <span>→</span></button>
          </div>}
          <DropdownMenu>
            <DropdownMenuTrigger className="profile-trigger">
              <span className="avatar">{initial}</span>
              <span className="profile-copy">
                <strong>{displayName}</strong>
                <small>{user.email}</small>
              </span>
              <span className="profile-menu">•••</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="profile-menu-content">
              <div className="profile-menu-label">{isStaff ? 'Staff account' : 'Student account'}</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="signout-item"><LogOut size={15} /> Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark"><Video size={18} /></span>
            <strong>AVR<span>+</span></strong>
          </div>
          <div className="breadcrumbs">
            <span>AVR Portal</span><span className="crumb-divider">/</span>
            <strong>{pageLabels[page] ?? 'Home'}</strong>
          </div>
          <div className="topbar-actions">
            <Button variant="outline" className="top-search" onClick={() => navigate(isStaff ? 'inventory' : 'borrow')}>
              <Search size={15} /><span>{isStaff ? 'Search equipment' : 'Find equipment'}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="top-notifications"
              aria-label={isStaff ? 'Open notifications' : 'Open borrowing history'}
              onClick={() => navigate(isStaff ? 'notifications' : 'history')}
            >
              {isStaff ? <Bell size={18} /> : <ClipboardList size={18} />}
              {isStaff && unreadCount > 0 && <span className="notification-dot" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger className="top-avatar">{initial}</DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="profile-menu-content">
                <div className="profile-menu-label">{user.email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="signout-item"><LogOut size={15} /> Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="page-content">{children}</main>
        <footer className="page-footer">
          <span>AVR Borrowing System</span>
          <span>University of the Immaculate Conception <i /> Media Center</span>
        </footer>
      </div>
    </div>
  )
}
