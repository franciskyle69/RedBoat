import { BrowserRouter as Router } from "react-router-dom";
import { RouteGenerator } from "./utils/routeGenerator";
import { allRoutes } from "./config/routes";
import { NavigationProvider } from "./contexts/NavigationContext";

function App() {
  return (
    <NavigationProvider>
      <Router>
        <RouteGenerator routes={allRoutes} />
      </Router>
    </NavigationProvider>
  );
}

export default App;
