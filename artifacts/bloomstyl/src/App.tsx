import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "./components/Header";
import { UploadPage } from "./pages/UploadPage";
import { DetectPage } from "./pages/DetectPage";
import { SettingsPage } from "./pages/SettingsPage";
import { Result } from "./pages/Result";
import { PromptPage } from "./pages/PromptPage";
import { LayoutPickerPage } from "./pages/LayoutPickerPage";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={UploadPage} />
      <Route path="/prompt" component={PromptPage} />
      <Route path="/pick-layout" component={LayoutPickerPage} />
      <Route path="/detect" component={DetectPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/result" component={Result} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1">
              <Router />
            </main>
          </div>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
