import { BrowserRouter as Router } from "react-router-dom";
import { RouteGenerator } from "./utils/routeGenerator";
import { allRoutes } from "./config/routes";
import { NavigationProvider } from "./contexts/NavigationContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import NotificationContainer from "./components/NotificationContainer";
import { useEffect } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  useEffect(() => {
    (window as any).appNavigate = (path: string) => {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    };
  }, []);
  return (
    <ThemeProvider>
      <NotificationProvider>
        <NavigationProvider>
          <Router>
            <RouteGenerator routes={allRoutes} />
            <NotificationContainer />
          </Router>
        </NavigationProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
