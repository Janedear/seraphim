import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Plug,
  Settings,
  Shield,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import AlertNotificationCenter from '@/components/alerts/AlertNotificationCenter';
import { useAgentCustomization } from '@/components/hooks/useAgentCustomization';
import { useIntegrationOnboarding } from '@/components/hooks/useIntegrationOnboarding';
import OnboardingOverlay from '@/components/onboarding/OnboardingOverlay';
import { integrationOnboardingSteps } from '@/components/onboarding/integrationOnboardingSteps';
import { createPageUrl } from './utils';
import { blueTeamNav, redTeamNav, sharedNav } from './nav';
import { dashboardFor, readTeam, writeTeam } from './lib/team';

function displayName(user) {
  return user?.full_name || user?.name || user?.email || 'Operator';
}

function initials(user) {
  const name = displayName(user);
  const parts = name.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function NavItem({ item, isActive, collapsed, team }) {
  const Icon = item.icon;
  return (
    <Link
      to={createPageUrl(item.href)}
      className={cn(
        'relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
        isActive
          ? team === 'blue'
            ? 'border border-cyan-500/40 bg-black text-cyan-400 shadow-[0_0_20px_rgba(0,186,255,0.2)]'
            : 'border border-red-500/40 bg-black text-red-400 shadow-[0_0_20px_rgba(255,50,50,0.2)]'
          : 'border border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-white'
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 flex-shrink-0',
          isActive ? (team === 'blue' ? 'text-cyan-400' : 'text-red-400') : 'text-slate-500'
        )}
      />
      {!collapsed && <span>{item.name}</span>}
    </Link>
  );
}

function TeamToggle({ team, onChange, collapsed, onMobileMenuClose, inline = false }) {
  const navigate = useNavigate();

  const switchTeam = (next) => {
    if (team === next) return;
    onChange(writeTeam(next));
    onMobileMenuClose?.();
    navigate(createPageUrl(dashboardFor(next)));
  };

  return (
    <div className={cn(!inline && 'mb-3 px-3', inline && 'w-[168px]', collapsed && !inline && 'px-2')}>
      <div
        className={cn(
          'flex items-center gap-1 rounded-lg border bg-slate-950 p-1',
          team === 'blue' ? 'border-cyan-500/30' : 'border-red-500/30',
          collapsed && !inline && 'flex-col gap-1 p-0.5'
        )}
      >
        <button
          type="button"
          onClick={() => switchTeam('blue')}
          className={cn(
            'flex-1 rounded-md px-3 py-2 text-xs font-bold transition-all',
            inline ? 'min-h-[32px] py-1.5' : 'min-h-[40px]',
            collapsed && !inline && 'min-h-0 px-2 py-1',
            team === 'blue'
              ? 'border border-cyan-400/50 bg-cyan-600 text-white shadow-[0_0_20px_rgba(0,186,255,0.4)]'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-cyan-400'
          )}
        >
          {collapsed && !inline ? 'B' : 'BLUE'}
        </button>
        <button
          type="button"
          onClick={() => switchTeam('red')}
          className={cn(
            'flex-1 rounded-md px-3 py-2 text-xs font-bold transition-all',
            inline ? 'min-h-[32px] py-1.5' : 'min-h-[40px]',
            collapsed && !inline && 'min-h-0 px-2 py-1',
            team === 'red'
              ? 'border border-red-400/50 bg-red-600 text-white shadow-[0_0_20px_rgba(255,50,50,0.4)]'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-red-400'
          )}
        >
          {collapsed && !inline ? 'R' : 'RED'}
        </button>
      </div>
    </div>
  );
}

function Sidebar({ collapsed, setCollapsed, currentPage, isMobile, onClose, team, setTeam }) {
  const navigation = team === 'blue' ? blueTeamNav : redTeamNav;
  const accentBorder = team === 'blue' ? 'border-cyan-500/20' : 'border-red-500/20';

  return (
    <aside
      className={cn(
        'flex flex-col bg-slate-950 transition-all duration-300',
        `border-r ${accentBorder}`,
        isMobile ? 'fixed inset-y-0 left-0 z-50 w-64' : collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      <div className={cn('flex h-16 items-center justify-between border-b bg-slate-950 px-4', accentBorder)}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg border',
                team === 'blue'
                  ? 'border-cyan-500/40 bg-cyan-500/20 shadow-[0_0_20px_rgba(0,186,255,0.3)]'
                  : 'border-red-500/40 bg-red-500/20 shadow-[0_0_20px_rgba(255,50,50,0.3)]'
              )}
            >
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className={cn('text-lg font-bold tracking-tighter', team === 'blue' ? 'neon-text-blue' : 'neon-text-red')}>
                SERAPHIM
              </span>
              <Badge
                className={cn(
                  'ml-2 border text-[10px] font-bold tracking-wider',
                  team === 'blue'
                    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-400'
                )}
              >
                {team === 'blue' ? 'DEFENSIVE' : 'OFFENSIVE'}
              </Badge>
            </div>
          </div>
        )}
        {collapsed && !isMobile && (
          <div
            className={cn(
              'mx-auto flex h-8 w-8 items-center justify-center rounded-lg',
              team === 'blue' ? 'bg-blue-700' : 'bg-red-700'
            )}
          >
            <Shield className="h-5 w-5 text-white" />
          </div>
        )}
        {isMobile && (
          <button type="button" onClick={onClose} className="-mr-2 p-2 text-slate-400 hover:text-white">
            <X className="h-5 h-5" />
          </button>
        )}
      </div>

      <TeamToggle
        team={team}
        onChange={setTeam}
        collapsed={collapsed && !isMobile}
        onMobileMenuClose={isMobile ? onClose : undefined}
      />

      <nav className="flex-1 space-y-1 overflow-y-auto bg-slate-950 p-3">
        {navigation.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={currentPage === item.href}
            collapsed={collapsed && !isMobile}
            team={team}
          />
        ))}
        <div className={cn('my-2 border-t', team === 'blue' ? 'border-blue-900/30' : 'border-red-900/30')} />
        {sharedNav.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={currentPage === item.href}
            collapsed={collapsed && !isMobile}
            team={team}
          />
        ))}
      </nav>

      {!isMobile && (
        <div className={cn('border-t bg-slate-950 p-3', team === 'blue' ? 'border-blue-900/30' : 'border-red-900/30')}>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-white"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
      )}
    </aside>
  );
}

