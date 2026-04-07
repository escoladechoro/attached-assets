import { useState } from "react";
import { useLocation } from "wouter";
import { useListAppointments, useUpdateAppointment, getListAppointmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";

export default function Agenda() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateAppointment();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');

  const { data: appointments, isLoading } = useListAppointments({
    date: format(selectedDate, 'yyyy-MM-dd'),
    professionalId: user?.role === 'profissional' ? user.id : undefined
  });

  const handleUpdateStatus = (id: number, status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show") => {
    updateMutation.mutate({ id, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
      }
    });
  };

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const handleToday = () => setSelectedDate(new Date());

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <Badge variant="secondary">Agendado</Badge>;
      case 'confirmed': return <Badge variant="default" className="bg-blue-500">Confirmado</Badge>;
      case 'completed': return <Badge variant="default" className="bg-green-500">Concluído</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelado</Badge>;
      case 'no_show': return <Badge variant="destructive">Falta</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary">Agenda</h1>
          <p className="text-muted-foreground">Gerencie horários e agendamentos.</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setLocation("/agenda/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      <Card className="border-sidebar-border bg-card flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b pb-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-md border p-1 bg-muted/20">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" className="h-8 px-3 font-medium" onClick={handleToday}>
                Hoje
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-muted p-1 rounded-md">
            <Button 
              variant={view === 'day' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setView('day')}
              className="h-7"
            >
              Dia
            </Button>
            <Button 
              variant={view === 'week' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setView('week')}
              className="h-7"
              disabled
            >
              Semana
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-0">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="divide-y">
              {appointments?.data && appointments.data.length > 0 ? (
                appointments.data.map((apt) => (
                  <div key={apt.id} className="flex items-start gap-4 p-4 hover:bg-muted/10 transition-colors">
                    <div className="w-16 text-right">
                      <p className="text-sm font-bold text-secondary">{apt.startTime}</p>
                      <p className="text-xs text-muted-foreground">{apt.endTime}</p>
                    </div>
                    <div className="w-2 h-full min-h-[40px] rounded-full bg-primary/40 flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-secondary">{apt.clientName}</p>
                        {getStatusBadge(apt.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {apt.serviceName} {user?.role !== 'profissional' && `• ${apt.professionalName}`}
                      </p>
                      {apt.notes && (
                        <p className="text-xs text-muted-foreground mt-2 bg-muted/30 p-2 rounded">
                          {apt.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {apt.status === "scheduled" && (
                        <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(apt.id, "confirmed")}>
                          Confirmar
                        </Button>
                      )}
                      {(apt.status === "scheduled" || apt.status === "confirmed") && (
                        <Button variant="outline" size="sm" className="bg-green-500/10 text-green-600 hover:bg-green-500/20" onClick={() => handleUpdateStatus(apt.id, "completed")}>
                          Concluir
                        </Button>
                      )}
                      {(apt.status !== "completed" && apt.status !== "cancelled") && (
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/90" onClick={() => handleUpdateStatus(apt.id, "cancelled")}>
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col h-[400px] items-center justify-center text-muted-foreground gap-2">
                  <CalendarIcon className="h-12 w-12 opacity-20" />
                  <p>Nenhum agendamento para esta data.</p>
                  <Button variant="link" className="text-primary mt-2">Criar primeiro agendamento</Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
