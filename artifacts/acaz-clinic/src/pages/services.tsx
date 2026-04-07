import { useState } from "react";
import { useListServices, useListPackages } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, BriefcaseMedical, Clock, CircleDollarSign, Layers } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks/use-debounce";

export default function Services() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: servicesData, isLoading: loadingServices } = useListServices({
    search: debouncedSearch
  });

  const { data: packagesData, isLoading: loadingPackages } = useListPackages();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary">Serviços e Pacotes</h1>
          <p className="text-muted-foreground">Catálogo de procedimentos da clínica.</p>
        </div>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <BriefcaseMedical className="h-4 w-4" /> Serviços Avulsos
            </TabsTrigger>
            <TabsTrigger value="packages" className="flex items-center gap-2">
              <Layers className="h-4 w-4" /> Pacotes
            </TabsTrigger>
          </TabsList>
          
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Novo Item
          </Button>
        </div>

        <TabsContent value="services">
          <Card className="border-sidebar-border bg-card">
            <CardHeader className="pb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar serviço..."
                  className="pl-8 bg-background border-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {loadingServices ? (
                <div className="flex h-[300px] items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="rounded-md border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Nome do Serviço</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Duração</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {servicesData?.data && servicesData.data.length > 0 ? (
                        servicesData.data.map((service) => (
                          <TableRow key={service.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{service.name}</span>
                                {service.description && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[250px]">
                                    {service.description}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {service.category || '-'}
                            </TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" /> {service.durationMinutes} min
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-medium text-secondary">
                              {formatCurrency(service.price)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                                Editar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            Nenhum serviço encontrado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages">
          <Card className="border-sidebar-border bg-card">
            <CardContent className="pt-6">
              {loadingPackages ? (
                <div className="flex h-[300px] items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="rounded-md border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Nome do Pacote</TableHead>
                        <TableHead>Serviço Base</TableHead>
                        <TableHead>Sessões</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packagesData?.data && packagesData.data.length > 0 ? (
                        packagesData.data.map((pkg) => (
                          <TableRow key={pkg.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-primary" />
                                {pkg.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {pkg.serviceName}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                {pkg.totalSessions} sessões
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-medium text-secondary">
                              {formatCurrency(pkg.price)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                                Editar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            Nenhum pacote encontrado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
