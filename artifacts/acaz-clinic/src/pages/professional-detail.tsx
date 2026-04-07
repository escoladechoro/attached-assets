import { useParams, useLocation } from "wouter";
import { useGetProfessional, useGetProfessionalSchedule, useGetProfessionalStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Stethoscope, Phone, Mail, Percent, CalendarDays, BarChart3 } from "lucide-react";

export default function ProfessionalDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const id = parseInt(params.id || "0", 10);

  const { data: professional, isLoading: loadingProf } = useGetProfessional(id, {
    query: { enabled: !!id }
  });

  const { data: schedule, isLoading: loadingSchedule } = useGetProfessionalSchedule(id, {
    query: { enabled: !!id }
  });

  const { data: stats, isLoading: loadingStats } = useGetProfessionalStats({ period: 'month' });

  const profStats = stats?.find(s => s.professionalId === id);

  if (loadingProf) {
    return <div className="flex justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (!professional) {
    return <div>Profissional não encontrado</div>;
  }

  const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/professionals")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary">{professional.name}</h1>
            <p className="text-muted-foreground">{professional.specialty || "Sem especialidade definida"}</p>
          </div>
        </div>
        <Button variant="outline">Editar Perfil</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 border-sidebar-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-primary" /> Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Mail className="h-4 w-4" /> Email
              </p>
              <p className="text-sm">{professional.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Phone className="h-4 w-4" /> Telefone
              </p>
              <p className="text-sm">{professional.phone || "Não informado"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">CPF</p>
              <p className="text-sm">{professional.cpf || "Não informado"}</p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1 mb-2">
                <Percent className="h-4 w-4" /> Configuração de Repasse
              </p>
              <div className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-md">
                <span>Profissional: <strong className="text-primary">{professional.professionalSharePercent}%</strong></span>
                <span>Clínica: <strong>{professional.clinicSharePercent}%</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-card">
              <CardContent className="p-4 flex flex-col gap-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" /> Faturamento (Mês)
                </p>
                <p className="text-2xl font-bold text-secondary">{formatCurrency(profStats?.revenue || 0)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="p-4 flex flex-col gap-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Percent className="h-4 w-4 text-primary" /> Repasse (Mês)
                </p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(profStats?.professionalEarnings || 0)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="p-4 flex flex-col gap-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" /> Atendimentos (Mês)
                </p>
                <p className="text-2xl font-bold text-secondary">{profStats?.appointments || 0}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-sidebar-border bg-card flex-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5 text-primary" /> Horários de Atendimento
              </CardTitle>
              <Button variant="outline" size="sm">Editar Horários</Button>
            </CardHeader>
            <CardContent>
              {loadingSchedule ? (
                <div className="flex justify-center p-4"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
              ) : schedule && schedule.length > 0 ? (
                <div className="grid gap-2">
                  {daysOfWeek.map((day, index) => {
                    const daySlots = schedule.filter(s => s.dayOfWeek === index);
                    if (daySlots.length === 0) return null;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-md bg-muted/10">
                        <span className="font-medium w-24">{day}</span>
                        <div className="flex flex-wrap gap-2 flex-1">
                          {daySlots.map(slot => (
                            <span key={slot.id} className="text-sm bg-background border px-2 py-1 rounded-md">
                              {slot.startTime} às {slot.endTime}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-6 border border-dashed rounded-md text-muted-foreground">
                  Nenhum horário de atendimento configurado.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
