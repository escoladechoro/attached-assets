import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateContract, useListClients, useListProfessionals, useListPackages, getListContractsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const contractSchema = z.object({
  clientId: z.coerce.number().min(1, "Cliente é obrigatório"),
  professionalId: z.coerce.number().min(1, "Profissional é obrigatório"),
  packageId: z.coerce.number().min(1, "Pacote é obrigatório"),
  notes: z.string().optional(),
});

type ContractForm = z.infer<typeof contractSchema>;

export default function NewContract() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateContract();

  const { data: clients } = useListClients({ limit: 100 });
  const { data: professionals } = useListProfessionals();
  const { data: packages } = useListPackages();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContractForm>({
    resolver: zodResolver(contractSchema)
  });

  const onSubmit = (data: ContractForm) => {
    createMutation.mutate(
      { data },
      {
        onSuccess: (newContract) => {
          toast({ title: "Contrato gerado com sucesso!" });
          queryClient.invalidateQueries({ queryKey: getListContractsQueryKey() });
          setLocation(`/contracts/${newContract.id}`);
        },
        onError: () => {
          toast({
            title: "Erro ao gerar contrato",
            description: "Verifique os dados e tente novamente.",
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
          <Button variant="ghost" size="icon" onClick={() => setLocation("/contracts")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary">Novo Contrato</h1>
            <p className="text-muted-foreground">Inicie um pacote de tratamento para um cliente.</p>
          </div>
        </div>
      </div>

      <Card className="border-sidebar-border bg-card">
        <CardHeader>
          <CardTitle>Detalhes do Contrato</CardTitle>
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
                <Label>Profissional Responsável *</Label>
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

              <div className="space-y-2 md:col-span-2">
                <Label>Pacote de Tratamento *</Label>
                <Select onValueChange={(val) => setValue("packageId", parseInt(val, 10))}>
                  <SelectTrigger className={errors.packageId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecione o pacote" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages?.data.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name} ({p.totalSessions} sessões)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.packageId && <p className="text-xs text-destructive">{errors.packageId.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" {...register("notes")} rows={3} placeholder="Instruções adicionais para o tratamento..." />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setLocation("/contracts")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting || createMutation.isPending ? "Processando..." : "Gerar Contrato"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
