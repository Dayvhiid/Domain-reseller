import { API } from './api-client.js';

function initDomainSearch() {
  const forms = document.querySelectorAll("[data-domain-search-form]");
  forms.forEach(form => {
    const input = form.querySelector("input[type='search'], input[type='text']");
    const btn = form.querySelector("button[type='submit']");
    if (!input) return;
    
    form.addEventListener("submit", e => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val) {
        input.focus();
        input.classList.add("input-error");
        window.toast("Enter a domain name to search.", "error");
        return;
      }
      // basic validation: allow letters, numbers, hyphen, dot
      if (!/^[a-z0-9.-]+$/i.test(val)) {
        window.toast("Domain can only contain letters, numbers, hyphens and dots.", "error");
        return;
      }
      if (val.length < 2) {
        window.toast("Domain too short.", "error");
        return;
      }
      // debounce visual
      if (btn) {
        btn.disabled = true;
        const orig = btn.innerHTML;
        btn.innerHTML = "Searching…";
        setTimeout(() => { btn.disabled = false; btn.innerHTML = orig; }, 400);
      }
      const target = form.dataset.target || "search-results.html";
      location.href = `${target}?domain=${encodeURIComponent(val.toLowerCase())}`;
    });
    
    input.addEventListener("input", () => input.classList.remove("input-error"));
  });
}

