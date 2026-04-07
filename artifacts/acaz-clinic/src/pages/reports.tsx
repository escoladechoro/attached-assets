import { useState } from "react";
import { useGetFinancialReport, useGetAppointmentReport } from "@workspace/api-client-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { DollarSign, Calendar as CalendarIcon, TrendingUp, CreditCard } from "lucide-react";

export default function Reports() {
  const [dateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const startDate = format(dateRange.from, 'yyyy-MM-dd');
  const endDate = format(dateRange.to, 'yyyy-MM-dd');

  const { data: financialData, isLoading: loadingFinances } = useGetFinancialReport({
    startDate,
    endDate
  });

  const { data: appointmentData, isLoading: loadingAppointments } = useGetAppointmentReport({
    startDate,
    endDate
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const COLORS = ['hsl(15 60% 65%)', 'hsl(222 47% 11%)', 'hsl(199 89% 48%)', 'hsl(43 74% 66%)', 'hsl(27 87% 67%)'];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary">Relatórios</h1>
          <p className="text-muted-foreground">Visão geral de desempenho financeiro e atendimentos.</p>
        </div>
        <div className="bg-muted px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          {format(dateRange.from, "dd/MM/yyyy")} a {format(dateRange.to, "dd/MM/yyyy")}
        </div>
      </div>

      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Financeiro
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" /> Agendamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-6">
          {loadingFinances ? (
            <div className="flex justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Faturamento Bruto</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-secondary">{formatCurrency(financialData?.totalGross || 0)}</div>
                  </CardContent>
                </Card>
                <Card className="bg-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxas (Gateways)</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">{formatCurrency(financialData?.totalFees || 0)}</div>
                  </CardContent>
                </Card>
                <Card className="bg-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-primary">Receita Clínica (30%)</CardTitle>
                    <DollarSign className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{formatCurrency(financialData?.totalClinic || 0)}</div>
                  </CardContent>
                </Card>
                <Card className="bg-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Repasse Profissionais (70%)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-secondary">{formatCurrency(financialData?.totalProfessionals || 0)}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-card">
                  <CardHeader>
                    <CardTitle>Faturamento por Profissional</CardTitle>
                    <CardDescription>Receita gerada por cada profissional</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={financialData?.byProfessional || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="professionalName" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis tickFormatter={(value) => `R$ ${value}`} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--card-foreground))' }}
                          />
                          <Bar dataKey="revenue" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card">
                  <CardHeader>
                    <CardTitle>Métodos de Pagamento</CardTitle>
                    <CardDescription>Distribuição de receita por forma de pagamento</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <div className="h-[300px] w-full max-w-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={financialData?.byPaymentMethod || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="total"
                            nameKey="method"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {(financialData?.byPaymentMethod || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6">
          {loadingAppointments ? (
            <div className="flex justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle>Status dos Agendamentos</CardTitle>
                  <CardDescription>Total: {appointmentData?.total || 0} atendimentos</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="h-[300px] w-full max-w-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={appointmentData?.byStatus || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="count"
                          nameKey="status"
                          label={({ status, count }) => `${status}: ${count}`}
                        >
                          {(appointmentData?.byStatus || []).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.status === 'completed' ? 'hsl(142 71% 45%)' : 
                                entry.status === 'cancelled' || entry.status === 'no_show' ? 'hsl(0 84% 60%)' :
                                entry.status === 'confirmed' ? 'hsl(221 83% 53%)' :
                                'hsl(var(--muted-foreground))'
                              } 
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader>
                  <CardTitle>Atendimentos por Profissional</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={appointmentData?.byProfessional || []} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" />
                        <YAxis dataKey="professionalName" type="category" width={100} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completed" name="Concluídos" stackId="a" fill="hsl(142 71% 45%)" />
                        <Bar dataKey="cancelled" name="Cancelados" stackId="a" fill="hsl(0 84% 60%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
