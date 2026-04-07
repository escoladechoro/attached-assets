import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Stethoscope, 
  BriefcaseMedical, 
  CircleDollarSign, 
  FileText, 
  BarChart3, 
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["gestao", "recepcao", "profissional"] },
  { title: "Agenda", href: "/agenda", icon: CalendarDays, roles: ["gestao", "recepcao", "profissional"] },
  { title: "Clientes", href: "/clients", icon: Users, roles: ["gestao", "recepcao", "profissional"] },
  { title: "Profissionais", href: "/professionals", icon: Stethoscope, roles: ["gestao", "recepcao"] },
  { title: "Serviços", href: "/services", icon: BriefcaseMedical, roles: ["gestao"] },
  { title: "Vendas", href: "/sales", icon: CircleDollarSign, roles: ["gestao", "recepcao"] },
  { title: "Contratos", href: "/contracts", icon: FileText, roles: ["gestao", "recepcao", "profissional"] },
  { title: "Relatórios", href: "/reports", icon: BarChart3, roles: ["gestao"] },
  { title: "Configurações", href: "/settings", icon: Settings, roles: ["gestao", "recepcao", "profissional"] },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <span className="text-lg font-bold text-sidebar-primary-foreground tracking-tight">
          Instituto Acaz Ribeiro
        </span>
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-4">
          {filteredNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={location === item.href || location.startsWith(item.href + '/') ? "secondary" : "ghost"}
                className={`w-full justify-start ${
                  location === item.href || location.startsWith(item.href + '/')
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-4 flex flex-col">
          <span className="text-sm font-medium">{user.name}</span>
          <span className="text-xs text-sidebar-foreground/70 capitalize">{user.role}</span>
        </div>
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground" onClick={() => logout()}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}
