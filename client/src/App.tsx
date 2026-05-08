/*
 * Sciverse · Editorial Lab — App Routes
 * Style: warm off-white #FAFAF7, hairline #ECECE7, brand indigo #5B5BF7,
 * Fraunces (display/numerals) + Inter (UI) + JetBrains Mono (code)
 * Motion: 200-280ms cubic-bezier(0.2, 0.8, 0.2, 1)
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Experience from "./pages/Experience";
import Docs from "./pages/Docs";
import Tokens from "./pages/Tokens";
import Stats from "./pages/Stats";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Experience} />
      <Route path={"/experience"} component={Experience} />
      <Route path={"/docs"} component={Docs} />
      <Route path={"/tokens"} component={Tokens} />
      <Route path={"/stats"} component={Stats} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider delayDuration={120}>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                borderRadius: 999,
                border: "1px solid #ECECE7",
                background: "#fff",
                color: "#1a1a1a",
                fontSize: 13,
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
