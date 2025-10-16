import { Link } from "react-router-dom";

function Orders() {
  return (
    <div style={{ maxWidth: "880px", margin: "40px auto", padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>My Orders</h2>
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
          <h3 style={{ marginTop: 0 }}>Recent Orders</h3>
          <p>View your recent order history and status.</p>
          <button style={{ padding: "8px 16px", marginTop: "8px" }}>View Orders</button>
        </div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Order Tracking</h3>
          <p>Track the status of your current orders.</p>
          <button style={{ padding: "8px 16px", marginTop: "8px" }}>Track Orders</button>
        </div>
      </div>
    </div>
  );
}

export default Orders;
