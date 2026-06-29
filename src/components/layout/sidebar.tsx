'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  GraduationCap,
  Briefcase,
  Award,
  Library,
  Bot,
  ChevronLeft,
  ChevronRight,
  Settings,
  Inbox
} from 'lucide-react'
import { getUserProfile } from '@/app/actions/profile'
import { ProfileModal } from './ProfileModal'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inbox Queue', href: '/inbox', icon: Inbox },
  { name: 'AI Assistant', href: '/assistant', icon: Bot },
  { name: 'Today', href: '/today', icon: Clock },
  { name: 'Timeline', href: '/timeline', icon: CalendarDays },
  { name: 'Academic Hub', href: '/academic', icon: GraduationCap },
  { name: 'Projects', href: '/projects', icon: Briefcase },
  { name: 'Certifications', href: '/certifications', icon: Award },
  { name: 'Knowledge Hub', href: '/knowledge', icon: Library },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchProfile = async () => {
    const data = await getUserProfile()
    if (data) {
      setProfile(data)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const getInitials = (name: string | null) => {
    if (!name) return 'OS'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return parts[0].substring(0, 2).toUpperCase()
  }

  return (
    <div 
      className={`hidden md:flex h-full flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out relative z-20 ${
        isCollapsed ? 'w-20' : 'w-[280px]'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-20 items-center justify-between px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Bot className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <h1 className="text-lg font-bold tracking-tight text-foreground transition-opacity duration-300">
              Life OS
            </h1>
          )}
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg border border-sidebar-border bg-sidebar hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 scrollbar-hide">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-lg py-2.5 px-3 text-sm font-semibold transition-all duration-200 ${
                  isCollapsed ? 'justify-center' : 'gap-3'
                } ${
                  isActive
                    ? 'bg-sidebar-accent text-primary border border-sidebar-border shadow-xs'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border bg-sidebar">
        <button 
          onClick={() => setIsModalOpen(true)}
          className={`flex items-center w-full text-left p-2 rounded-xl hover:bg-sidebar-accent transition-colors cursor-pointer group ${isCollapsed ? 'justify-center' : 'gap-3'}`}
          title="Edit Profile"
        >
          <div className="h-9 w-9 shrink-0 rounded-lg bg-secondary flex items-center justify-center border border-sidebar-border shadow-inner group-hover:border-primary transition-colors">
            <span className="text-xs font-bold text-primary">{profile ? getInitials(profile.full_name) : 'AS'}</span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 pr-1 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{profile?.full_name || 'Akhil Shetty'}</p>
                <p className="text-[10px] font-medium text-muted-foreground truncate">{profile?.degree_name || 'Student profile active'}</p>
              </div>
              <Settings className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
            </div>
          )}
        </button>
      </div>

      <ProfileModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialProfile={profile} 
        onUpdate={() => {
          fetchProfile()
          router.refresh()
        }}
      />
    </div>
  )
}
