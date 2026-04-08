import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateClient, getListClientsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2, MapPin } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  cep: z.string().optional(),
  address: z.string().optional(),
  birthDate: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  notes: z.string().optional(),
});

type ClientForm = z.infer<typeof clientSchema>;

interface ViaCepResponse {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export default function NewClient() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateClient();
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFound, setCepFound] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
  });

  const cepValue = watch("cep");

  useEffect(() => {
    const digits = (cepValue ?? "").replace(/\D/g, "");
    if (digits.length !== 8) {
      setCepFound(null);
      return;
    }

    let cancelled = false;
    setCepLoading(true);
    setCepFound(null);

    fetch(`https://viacep.com.br/ws/${digits}/json/`)
      .then((r) => r.json())
      .then((data: ViaCepResponse) => {
        if (cancelled) return;
        if (data.erro) {
          setCepFound(false);
          setCepLoading(false);
          return;
        }
        const parts = [data.logradouro, data.bairro, `${data.localidade} - ${data.uf}`]
          .filter(Boolean)
          .join(", ");
        setValue("address", parts, { shouldValidate: true });
        setCepFound(true);
        setCepLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setCepFound(false);
          setCepLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cepValue, setValue]);

  const onSubmit = (data: ClientForm) => {
    createMutation.mutate(
      { data },
      {
        onSuccess: (newClient) => {
          toast({ title: "Cliente criado com sucesso!" });
          queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
          setLocation(`/clients/${newClient.id}`);
        },
        onError: () => {
          toast({
            title: "Erro ao criar cliente",
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
          <Button variant="ghost" size="icon" onClick={() => setLocation("/clients")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary">Novo Cliente</h1>
            <p className="text-muted-foreground">Cadastre um novo paciente no sistema.</p>
          </div>
        </div>
      </div>

      <Card className="border-sidebar-border bg-card">
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input id="name" {...register("name")} className={errors.name ? "border-destructive" : ""} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" {...register("cpf")} placeholder="000.000.000-00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} className={errors.email ? "border-destructive" : ""} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input id="phone" {...register("phone")} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input id="birthDate" type="date" {...register("birthDate")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                  <Input
                    id="cep"
                    {...register("cep")}
                    placeholder="00000-000"
                    className={
                      cepFound === false
                        ? "border-destructive pr-10"
                        : cepFound === true
                        ? "border-green-500 pr-10"
                        : "pr-10"
                    }
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {cepLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : cepFound === true ? (
                      <MapPin className="h-4 w-4 text-green-500" />
                    ) : cepFound === false ? (
                      <span className="text-xs text-destructive">não encontrado</span>
                    ) : null}
                  </div>
                </div>
                {cepFound === false && (
                  <p className="text-xs text-destructive">CEP não encontrado. Preencha o endereço manualmente.</p>
                )}
                {cepFound === true && (
                  <p className="text-xs text-green-600">Endereço preenchido automaticamente.</p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input id="address" {...register("address")} placeholder="Rua, Bairro, Cidade - UF" />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Contato de Emergência</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Nome do Contato</Label>
                  <Input id="emergencyContact" {...register("emergencyContact")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Telefone do Contato</Label>
                  <Input id="emergencyPhone" {...register("emergencyPhone")} />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Observações Clínicas</h3>
              <div className="space-y-2">
                <Label htmlFor="notes">Alergias, condições pré-existentes, etc.</Label>
                <Textarea id="notes" {...register("notes")} rows={4} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setLocation("/clients")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting || createMutation.isPending ? "Salvando..." : "Salvar Cliente"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
