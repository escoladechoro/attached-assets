import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, Building2 } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-secondary">Configurações</h1>
        <p className="text-muted-foreground">Gerencie sua conta e preferências do sistema.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-sidebar-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" /> Meu Perfil
            </CardTitle>
            <CardDescription>Suas informações pessoais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" defaultValue={user?.name} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue={user?.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Nível de Acesso</Label>
              <Input id="role" defaultValue={user?.role} className="capitalize" disabled />
            </div>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-primary" /> Segurança
            </CardTitle>
            <CardDescription>Altere sua senha de acesso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input id="current-password" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input id="new-password" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input id="confirm-password" type="password" placeholder="••••••••" />
            </div>
            <Button className="w-full">Atualizar Senha</Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-sidebar-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" /> Sobre o Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
              <div>
                <p className="font-medium text-secondary">Instituto Acaz Ribeiro - Clinic Management</p>
                <p className="text-sm text-muted-foreground">Versão 1.0.0</p>
              </div>
              <Badge variant="outline" className="text-primary border-primary/20">Ambiente de Produção</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Quick component for the page since we don't have it imported from UI
function Badge({ children, variant = 'default', className = '' }: any) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
      variant === 'default' ? 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80' :
      variant === 'secondary' ? 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80' :
      variant === 'outline' ? 'border border-input text-foreground' : ''
    } ${className}`}>
      {children}
    </span>
  );
}