// Search results page logic
async function initSearchResults() {
  const container = document.getElementById("search-results-root");
  if (!container) return;
  
  const params = new URLSearchParams(location.search);
  let domain = params.get("domain") || "";
  const input = document.getElementById("results-search-input");
  const resultsEl = document.getElementById("results-container");
  const loadingEl = document.getElementById("results-loading");
  
  if (input) input.value = domain;
  
  if (!domain) {
    resultsEl && (resultsEl.innerHTML = `<div class="card p-8 text-center text-secondary-label">Enter a domain above to search.</div>`);
    return;
  }
  
  // attach form on results page
  const form = document.getElementById("results-search-form");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const v = input.value.trim();
      if (!v) return;
      history.pushState(null, "", `?domain=${encodeURIComponent(v)}`);
      run(v);
    });
  }
  
  await run(domain);
  
  async function run(q) {
    loadingEl && (loadingEl.hidden = false);
    resultsEl && (resultsEl.innerHTML = "");
    
    try {
      const data = await API.searchDomain(q);
      render(data);
    } catch (err) {
      resultsEl.innerHTML = `<div class="card p-6 border-danger/20 bg-danger/5 text-danger">${err.message || "Search failed."}</div>`;
    } finally {
      loadingEl && (loadingEl.hidden = true);
    }
  }
  
  function render(data) {
    const fmt = (n) => `$${Number(n).toFixed(2)}`;
    
    const statusBadge = (s) => {
      if (s === "available") return `<span class="badge badge-success">Available</span>`;
      if (s === "premium") return `<span class="badge badge-warning">Premium</span>`;
      if (s === "taken") return `<span class="badge badge-danger">Taken</span>`;
      return `<span class="badge badge-neutral">${s}</span>`;
    };
    
    const primary = data.primary;
    const isAvailable = primary.status === "available" || primary.status === "premium";
    
    let html = `
      <div class="card overflow-hidden">
        <div class="p-6 sm:p-8 flex flex-col gap-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 class="text-title-2 font-bold tracking-tight">${primary.domain}</h1>
              <div class="mt-2 flex items-center gap-2">
                ${statusBadge(primary.status)}
                ${primary.premium ? '<span class="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full">Premium registration fee applies</span>' : ''}
              </div>
            </div>
            <div class="text-right">
              <div class="text-subheadline text-secondary-label">Registration</div>
              <div class="text-2xl font-bold">${fmt(primary.registration)}<span class="text-sm font-normal text-secondary-label">/yr</span></div>
              <div class="text-caption-1 text-secondary-label">Renewal ${fmt(primary.renewal)}/yr</div>
            </div>
          </div>
          ${isAvailable ? `
            <div class="flex flex-col sm:flex-row gap-3 sm:items-center border-t border-separator pt-6">
              <label class="flex items-center gap-2 text-subheadline">Term
                <select data-term-select class="input w-auto py-2">
                  <option value="1">1 year — ${fmt(primary.registration * 1)}</option>
                  <option value="2">2 years — ${fmt(primary.registration * 2)}</option>
                  <option value="3">3 years — ${fmt(primary.registration * 3)}</option>
                  <option value="5">5 years — ${fmt(primary.registration * 5)}</option>
                  <option value="10">10 years — ${fmt(primary.registration * 10)}</option>
                </select>
              </label>
              <div class="flex-1"></div>
              <button data-add-cart class="btn btn-primary w-full sm:w-auto">${primary.premium ? 'Add premium domain to cart' : 'Add to cart'}</button>
            </div>` : `
            <div class="rounded-lg bg-secondary-system-background border border-separator p-4">
              <p class="text-subheadline font-medium text-label">This domain is already taken.</p>
              <p class="text-subheadline text-secondary-label mt-1">Try one of the available alternatives below or try a different name.</p>
            </div>
          `}
        </div>
      </div>
    `;
    
    html += `<div class="mt-8"><h2 class="text-lg font-semibold mb-3">Available alternatives</h2><div class="grid sm:grid-cols-2 gap-3">`;
    
    data.alternatives.forEach(alt => {
      html += `<div class="card p-4 flex items-center justify-between gap-3">
        <div>
          <div class="font-medium">${alt.domain}</div>
          <div class="text-xs text-secondary-label">
            ${alt.status === "available" ? '<span class="text-success">Available</span>' : '<span class="text-danger">Taken</span>'} · ${fmt(alt.registration)}/yr
          </div>
        </div>
        ${alt.status === "available" 
          ? `<button data-alt-add="${alt.domain}" data-price="${alt.registration}" data-renew="${alt.renewal}" class="btn btn-outline py-2 px-3 text-xs">Add to cart</button>` 
          : `<span class="badge badge-neutral">Unavailable</span>`
        }
      </div>`;
    });
    
    html += `</div></div>`;
    
    if (data.suggestions.length) {
      html += `<div class="mt-8"><h2 class="text-lg font-semibold mb-3">Suggestions for you</h2><div class="grid sm:grid-cols-2 gap-3">`;
      
      data.suggestions.forEach(s => {
        html += `<div class="card p-4 flex items-center justify-between">
          <div class="font-medium text-sm">${s.domain}</div>
          <button data-alt-add="${s.domain}" data-price="${s.registration}" data-renew="${s.renewal}" class="btn btn-outline py-2 px-3 text-xs">Add</button>
        </div>`;
      });
      
      html += `</div></div>`;
    }
    
    resultsEl.innerHTML = html;
    
    // wire term select
    const termSelect = resultsEl.querySelector("[data-term-select]");
    const addBtn = resultsEl.querySelector("[data-add-cart]");
    
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const years = termSelect ? Number(termSelect.value) : 1;
        const res = Cart.add({ 
          domain: primary.domain, 
          tld: primary.tld, 
          registration: primary.registration, 
          renewal: primary.renewal, 
          years 
        });
        
        if (!res.added) {
          window.toast("Already in cart.", "error");
        } else {
          window.toast(`${primary.domain} added to cart (${years} yr).`, "success");
          Cart.updateBadge();
        }
      });
    }
    
    resultsEl.querySelectorAll("[data-alt-add]").forEach(btn => {
      btn.addEventListener("click", () => {
        const domain = btn.getAttribute("data-alt-add");
        const price = Number(btn.getAttribute("data-price"));
        const renew = Number(btn.getAttribute("data-renew"));
        
        const res = Cart.add({ domain, registration: price, renewal: renew, years: 1 });
        
        if (!res.added) {
          window.toast("Already in cart.", "error");
        } else {
          window.toast(`${domain} added to cart.`, "success");
        }
      });
    });
  }
}

export { initDomainSearch, initSearchResults };