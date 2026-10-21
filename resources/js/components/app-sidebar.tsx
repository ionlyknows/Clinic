import { Link, usePage } from '@inertiajs/react';
import { CalendarDays, LayoutGrid, Settings2 } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/admin', icon: LayoutGrid },
    { title: 'Appointments', href: '/admin/appointments', icon: CalendarDays },
];

export function AppSidebar() {
    const page = usePage();
    const auth = page.props.auth as
        | { user?: { role?: string } | null }
        | undefined;
    const adminItems: NavItem[] =
        auth?.user?.role === 'admin'
            ? [
                  {
                      title: 'Services',
                      href: '/admin/services',
                      icon: Settings2,
                  },
                  {
                      title: 'Opening hours',
                      href: '/admin/hours',
                      icon: Settings2,
                  },
                  {
                      title: 'Closure dates',
                      href: '/admin/closures',
                      icon: Settings2,
                  },
              ]
            : [];
    const items = [...mainNavItems, ...adminItems];
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={items} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
