import { BrowserRouter as Router } from "react-router-dom";
import { RouteGenerator } from "./utils/routeGenerator";
import { allRoutes } from "./config/routes";
import { NavigationProvider } from "./contexts/NavigationContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import NotificationContainer from "./components/NotificationContainer";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    (window as any).appNavigate = (path: string) => {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    };
  }, []);
  return (
    <NotificationProvider>
      <NavigationProvider>
        <Router>
          <RouteGenerator routes={allRoutes} />
          <NotificationContainer />
        </Router>
      </NavigationProvider>
    </NotificationProvider>
  );
}

export default App;
