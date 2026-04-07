import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListSales } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, CircleDollarSign, CalendarIcon, CreditCard, Banknote } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Sales() {
  const [, setLocation] = useLocation();

  const { data: salesData, isLoading } = useListSales({
    page: 1,
    limit: 50
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'pix': return <CircleDollarSign className="h-4 w-4 text-emerald-500" />;
      case 'credit': return <CreditCard className="h-4 w-4 text-blue-500" />;
      case 'debit': return <CreditCard className="h-4 w-4 text-indigo-500" />;
      case 'cash': return <Banknote className="h-4 w-4 text-green-600" />;
      default: return <CircleDollarSign className="h-4 w-4" />;
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'pix': return 'PIX';
      case 'credit': return 'Crédito';
      case 'debit': return 'Débito';
      case 'cash': return 'Dinheiro';
      default: return method;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary">Vendas</h1>
          <p className="text-muted-foreground">Histórico de transações e comissões.</p>
        </div>
        <Button onClick={() => setLocation("/sales/new")} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Nova Venda
        </Button>
      </div>

      <Card className="border-sidebar-border bg-card">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex h-[400px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Item Vendido</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Valor Bruto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData?.data && salesData.data.length > 0 ? (
                    salesData.data.map((sale) => (
                      <TableRow key={sale.id} className="hover:bg-muted/30">
                        <TableCell className="text-muted-foreground text-sm">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm")}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-secondary">
                          {sale.clientName}
                        </TableCell>
                        <TableCell>
                          {sale.packageName ? (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary mb-1">
                              Pacote
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium bg-secondary/10 text-secondary mb-1">
                              Serviço
                            </span>
                          )}
                          <div className="text-sm">{sale.packageName || sale.serviceName}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sale.professionalName}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            {getPaymentIcon(sale.paymentMethod)}
                            <span>{getPaymentLabel(sale.paymentMethod)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-secondary">
                          {formatCurrency(sale.grossAmount)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Nenhuma venda encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
