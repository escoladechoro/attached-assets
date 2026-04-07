import { useState } from "react";
import { Link } from "wouter";
import { 
  useGetDashboardSummary, 
  useGetTodayAppointments, 
  useGetRecentSales 
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  CalendarCheck, 
  CircleDollarSign, 
  FileText,
  Clock,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const isGestao = user?.role === "gestao";
  
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary({
    period: "today"
  });
  
  const { data: todayAppointments, isLoading: loadingAppointments } = useGetTodayAppointments();
  
  const { data: recentSales, isLoading: loadingSales } = useGetRecentSales({ limit: 5 });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <Badge variant="secondary">Agendado</Badge>;
      case 'confirmed': return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Confirmado</Badge>;
      case 'completed': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Concluído</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelado</Badge>;
      case 'no_show': return <Badge variant="destructive">Falta</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loadingSummary || loadingAppointments) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-secondary">Dashboard</h1>
        <p className="text-muted-foreground">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-sidebar-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{summary?.totalAppointments || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.completedAppointments || 0} concluídos
            </p>
          </CardContent>
        </Card>

        {isGestao && (
          <Card className="border-sidebar-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Hoje</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(summary?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Clínica: {formatCurrency(summary?.clinicRevenue || 0)}
              </p>
            </CardContent>
          </Card>
        )}

        {(user?.role === 'profissional' || isGestao) && (
          <Card className="border-sidebar-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Seu Repasse</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(summary?.professionalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Referente aos serviços de hoje
              </p>
            </CardContent>
          </Card>
        )}

        {(isGestao || user?.role === 'recepcao') && (
          <>
            <Card className="border-sidebar-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{summary?.newClients || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Cadastrados hoje
                </p>
              </CardContent>
            </Card>

            <Card className="border-sidebar-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{summary?.activeContracts || 0}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-sidebar-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Agenda do Dia</CardTitle>
              <CardDescription>
                Seus próximos atendimentos
              </CardDescription>
            </div>
            <Link href="/agenda">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Ver agenda completa
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {todayAppointments && todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {todayAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-4 rounded-lg border p-3 bg-muted/20">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{apt.startTime} - {apt.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {apt.serviceName} {isGestao && `• ${apt.professionalName}`}
                      </p>
                    </div>
                    <div>
                      {getStatusBadge(apt.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                Nenhum agendamento para hoje.
              </div>
            )}
          </CardContent>
        </Card>

        {(isGestao || user?.role === 'recepcao') && (
          <Card className="col-span-3 border-sidebar-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vendas Recentes</CardTitle>
                <CardDescription>
                  Últimas transações
                </CardDescription>
              </div>
              <Link href="/sales">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  Ver todas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentSales && recentSales.length > 0 ? (
                <div className="space-y-4">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{sale.clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {sale.serviceName || sale.packageName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-primary">
                          {formatCurrency(sale.grossAmount)}
                        </p>
                        <p className="text-xs text-muted-foreground uppercase">
                          {sale.paymentMethod}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                  Nenhuma venda recente.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
