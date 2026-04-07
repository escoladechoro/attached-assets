import { useParams, useLocation } from "wouter";
import { useGetContract, useListContractSessions, useAddContractSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, FileText, User, Stethoscope, Calendar, Clock, Plus, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function ContractDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const id = parseInt(params.id || "0", 10);

  const { data: contract, isLoading: loadingContract, refetch: refetchContract } = useGetContract(id, {
    query: { enabled: !!id }
  });

  const { data: sessions, isLoading: loadingSessions, refetch: refetchSessions } = useListContractSessions(id, {
    query: { enabled: !!id }
  });

  const addSessionMutation = useAddContractSession();

  const handleAddSession = () => {
    addSessionMutation.mutate(
      { id, data: { performedAt: new Date().toISOString(), notes: "Sessão realizada." } },
      {
        onSuccess: () => {
          toast({
            title: "Sessão registrada",
            description: "A sessão foi registrada com sucesso.",
          });
          refetchContract();
          refetchSessions();
        },
        onError: () => {
          toast({
            title: "Erro ao registrar sessão",
            description: "Ocorreu um erro. Tente novamente.",
            variant: "destructive",
          });
        }
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="default" className="bg-green-500">Ativo</Badge>;
      case 'completed': return <Badge variant="secondary">Concluído</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loadingContract) {
    return <div className="flex justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (!contract) {
    return <div>Contrato não encontrado</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/contracts")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-secondary">Contrato #{contract.id}</h1>
              {getStatusBadge(contract.status)}
            </div>
            <p className="text-muted-foreground">{contract.packageName}</p>
          </div>
        </div>
        {contract.status === 'active' && contract.remainingSessions > 0 && (
          <Button 
            onClick={handleAddSession} 
            disabled={addSessionMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {addSessionMutation.isPending ? (
              <span className="flex items-center gap-2">Registrando...</span>
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Registrar Sessão (Restam {contract.remainingSessions})
              </span>
            )}
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 border-sidebar-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" /> Detalhes do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <User className="h-4 w-4" /> Cliente
              </p>
              <p className="text-sm font-medium">{contract.clientName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Stethoscope className="h-4 w-4" /> Profissional Responsável
              </p>
              <p className="text-sm">{contract.professionalName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <FileText className="h-4 w-4" /> Pacote
              </p>
              <p className="text-sm">{contract.packageName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Data da Compra
              </p>
              <p className="text-sm">{format(new Date(contract.createdAt), "dd/MM/yyyy")}</p>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-2">Progresso do Tratamento</p>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-primary">{contract.usedSessions} realizadas</span>
                <span>{contract.totalSessions} total</span>
              </div>
              <div className="w-full bg-secondary/20 rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(contract.usedSessions / contract.totalSessions) * 100}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 border-sidebar-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" /> Histórico de Sessões
            </CardTitle>
            <CardDescription>Registro de todas as sessões realizadas neste contrato</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSessions ? (
              <div className="flex justify-center p-4"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
            ) : sessions && sessions.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {sessions.map((session, i) => (
                  <div key={session.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <span className="text-sm font-bold">{i + 1}</span>
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] border bg-card p-4 rounded shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-secondary">Sessão {session.sessionNumber}</div>
                        <time className="text-xs text-muted-foreground">{format(new Date(session.performedAt), "dd/MM/yyyy HH:mm")}</time>
                      </div>
                      {session.notes && <div className="text-sm text-muted-foreground mt-2">{session.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center border-dashed border-2 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3 text-muted-foreground">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-secondary">Nenhuma sessão realizada</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Este contrato ainda não possui registro de sessões. Clique em "Registrar Sessão" para iniciar o tratamento.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
