import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateSale, useListClients, useListProfessionals, useListServices, useListPackages, getListSalesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const saleSchema = z.object({
  clientId: z.coerce.number().min(1, "Cliente é obrigatório"),
  professionalId: z.coerce.number().min(1, "Profissional é obrigatório"),
  itemType: z.enum(["service", "package"]),
  itemId: z.coerce.number().min(1, "Item é obrigatório"),
  grossAmount: z.coerce.number().min(0.01, "Valor inválido"),
  paymentMethod: z.enum(["pix", "credit", "debit", "cash"]),
  notes: z.string().optional(),
});

type SaleForm = z.infer<typeof saleSchema>;

export default function NewSale() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateSale();

  const { data: clients } = useListClients({ limit: 100 });
  const { data: professionals } = useListProfessionals();
  const { data: services } = useListServices();
  const { data: packages } = useListPackages();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SaleForm>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      itemType: "service",
      paymentMethod: "pix"
    }
  });

  const watchItemType = watch("itemType");

  const onSubmit = (data: SaleForm) => {
    const payload = {
      clientId: data.clientId,
      professionalId: data.professionalId,
      grossAmount: data.grossAmount,
      paymentMethod: data.paymentMethod as "pix" | "credit" | "debit" | "cash",
      notes: data.notes,
      ...(data.itemType === "service" ? { serviceId: data.itemId } : { packageId: data.itemId })
    };

    createMutation.mutate(
      { data: payload },
      {
        onSuccess: (newSale) => {
          toast({ title: "Venda registrada com sucesso!" });
          queryClient.invalidateQueries({ queryKey: getListSalesQueryKey() });
          setLocation(`/sales/${newSale.id}`);
        },
        onError: () => {
          toast({
            title: "Erro ao registrar venda",
            description: "Verifique os dados e tente novamente.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleItemChange = (val: string) => {
    const id = parseInt(val, 10);
    setValue("itemId", id);
    
    if (watchItemType === "service") {
      const s = services?.data.find(x => x.id === id);
      if (s) setValue("grossAmount", s.price);
    } else {
      const p = packages?.data.find(x => x.id === id);
      if (p) setValue("grossAmount", p.price);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/sales")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary">Nova Venda</h1>
            <p className="text-muted-foreground">Registre uma nova transação no sistema.</p>
          </div>
        </div>
      </div>

      <Card className="border-sidebar-border bg-card">
        <CardHeader>
          <CardTitle>Detalhes da Transação</CardTitle>
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
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name} - {c.cpf || 'Sem CPF'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clientId && <p className="text-xs text-destructive">{errors.clientId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Profissional Executante *</Label>
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
                <Label>Tipo de Item</Label>
                <Select onValueChange={(val: "service" | "package") => setValue("itemType", val)} defaultValue={watchItemType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Serviço Avulso</SelectItem>
                    <SelectItem value="package">Pacote de Sessões</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Item Vendido *</Label>
                <Select onValueChange={handleItemChange}>
                  <SelectTrigger className={errors.itemId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecione o item" />
                  </SelectTrigger>
                  <SelectContent>
                    {watchItemType === "service" 
                      ? services?.data.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)
                      : packages?.data.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
                {errors.itemId && <p className="text-xs text-destructive">{errors.itemId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="grossAmount">Valor Bruto (R$) *</Label>
                <Input id="grossAmount" type="number" step="0.01" {...register("grossAmount")} className={errors.grossAmount ? "border-destructive" : ""} />
                {errors.grossAmount && <p className="text-xs text-destructive">{errors.grossAmount.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Forma de Pagamento *</Label>
                <Select onValueChange={(val) => setValue("paymentMethod", val as any)} defaultValue="pix">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX (0% tx)</SelectItem>
                    <SelectItem value="credit">Cartão de Crédito (3.5% tx)</SelectItem>
                    <SelectItem value="debit">Cartão de Débito (2.0% tx)</SelectItem>
                    <SelectItem value="cash">Dinheiro (0% tx)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" {...register("notes")} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setLocation("/sales")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting || createMutation.isPending ? "Processando..." : "Registrar Venda"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