function Header({ onMenuClick, user, isLoading, onLogout, team, onTeamChange }) {
  const name = displayName(user);
  return (
    <header
      className={cn(
        'flex h-16 items-center justify-between gap-3 border-b bg-slate-950 px-4 lg:px-6',
        team === 'blue' ? 'border-cyan-500/20' : 'border-red-500/20'
      )}
    >
      <button type="button" onClick={onMenuClick} className="-ml-2 p-2 text-slate-400 hover:text-white lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden flex-1 lg:block" />
      <TeamToggle team={team} onChange={onTeamChange} inline />
      <div className="flex flex-1 items-center justify-end gap-3">
        <AlertNotificationCenter team={team} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex items-center gap-2 rounded-lg p-1.5 transition-colors',
                team === 'blue' ? 'hover:bg-blue-950/50' : 'hover:bg-red-950/50'
              )}
            >
              {isLoading ? (
                <Skeleton className="h-8 w-8 rounded-full" />
              ) : (
                <>
                  <Avatar className="h-8 w-8 ring-2 ring-slate-700">
                    <AvatarFallback
                      className={cn(
                        'text-sm font-semibold text-white',
                        team === 'blue' ? 'bg-blue-700' : 'bg-red-700'
                      )}
                    >
                      {initials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left sm:block">
                    <p className="text-sm font-medium text-white">{name}</p>
                    <p className="text-xs capitalize text-slate-400">{user?.role || 'operator'}</p>
                  </div>
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-slate-700 bg-slate-800">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-white">{name}</p>
              <p className="text-xs capitalize text-slate-400">{user?.role || 'operator'}</p>
            </div>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem asChild className="text-slate-300 focus:bg-slate-700 focus:text-white">
              <Link to={createPageUrl('IntegrationSetup')} className="cursor-pointer">
                <Plug className="mr-2 h-4 w-4" />
                Integration Setup
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-slate-300 focus:bg-slate-700 focus:text-white">
              <Link to={createPageUrl('Settings')} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem
              onClick={onLogout}
              className="cursor-pointer text-red-400 focus:bg-red-950/50 focus:text-red-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default function Layout({ children, currentPageName }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [team, setTeam] = useState(readTeam);
  const { user, isLoading, logout } = useAuth();
  const { customization } = useAgentCustomization(user?.email);
  const { showOnboarding, currentStep, completeOnboarding, skipOnboarding, nextStep, prevStep } =
    useIntegrationOnboarding();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentPageName]);

  const cssVars = {
    '--primary-accent': customization?.primary_accent_color || (team === 'blue' ? '#00baff' : '#ff3232'),
    '--secondary-accent': customization?.secondary_accent_color || (team === 'blue' ? '#0066cc' : '#ff0080'),
    '--card-opacity': customization?.card_opacity ?? 0.2,
    '--bg-opacity': customization?.background_opacity ?? 0.2,
    '--bg-blur': `${customization?.background_blur || 0}px`,
  };

  const isPreviewMode = import.meta.env.VITE_PREVIEW_MODE === 'true';
  const hasCustomBg = customization?.background_file_url && customization?.background_type !== 'default';

  return (
    <div className={cn('relative flex h-screen overflow-hidden bg-slate-950', isPreviewMode && 'pt-10')} style={cssVars}>
      {hasCustomBg ? (
        <div className="pointer-events-none fixed inset-0 z-0" style={{ opacity: customization.background_opacity ?? 0.2 }}>
          {customization.background_type === 'custom_image' ? (
            <img
              src={customization.background_file_url}
              alt=""
              className="h-full w-full object-cover"
              style={{ filter: `blur(${customization.background_blur || 0}px)` }}
            />
          ) : (
            <video
              src={customization.background_file_url}
              autoPlay
              muted
              loop
              className="h-full w-full object-cover"
              style={{ filter: `blur(${customization.background_blur || 0}px)` }}
            />
          )}
          {customization.background_overlay_color && (
            <div className="pointer-events-none absolute inset-0" style={{ backgroundColor: customization.background_overlay_color }} />
          )}
        </div>
      ) : (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
          <img
            src="/backgrounds/seraphim-hud-blue.png"
            alt=""
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
              team === 'blue' ? 'opacity-55' : 'opacity-0'
            )}
          />
          <img
            src="/backgrounds/seraphim-hud-red.png"
            alt=""
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
              team === 'red' ? 'opacity-55' : 'opacity-0'
            )}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(ellipse at center, transparent 18%, rgba(0,0,0,0.28) 58%, rgba(0,0,0,0.7) 100%)',
            }}
          />
        </div>
      )}

      <div className="relative z-20 hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          currentPage={currentPageName}
          team={team}
          setTeam={setTeam}
        />
      </div>

      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed z-50 lg:hidden">
            <Sidebar
              currentPage={currentPageName}
              isMobile
              onClose={() => setMobileMenuOpen(false)}
              team={team}
              setTeam={setTeam}
            />
          </div>
        </>
      )}

      {showOnboarding && !isLoading && (
        <OnboardingOverlay
          steps={integrationOnboardingSteps}
          currentStep={currentStep}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipOnboarding}
          onComplete={completeOnboarding}
          teamColor={team === 'blue' ? 'blue' : 'red'}
        />
      )}

      {isPreviewMode && (
        <div className="fixed left-0 right-0 top-0 z-50 bg-amber-600/90 py-2 text-center text-sm font-medium text-amber-950">
          Local backend — alerts, devices, SIEM, and tools persist here. Set OPENAI_API_KEY in .env.local for LLM reports.
        </div>
      )}

      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          onMenuClick={() => setMobileMenuOpen(true)}
          user={user}
          isLoading={isLoading}
          onLogout={() => logout('/')}
          team={team}
          onTeamChange={setTeam}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] p-3 sm:p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
