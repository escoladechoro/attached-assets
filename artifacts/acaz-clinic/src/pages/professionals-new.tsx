import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateProfessional, getListProfessionalsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";

const professionalSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  cpf: z.string().optional(),
  clinicSharePercent: z.coerce.number().min(0).max(100).default(30),
  professionalSharePercent: z.coerce.number().min(0).max(100).default(70),
});

type ProfessionalForm = z.infer<typeof professionalSchema>;

export default function NewProfessional() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateProfessional();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfessionalForm>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      clinicSharePercent: 30,
      professionalSharePercent: 70
    }
  });

  const onSubmit = (data: ProfessionalForm) => {
    createMutation.mutate(
      { data },
      {
        onSuccess: (newProf) => {
          toast({ title: "Profissional cadastrado com sucesso!" });
          queryClient.invalidateQueries({ queryKey: getListProfessionalsQueryKey() });
          setLocation(`/professionals/${newProf.id}`);
        },
        onError: () => {
          toast({
            title: "Erro ao cadastrar",
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
          <Button variant="ghost" size="icon" onClick={() => setLocation("/professionals")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary">Novo Profissional</h1>
            <p className="text-muted-foreground">Cadastre um membro da equipe.</p>
          </div>
        </div>
      </div>

      <Card className="border-sidebar-border bg-card">
        <CardHeader>
          <CardTitle>Dados do Profissional</CardTitle>
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
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register("email")} className={errors.email ? "border-destructive" : ""} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" {...register("cpf")} placeholder="000.000.000-00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input id="phone" {...register("phone")} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="specialty">Especialidade / Cargo</Label>
                <Input id="specialty" {...register("specialty")} placeholder="Biomédico, Esteticista, etc." />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Repasses Financeiros (%)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinicSharePercent">Parte da Clínica (%)</Label>
                  <Input id="clinicSharePercent" type="number" {...register("clinicSharePercent")} />
                  {errors.clinicSharePercent && <p className="text-xs text-destructive">{errors.clinicSharePercent.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="professionalSharePercent">Parte do Profissional (%)</Label>
                  <Input id="professionalSharePercent" type="number" {...register("professionalSharePercent")} />
                  {errors.professionalSharePercent && <p className="text-xs text-destructive">{errors.professionalSharePercent.message}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setLocation("/professionals")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting || createMutation.isPending ? "Salvando..." : "Salvar Profissional"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
