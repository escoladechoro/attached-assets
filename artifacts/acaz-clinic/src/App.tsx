import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { AppLayout } from "@/components/layout/app-layout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import NewClient from "@/pages/clients-new";
import ClientDetail from "@/pages/client-detail";
import Professionals from "@/pages/professionals";
import NewProfessional from "@/pages/professionals-new";
import ProfessionalDetail from "@/pages/professional-detail";
import Services from "@/pages/services";
import Sales from "@/pages/sales";
import NewSale from "@/pages/sales-new";
import SaleDetail from "@/pages/sale-detail";
import Contracts from "@/pages/contracts";
import NewContract from "@/pages/contracts-new";
import ContractDetail from "@/pages/contract-detail";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Agenda from "@/pages/agenda";
import NewAgenda from "@/pages/agenda-new";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/agenda" component={Agenda} />
        <Route path="/agenda/new" component={NewAgenda} />
        <Route path="/clients" component={Clients} />
        <Route path="/clients/new" component={NewClient} />
        <Route path="/clients/:id" component={ClientDetail} />
        <Route path="/professionals" component={Professionals} />
        <Route path="/professionals/new" component={NewProfessional} />
        <Route path="/professionals/:id" component={ProfessionalDetail} />
        <Route path="/services" component={Services} />
        <Route path="/sales" component={Sales} />
        <Route path="/sales/new" component={NewSale} />
        <Route path="/sales/:id" component={SaleDetail} />
        <Route path="/contracts" component={Contracts} />
        <Route path="/contracts/new" component={NewContract} />
        <Route path="/contracts/:id" component={ContractDetail} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route path="/" component={() => {
           window.location.href = '/dashboard';
           return null;
        }} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
