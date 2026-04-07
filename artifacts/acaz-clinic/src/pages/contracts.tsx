import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListContracts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, User, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function Contracts() {
  const [, setLocation] = useLocation();

  const { data: contractsData, isLoading } = useListContracts();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="default" className="bg-green-500">Ativo</Badge>;
      case 'completed': return <Badge variant="secondary">Concluído</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary">Contratos</h1>
          <p className="text-muted-foreground">Acompanhe pacotes e sessões dos clientes.</p>
        </div>
        <Button onClick={() => setLocation("/contracts/new")} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Novo Contrato
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
                    <TableHead>Pacote</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractsData?.data && contractsData.data.length > 0 ? (
                    contractsData.data.map((contract) => (
                      <TableRow key={contract.id} className="hover:bg-muted/30">
                        <TableCell className="text-muted-foreground text-sm">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {format(new Date(contract.createdAt), "dd/MM/yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-secondary">
                          <div className="flex items-center gap-1.5">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {contract.clientName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-primary" />
                            {contract.packageName}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {contract.professionalName}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 w-[120px]">
                            <div className="flex justify-between text-xs">
                              <span>{contract.usedSessions}/{contract.totalSessions} sessões</span>
                            </div>
                            <div className="w-full bg-secondary/20 rounded-full h-1.5">
                              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(contract.usedSessions / contract.totalSessions) * 100}%` }}></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(contract.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/contracts/${contract.id}`}>
                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                              Gerenciar
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Nenhum contrato encontrado.
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
