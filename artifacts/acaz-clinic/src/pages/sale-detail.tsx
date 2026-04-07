import { useParams, useLocation } from "wouter";
import { useGetSale } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, CircleDollarSign, User, Stethoscope, BriefcaseMedical, Landmark, Percent } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";

export default function SaleDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const id = parseInt(params.id || "0", 10);

  const { data: sale, isLoading } = useGetSale(id, {
    query: { enabled: !!id }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (!sale) {
    return <div>Venda não encontrada</div>;
  }

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'pix': return 'PIX';
      case 'credit': return 'Cartão de Crédito';
      case 'debit': return 'Cartão de Débito';
      case 'cash': return 'Dinheiro';
      default: return method;
    }
  };

  const getGatewayFeePercentage = (method: string) => {
    switch (method) {
      case 'credit': return '3.5%';
      case 'debit': return '2.0%';
      default: return '0%';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/sales")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary">Detalhes da Venda #{sale.id}</h1>
          <p className="text-muted-foreground">
            {format(new Date(sale.createdAt), "dd 'de' MMMM 'de' yyyy, 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-sidebar-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BriefcaseMedical className="h-5 w-5 text-primary" /> Informações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1 mb-1">
                  <User className="h-4 w-4" /> Cliente
                </p>
                <p className="font-medium text-secondary">{sale.clientName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1 mb-1">
                  <Stethoscope className="h-4 w-4" /> Profissional
                </p>
                <p className="font-medium text-secondary">{sale.professionalName}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Item Vendido</p>
              <div className="p-3 bg-muted/30 rounded-md border">
                <div className="flex justify-between items-start">
                  <div>
                    {sale.packageName ? (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary mb-1">Pacote</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-secondary/10 text-secondary mb-1">Serviço</span>
                    )}
                    <p className="font-medium">{sale.packageName || sale.serviceName}</p>
                  </div>
                  <p className="font-bold text-secondary">{formatCurrency(sale.grossAmount)}</p>
                </div>
              </div>
            </div>

            {sale.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Observações</p>
                <p className="text-sm p-3 bg-muted/10 border rounded-md">{sale.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CircleDollarSign className="h-5 w-5 text-primary" /> Breakdown Financeiro
            </CardTitle>
            <CardDescription>Detalhamento de taxas e repasses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Forma de Pagamento</span>
                <span className="font-medium bg-muted px-2 py-1 rounded-md text-sm">{getPaymentLabel(sale.paymentMethod)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-secondary">Valor Bruto</span>
                <span className="font-bold text-secondary text-lg">{formatCurrency(sale.grossAmount)}</span>
              </div>

              <div className="flex justify-between items-center py-2 text-destructive border-b border-dashed pb-4">
                <span className="flex items-center gap-1">
                  Taxa Gateway <span className="text-xs px-1.5 py-0.5 bg-destructive/10 rounded">{getGatewayFeePercentage(sale.paymentMethod)}</span>
                </span>
                <span>- {formatCurrency(sale.gateFee)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-secondary">Valor Líquido</span>
                <span className="font-bold text-primary text-lg">{formatCurrency(sale.netAmount)}</span>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg border mt-4 space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <Landmark className="h-4 w-4" /> Divisão do Líquido
                </h4>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-sm">Clínica (30%)</span>
                  </div>
                  <span className="font-bold">{formatCurrency(sale.clinicAmount)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-secondary"></div>
                    <span className="text-sm">Profissional (70%)</span>
                  </div>
                  <span className="font-bold">{formatCurrency(sale.professionalAmount)}</span>
                </div>

                <div className="w-full flex h-2 rounded-full overflow-hidden mt-2">
                  <div className="bg-primary h-full" style={{ width: '30%' }}></div>
                  <div className="bg-secondary h-full" style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
