(() => {
  const DAY_MS = 86400000;
  const LOOKBACK_DAYS = 30;
  const TARGET_COVER_DAYS = 14;
  const CRITICAL_DAYS = 3;
  const SOON_DAYS = 7;
  const MONITOR_DAYS = 14;

  const money = value => typeof formatCurrency === "function"
    ? formatCurrency(Number(value || 0))
    : `KSh ${Number(value || 0).toFixed(2)}`;

  const number = value => Number(value || 0);
  const safeDate = value => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const productKey = item => String(item.productId || item.id || item.name || "").trim();
  const productLookupKeys = product => [String(product.id || "").trim(), String(product.name || "").trim()].filter(Boolean);
  const empty = text => `<div class="empty-state">${text}</div>`;
  const row = (label, value, detail = "") => `<div class="sales-row dashboard-row"><div><strong>${label}</strong>${detail ? `<small>${detail}</small>` : ""}</div><span>${value}</span></div>`;
  const setHTML = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

  function getData() {
    const state = typeof loadState === "function" ? loadState() : { inventory: [], sales: [] };
    return { inventory: state.inventory || [], sales: state.sales || [] };
  }

  function buildProductStats(inventory, sales) {
    const now = Date.now();
    const currentStart = now - LOOKBACK_DAYS * DAY_MS;
    const previousStart = now - LOOKBACK_DAYS * 2 * DAY_MS;
    const stats = new Map();

    inventory.forEach(product => {
      const record = {
        product,
        name: product.name || "Unnamed product",
        stock: number(product.stock),
        cost: number(product.cost),
        price: number(product.sellingPrice ?? product.price),
        category: product.category || "Uncategorized",
        inventoryValue: number(product.stock) * number(product.cost),
        qty: 0,
        revenue: 0,
        profit: 0,
        currentQty: 0,
        previousQty: 0,
        lastSale: null
      };
      productLookupKeys(product).forEach(key => stats.set(key, record));
    });

    sales.forEach(sale => {
      const date = safeDate(sale.date || sale.created_at || sale.sale_date);
      if (!date) return;
      (sale.items || []).forEach(item => {
        const rec = stats.get(productKey(item)) || stats.get(String(item.name || "").trim());
        if (!rec) return;
        const qty = number(item.quantity);
        const itemRevenue = number(item.total) || number(item.price) * qty;
        const itemCost = number(item.cost || rec.cost) * qty;
        rec.qty += qty;
        rec.revenue += itemRevenue;
        rec.profit += itemRevenue - itemCost;
        if (!rec.lastSale || date > rec.lastSale) rec.lastSale = date;
        if (date.getTime() >= currentStart) rec.currentQty += qty;
        else if (date.getTime() >= previousStart) rec.previousQty += qty;
      });
    });

    return [...new Set(stats.values())];
  }

  function renderRestock(stats) {
    const recommendations = stats
      .filter(x => x.currentQty > 0)
      .map(x => {
        const dailyRate = x.currentQty / LOOKBACK_DAYS;
        const daysLeft = dailyRate > 0 ? x.stock / dailyRate : Infinity;
        const recommended = Math.max(0, Math.ceil(dailyRate * TARGET_COVER_DAYS - x.stock));
        const priority = daysLeft <= CRITICAL_DAYS ? "Critical" : daysLeft <= SOON_DAYS ? "Soon" : daysLeft <= MONITOR_DAYS ? "Monitor" : "OK";
        return { ...x, dailyRate, daysLeft, recommended, priority };
      })
      .filter(x => x.daysLeft <= MONITOR_DAYS || x.stock <= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 12);

    if (!recommendations.length) return setHTML("dash-restock", empty("No urgent restocking recommendations right now."));
    setHTML("dash-restock", `<div class="restock-table"><div class="restock-head"><span>Product</span><span>Stock</span><span>Daily rate</span><span>Days left</span><span>Buy</span></div>${recommendations.map(x => `<div class="restock-line priority-${x.priority.toLowerCase()}"><div><strong>${x.name}</strong><small>${x.priority}</small></div><span>${x.stock.toFixed(2)}</span><span>${x.dailyRate.toFixed(2)}</span><span>${Number.isFinite(x.daysLeft) ? Math.max(0, x.daysLeft).toFixed(1) : "—"}</span><span><strong>${x.recommended}</strong></span></div>`).join("")}</div>`);
  }

  function renderInventory(stats) {
    const positive = stats.filter(x => x.stock > 0);
    const high = [...positive].sort((a,b) => b.inventoryValue - a.inventoryValue).slice(0, 5);
    const low = [...positive].sort((a,b) => a.inventoryValue - b.inventoryValue).slice(0, 5);
    setHTML("dash-high-value", high.length ? high.map(x => row(x.name, money(x.inventoryValue), `${x.stock} units × ${money(x.cost)}`)).join("") : empty("No stocked products."));
    setHTML("dash-low-value", low.length ? low.map(x => row(x.name, money(x.inventoryValue), `${x.stock} units × ${money(x.cost)}`)).join("") : empty("No stocked products."));

    const categories = {};
    stats.forEach(x => { categories[x.category] = (categories[x.category] || 0) + x.inventoryValue; });
    const categoryRows = Object.entries(categories).sort((a,b) => b[1]-a[1]);
    setHTML("dash-categories", categoryRows.length ? categoryRows.map(([name,value]) => row(name, money(value))).join("") : empty("No inventory data."));

    const slow = stats.filter(x => x.qty > 0).sort((a,b) => a.currentQty - b.currentQty || a.qty - b.qty).slice(0, 8);
    setHTML("dash-slow", slow.length ? slow.map(x => row(x.name, `${x.currentQty} sold`, `Last ${LOOKBACK_DAYS} days · ${x.stock} in stock`)).join("") : empty("Not enough sales history."));

    const cutoff = Date.now() - 30 * DAY_MS;
    const dead = stats.filter(x => x.stock > 0 && (!x.lastSale || x.lastSale.getTime() < cutoff)).sort((a,b) => b.inventoryValue-a.inventoryValue).slice(0, 8);
    setHTML("dash-dead", dead.length ? dead.map(x => row(x.name, money(x.inventoryValue), x.lastSale ? `Last sold ${x.lastSale.toLocaleDateString()}` : "Never sold" )).join("") : empty("No dead stock detected."));
  }

  function renderSalesIntelligence(stats) {
    const sold = stats.filter(x => x.qty > 0);
    setHTML("dash-best", sold.length ? [...sold].sort((a,b)=>b.qty-a.qty).slice(0,8).map(x=>row(x.name, `${x.qty} sold`)).join("") : empty("Not enough sales data."));
    const worst = stats.filter(x => x.stock > 0).sort((a,b)=>a.qty-b.qty).slice(0,8);
    setHTML("dash-worst", worst.length ? worst.map(x=>row(x.name, `${x.qty} sold`, `${x.stock} in stock`)).join("") : empty("No product data."));
    setHTML("dash-revenue-products", sold.length ? [...sold].sort((a,b)=>b.revenue-a.revenue).slice(0,8).map(x=>row(x.name,money(x.revenue),`${x.qty} units sold`)).join("") : empty("Not enough sales data."));
    setHTML("dash-profit-products", sold.length ? [...sold].sort((a,b)=>b.profit-a.profit).slice(0,8).map(x=>row(x.name,money(x.profit),`${x.qty} units sold`)).join("") : empty("Not enough sales data."));

    const trend = stats.filter(x => x.currentQty > 0 || x.previousQty > 0).map(x => ({...x, change: x.previousQty === 0 ? (x.currentQty > 0 ? 100 : 0) : ((x.currentQty-x.previousQty)/x.previousQty)*100}));
    const growing = trend.filter(x=>x.change>0).sort((a,b)=>b.change-a.change).slice(0,8);
    const declining = trend.filter(x=>x.change<0).sort((a,b)=>a.change-b.change).slice(0,8);
    setHTML("dash-growing", growing.length ? growing.map(x=>row(x.name,`+${x.change.toFixed(0)}%`,`${x.previousQty} → ${x.currentQty} units`)).join("") : empty("No growing products detected yet."));
    setHTML("dash-declining", declining.length ? declining.map(x=>row(x.name,`${x.change.toFixed(0)}%`,`${x.previousQty} → ${x.currentQty} units`)).join("") : empty("No declining products detected yet."));
  }

  function renderPatterns(sales) {
    const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const days = {}, weeks = {}, months = {}, hours = {}, heat = {};
    sales.forEach(sale => {
      const d = safeDate(sale.date || sale.created_at || sale.sale_date); if (!d) return;
      const value = number(sale.total);
      const day = dayNames[d.getDay()];
      const week = `Week ${Math.ceil(d.getDate()/7)}`;
      const month = d.toLocaleDateString(undefined,{year:"numeric",month:"long"});
      const hour = d.getHours();
      const hourLabel = `${String(hour).padStart(2,"0")}:00–${String((hour+1)%24).padStart(2,"0")}:00`;
      days[day]=(days[day]||0)+value; weeks[week]=(weeks[week]||0)+value; months[month]=(months[month]||0)+value; hours[hourLabel]=(hours[hourLabel]||0)+value;
      heat[`${d.getDay()}-${hour}`]=(heat[`${d.getDay()}-${hour}`]||0)+value;
    });
    const renderRank = (id,obj,limit=8) => { const entries=Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,limit); setHTML(id,entries.length?entries.map(([n,v])=>row(n,money(v))).join(""):empty("Not enough sales history.")); };
    renderRank("dash-days",days,7); renderRank("dash-weeks",weeks,5); renderRank("dash-months",months,12); renderRank("dash-hours",hours,10);

    const max = Math.max(0,...Object.values(heat));
    if (!max) return setHTML("dash-heatmap",empty("Not enough sales history."));
    const activeHours = [...new Set(Object.keys(heat).map(k=>Number(k.split("-")[1])))].sort((a,b)=>a-b);
    let html = `<table class="sales-heatmap"><thead><tr><th>Day</th>${activeHours.map(h=>`<th>${String(h).padStart(2,"0")}:00</th>`).join("")}</tr></thead><tbody>`;
    [1,2,3,4,5,6,0].forEach(dayIndex => {
      html += `<tr><th>${dayNames[dayIndex].slice(0,3)}</th>${activeHours.map(hour=>{const v=heat[`${dayIndex}-${hour}`]||0;const level=v===0?0:Math.max(1,Math.ceil(v/max*5));return `<td class="heat-level-${level}" title="${dayNames[dayIndex]} ${hour}:00 — ${money(v)}">${v?money(v).replace("KSh ",""):"—"}</td>`;}).join("")}</tr>`;
    });
    html += `</tbody></table>`;
    setHTML("dash-heatmap",html);
  }

  function render() {
    const { inventory, sales } = getData();
    const stats = buildProductStats(inventory, sales);
    renderRestock(stats);
    renderInventory(stats);
    renderSalesIntelligence(stats);
    renderPatterns(sales);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      if (typeof syncCloudProductsToPOS === "function") await syncCloudProductsToPOS();
      if (typeof syncCloudSalesToPOS === "function") await syncCloudSalesToPOS();
    } catch (error) {
      console.error("Dashboard cloud sync failed:", error);
    }
    render();
  });
})();
