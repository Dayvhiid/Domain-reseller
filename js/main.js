import { API } from './api-client.js';

// Make API globally available for backwards compatibility
window.MockAPI = API;
window.API = API;

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initUI();
  initDomainSearch();
  initSearchResults();
  Cart.updateBadge();
  
  // pricing page filter hook if present
  if (document.getElementById("pricing-table")) initPricing();
  if (document.getElementById("whois-root")) initWhois();
  if (document.getElementById("cart-root")) initCart();
  if (document.getElementById("transfer-form")) initTransfer();

  // Scroll reveal animations
  initReveal();
});

function initReveal() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

async function initPricing() {
  const search = document.getElementById("pricing-search");
  const filter = document.getElementById("pricing-category");
  const tbody = document.getElementById("pricing-tbody");
  if (!tbody) return;
  
  let data = [];
  
  try {
    data = await API.getPricing();
  } catch (err) {
    console.error('Failed to load pricing:', err);
    window.toast("Failed to load pricing data", "error");
    return;
  }
  
  function render() {
    const q = (search?.value || "").toLowerCase();
    const cat = filter?.value || "All";
    const filtered = data.filter(r => (cat === "All" || r.category === cat) && r.tld.toLowerCase().includes(q));
    
    tbody.innerHTML = filtered.map(r => `
      <tr class="border-t border-separator hover:bg-secondary-system-background">
        <td class="py-3 px-4 font-mono font-medium">${r.tld}</td>
        <td class="py-3 px-4">${formatPrice(r.registration)}</td>
        <td class="py-3 px-4">${formatPrice(r.renewal)}</td>
        <td class="py-3 px-4">${formatPrice(r.transfer)}</td>
        <td class="py-3 px-4"><span class="badge badge-neutral text-xs">${r.category}</span></td>
        <td class="py-3 px-4"><a href="search-results.html?domain=example${r.tld}" class="text-brand-500 hover:underline text-sm font-medium">Check</a></td>
      </tr>
    `).join("") || `<tr><td colspan="6" class="py-8 text-center text-tertiary-label">No extensions match your filter.</td></tr>`;
    
    document.getElementById("pricing-count").textContent = `${filtered.length} extensions`;
  }
  
  search?.addEventListener("input", render);
  filter?.addEventListener("change", render);
}

async function initWhois() {
  const form = document.getElementById("whois-form");
  const input = document.getElementById("whois-input");
  const out = document.getElementById("whois-result");
  const loading = document.getElementById("whois-loading");
  
  form?.addEventListener("submit", async e => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v) { window.toast("Enter a domain", "error"); return; }
    
    loading.hidden = false;
    out.innerHTML = "";
    
    try {
      const res = await API.whoisLookup(v);
      
      if (res.available) {
        out.innerHTML = `<div class="card p-6 text-center">
          <div class="badge badge-success mb-3">Available</div>
          <p class="font-medium">${res.domain} is available!</p>
          <a href="search-results.html?domain=${encodeURIComponent(res.domain)}" class="btn btn-primary mt-4">Register now</a>
        </div>`;
      } else {
        out.innerHTML = `<div class="card p-6">
          <div class="flex items-center gap-2 mb-4">
            <span class="badge badge-danger">Registered</span>
            <span class="font-mono font-medium">${res.domain}</span>
          </div>
          <dl class="grid sm:grid-cols-2 gap-4 text-subheadline">
            <div><dt class="text-tertiary-label">Registrar</dt><dd class="font-medium">${res.registrar}</dd></div>
            <div><dt class="text-tertiary-label">Created</dt><dd class="font-medium">${res.created}</dd></div>
            <div><dt class="text-tertiary-label">Expires</dt><dd class="font-medium">${res.expires}</dd></div>
            <div><dt class="text-tertiary-label">Privacy</dt><dd class="font-medium">${res.privacy ? "Enabled (redacted)" : "Disabled"}</dd></div>
          </dl>
          <p class="text-caption-1 text-quaternary-label mt-4">WHOIS data is shown with privacy — personal data redacted.</p>
        </div>`;
      }
    } catch (err) {
      out.innerHTML = `<div class="card p-6 border-danger/20 bg-danger/5 text-danger text-sm">${err.message}</div>`;
    } finally {
      loading.hidden = true;
    }
  });
}

function initCart() {
  const root = document.getElementById("cart-root");
  const emptyEl = document.getElementById("cart-empty");
  const listEl = document.getElementById("cart-list");
  const summaryEl = document.getElementById("cart-summary");
  
  function render() {
    const items = Cart.load();
    if (items.length === 0) {
      listEl.innerHTML = "";
      summaryEl.hidden = true;
      emptyEl.hidden = false;
      return;
    }
    
    emptyEl.hidden = true;
    summaryEl.hidden = false;
    
    listEl.innerHTML = items.map(it => `
      <div class="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div class="flex-1 min-w-0">
          <div class="font-semibold truncate">${it.domain}</div>
          <div class="text-caption-1 text-secondary-label">${formatPrice(it.registration)}/yr · Renewal ${formatPrice(it.renewal)}/yr</div>
        </div>
        <label class="flex items-center gap-2 text-sm">Term
          <select data-cart-years="${it.id}" class="input w-28 py-2">
            ${[1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === it.years ? "selected" : ""}>${y} yr${y > 1 ? "s" : ""} — ${formatPrice(it.registration * y)}</option>`).join("")}
          </select>
        </label>
        <div class="font-semibold w-24 text-right">${formatPrice(it.registration * it.years)}</div>
        <button data-remove="${it.id}" class="btn btn-ghost text-danger hover:bg-danger/10">Remove</button>
      </div>
    `).join("");
    
    const subtotal = Cart.subtotal();
    const tax = 0; // placeholder
    
    document.getElementById("cart-subtotal").textContent = formatPrice(subtotal);
    document.getElementById("cart-tax").textContent = formatPrice(tax);
    document.getElementById("cart-total").textContent = formatPrice(subtotal + tax);
    
    listEl.querySelectorAll("[data-cart-years]").forEach(sel => {
      sel.addEventListener("change", () => {
        Cart.updateYears(sel.getAttribute("data-cart-years"), sel.value);
        render();
      });
    });
    
    listEl.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => {
        Cart.remove(btn.getAttribute("data-remove"));
        window.toast("Removed from cart.");
        render();
      });
    });
  }
  
  document.getElementById("cart-clear")?.addEventListener("click", () => {
    if (confirm("Clear cart?")) {
      Cart.clear();
      render();
    }
  });
  
  render();
}

function initTransfer() {
  const form = document.getElementById("transfer-form");
  form?.addEventListener("submit", async e => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    const btn = form.querySelector("button[type='submit']");
    btn.textContent = "Checking…";
    btn.disabled = true;
    
    try {
      // In a real implementation, this would call the transfer API
      // For now, show mock success
      await new Promise(r => setTimeout(r, 900));
      window.toast("Transfer eligibility checked. You will receive instructions by email.", "success");
    } catch (err) {
      window.toast(err.message, "error");
    } finally {
      btn.textContent = "Check transfer eligibility";
      btn.disabled = false;
    }
  });
}

function formatPrice(n) {
  return `$${Number(n).toFixed(2)}`;
}