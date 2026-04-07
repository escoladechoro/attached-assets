import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  useCreateAppointment, 
  useListClients, 
  useListProfessionals, 
  useListServices,
  useGetAvailableSlots,
  getListAppointmentsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const appointmentSchema = z.object({
  clientId: z.coerce.number().min(1, "Cliente é obrigatório"),
  professionalId: z.coerce.number().min(1, "Profissional é obrigatório"),
  serviceId: z.coerce.number().min(1, "Serviço é obrigatório"),
  date: z.string().min(1, "Data é obrigatória"),
  startTime: z.string().min(1, "Horário é obrigatório"),
  notes: z.string().optional(),
});

type AppointmentForm = z.infer<typeof appointmentSchema>;

export default function NewAppointment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateAppointment();

  const { data: clients } = useListClients({ limit: 100 });
  const { data: professionals } = useListProfessionals();
  const { data: services } = useListServices();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
  });

  const watchProfessionalId = watch("professionalId");
  const watchDate = watch("date");
  const watchServiceId = watch("serviceId");

  const { data: availableSlots, isLoading: loadingSlots } = useGetAvailableSlots(
    { 
      professionalId: watchProfessionalId, 
      date: watchDate, 
      serviceId: watchServiceId 
    },
    {
      query: {
        enabled: !!(watchProfessionalId && watchDate && watchServiceId)
      }
    }
  );

  const onSubmit = (data: AppointmentForm) => {
    createMutation.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "Agendamento criado com sucesso!" });
          queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
          setLocation("/agenda");
        },
        onError: () => {
          toast({
            title: "Erro ao agendar",
            description: "Verifique os dados ou se o horário ainda está disponível.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/agenda")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary">Novo Agendamento</h1>
            <p className="text-muted-foreground">Marque um horário para um cliente.</p>
          </div>
        </div>
      </div>

      <Card className="border-sidebar-border bg-card">
        <CardHeader>
          <CardTitle>Detalhes do Agendamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select onValueChange={(val) => setValue("clientId", parseInt(val, 10))}>
                  <SelectTrigger className={errors.clientId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.data.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clientId && <p className="text-xs text-destructive">{errors.clientId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Serviço *</Label>
                <Select onValueChange={(val) => setValue("serviceId", parseInt(val, 10))}>
                  <SelectTrigger className={errors.serviceId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.data.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.durationMinutes} min)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.serviceId && <p className="text-xs text-destructive">{errors.serviceId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Profissional *</Label>
                <Select onValueChange={(val) => setValue("professionalId", parseInt(val, 10))}>
                  <SelectTrigger className={errors.professionalId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals?.data.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.professionalId && <p className="text-xs text-destructive">{errors.professionalId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input id="date" type="date" {...register("date")} className={errors.date ? "border-destructive" : ""} />
                {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Horário Disponível *</Label>
                {loadingSlots ? (
                  <div className="h-10 flex items-center text-sm text-muted-foreground">Buscando horários...</div>
                ) : availableSlots && availableSlots.length > 0 ? (
                  <Select onValueChange={(val) => setValue("startTime", val)}>
                    <SelectTrigger className={errors.startTime ? "border-destructive" : ""}>
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlots.map(slot => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="h-10 flex items-center text-sm text-muted-foreground">
                    {!watchProfessionalId || !watchDate || !watchServiceId 
                      ? "Selecione serviço, profissional e data para ver os horários."
                      : "Nenhum horário disponível para esta data."}
                  </div>
                )}
                {errors.startTime && <p className="text-xs text-destructive">{errors.startTime.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" {...register("notes")} rows={3} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setLocation("/agenda")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting || createMutation.isPending ? "Agendando..." : "Confirmar Agendamento"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
