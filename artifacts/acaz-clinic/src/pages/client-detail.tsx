import { useParams, useLocation } from "wouter";
import { useGetClient, useListAppointments, useListContracts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ClientDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const id = parseInt(params.id || "0", 10);

  const { data: client, isLoading: loadingClient } = useGetClient(id, {
    query: { enabled: !!id }
  });

  const { data: appointments, isLoading: loadingAppointments } = useListAppointments({
    clientId: id
  }, {
    query: { enabled: !!id }
  });

  const { data: contracts, isLoading: loadingContracts } = useListContracts({
    clientId: id
  }, {
    query: { enabled: !!id }
  });

  if (loadingClient) {
    return <div className="flex justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (!client) {
    return <div>Cliente não encontrado</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary">{client.name}</h1>
          <p className="text-muted-foreground">Detalhes do cliente e histórico.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 border-sidebar-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" /> Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">CPF</p>
              <p className="text-sm">{client.cpf || "Não informado"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Mail className="h-4 w-4" /> Email
              </p>
              <p className="text-sm">{client.email || "Não informado"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Phone className="h-4 w-4" /> Telefone
              </p>
              <p className="text-sm">{client.phone || "Não informado"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Data de Nascimento
              </p>
              <p className="text-sm">
                {client.birthDate ? format(new Date(client.birthDate), "dd/MM/yyyy") : "Não informado"}
              </p>
            </div>
            {(client.emergencyContact || client.emergencyPhone) && (
              <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20 mt-4">
                <p className="text-sm font-medium text-destructive flex items-center gap-1 mb-1">
                  <AlertTriangle className="h-4 w-4" /> Contato de Emergência
                </p>
                <p className="text-sm font-medium">{client.emergencyContact}</p>
                <p className="text-sm">{client.emergencyPhone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="col-span-2 flex flex-col gap-6">
          <Card className="border-sidebar-border bg-card flex-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" /> Últimos Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAppointments ? (
                <div className="flex justify-center p-4"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
              ) : appointments?.data && appointments.data.length > 0 ? (
                <div className="space-y-4">
                  {appointments.data.slice(0, 5).map(apt => (
                    <div key={apt.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-sm">{apt.serviceName}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(apt.date), "dd/MM/yyyy")} às {apt.startTime} com {apt.professionalName}</p>
                      </div>
                      <div className="text-sm capitalize px-2 py-1 bg-muted rounded-md">{apt.status}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center p-4">Nenhum agendamento encontrado.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-sidebar-border bg-card flex-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" /> Contratos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingContracts ? (
                <div className="flex justify-center p-4"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
              ) : contracts?.data && contracts.data.length > 0 ? (
                <div className="space-y-4">
                  {contracts.data.map(contract => (
                    <div key={contract.id} className="flex flex-col gap-2 border p-3 rounded-md bg-muted/10">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-sm">{contract.packageName}</p>
                        <span className={`text-xs px-2 py-1 rounded-md ${contract.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted'}`}>
                          {contract.status === 'active' ? 'Ativo' : 'Concluído'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Sessões: {contract.usedSessions} de {contract.totalSessions}</span>
                        <span>Restantes: {contract.remainingSessions}</span>
                      </div>
                      <div className="w-full bg-secondary/20 rounded-full h-1.5 mt-1">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(contract.usedSessions / contract.totalSessions) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center p-4">Nenhum contrato encontrado.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
