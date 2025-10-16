import { Link } from "react-router-dom";

function Products() {
  return (
    <div style={{ maxWidth: "880px", margin: "40px auto", padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Products</h2>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link to="/dashboard" style={{ textDecoration: "none" }}>Dashboard</Link>
          <Link to="/" style={{ textDecoration: "none" }} onClick={async (e) => {
            e.preventDefault();
            try { await fetch("http://localhost:5000/logout", { method: "POST", credentials: "include" }); } catch {}
            window.location.href = "/";
          }}>Logout</Link>
        </nav>
      </header>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 16,
      }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Browse Products</h3>
          <p>Explore our catalog of available products.</p>
          <button style={{ padding: "8px 16px", marginTop: "8px" }}>Browse</button>
        </div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Favorites</h3>
          <p>View your saved favorite products.</p>
          <button style={{ padding: "8px 16px", marginTop: "8px" }}>View Favorites</button>
        </div>
      </div>
    </div>
  );
}

export default Products;
