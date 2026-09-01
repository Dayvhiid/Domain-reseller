function initNavigation(){
  const btn = document.getElementById("mobile-menu-button");
  const menu = document.getElementById("mobile-menu");
  if(!btn || !menu) return;
  const iconOpen = document.getElementById("icon-open");
  const iconClose = document.getElementById("icon-close");
  let open = false;
  function setState(v){
    open=v;
    menu.classList.toggle("hidden", !open);
    btn.setAttribute("aria-expanded", String(open));
    if(iconOpen) iconOpen.classList.toggle("hidden", open);
    if(iconClose) iconClose.classList.toggle("hidden", !open);
    document.body.classList.toggle("overflow-hidden", open);
  }
  btn.addEventListener("click", ()=> setState(!open));
  menu.querySelectorAll("a, button").forEach(el=> el.addEventListener("click", ()=> setState(false)));
  document.addEventListener("keydown", e=>{ if(e.key==="Escape" && open) setState(false); });
  document.addEventListener("click", e=>{
    if(open && !menu.contains(e.target) && !btn.contains(e.target)) setState(false);
  });
}
