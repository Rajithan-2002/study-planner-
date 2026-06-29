'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Clock, Bot, GraduationCap, Briefcase } from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Today', href: '/today', icon: Clock },
  { name: 'Assistant', href: '/assistant', icon: Bot, isCenter: true },
  { name: 'Academic', href: '/academic', icon: GraduationCap },
  { name: 'Projects', href: '/projects', icon: Briefcase },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-sidebar border-t border-sidebar-border pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          
          if (item.isCenter) {
            return (
              <Link key={item.name} href={item.href} className="relative -top-5 flex flex-col items-center">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-md border-4 border-background"
                >
                  <Bot className="h-6 w-6" />
                </motion.div>
                <span className="text-[10px] font-bold text-muted-foreground mt-1">{item.name}</span>
              </Link>
            )
          }

          return (
            <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center w-16 h-12">
              <motion.div 
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <item.icon className="h-5 w-5 animate-none" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold">{item.name}</span>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
