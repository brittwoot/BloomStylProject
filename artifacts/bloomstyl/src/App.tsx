import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "./components/Header";
import { UploadPage } from "./pages/UploadPage";
import { DetectPage } from "./pages/DetectPage";
import { SettingsPage } from "./pages/SettingsPage";
import { Result } from "./pages/Result";
import { QuickGenPage } from "./pages/QuickGenPage";
import { LayoutPickerPage } from "./pages/LayoutPickerPage";
import { ActivitySuggestionPage } from "./pages/ActivitySuggestionPage";
import { WorksheetTypeBrowserPage } from "./pages/WorksheetTypeBrowserPage";
import { CustomizePage } from "./pages/CustomizePage";
import CanvasEditor from "./pages/CanvasEditor";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

function AppLayout() {
  const [location] = useLocation();
  const isCanvas = location === "/canvas";

  if (isCanvas) {
    return (
      <Switch>
        <Route path="/canvas" component={CanvasEditor} />
      </Switch>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Switch>
          {/* Document upload flow */}
          <Route path="/" component={UploadPage} />
          <Route path="/detect" component={DetectPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/result" component={Result} />

          {/* AI prompt flow */}
          <Route path="/prompt" component={QuickGenPage} />
          <Route path="/suggest" component={ActivitySuggestionPage} />
          <Route path="/types" component={WorksheetTypeBrowserPage} />
          <Route path="/customize" component={CustomizePage} />

          {/* Legacy */}
          <Route path="/pick-layout" component={LayoutPickerPage} />

          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppLayout />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
