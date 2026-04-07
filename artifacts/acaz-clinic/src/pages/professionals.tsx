import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListProfessionals } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Stethoscope, Phone, Mail, CheckCircle2, XCircle } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function Professionals() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: professionalsData, isLoading } = useListProfessionals({
    search: debouncedSearch
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary">Profissionais</h1>
          <p className="text-muted-foreground">Gerencie a equipe e repasses.</p>
        </div>
        <Button onClick={() => setLocation("/professionals/new")} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Novo Profissional
        </Button>
      </div>

      <Card className="border-sidebar-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar profissional..."
                className="pl-8 bg-background border-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[400px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Especialidade</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Repasse</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {professionalsData?.data && professionalsData.data.length > 0 ? (
                    professionalsData.data.map((prof) => (
                      <TableRow key={prof.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-muted-foreground" />
                            {prof.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{prof.specialty || '-'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                            {prof.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {prof.phone}</span>}
                            {prof.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {prof.email}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-primary font-medium">{prof.professionalSharePercent}%</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-muted-foreground">{prof.clinicSharePercent}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {prof.active ? (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                              <CheckCircle2 className="h-4 w-4" /> Ativo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground text-sm">
                              <XCircle className="h-4 w-4" /> Inativo
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/professionals/${prof.id}`}>
                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                              Gerenciar
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Nenhum profissional encontrado.
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
