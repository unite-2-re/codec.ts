// Initiate loading instantly
import { observeAttribute } from "@unite/scripts/dom/Observer.ts";
import { updateStyleRule } from "@unite/scripts/stylework/ColorTheme.ts";

//
const preInit = Promise.allSettled([

]).then((init) => {
    return Promise.allSettled(Array.from(init).map((rv)=>{
        const def = rv?.value?.default;
        if (typeof def == "function") { return def?.()?.catch?.(console.warn.bind(console)); };
        return def;
    }))?.catch?.(console.warn.bind(console));
});

//
preInit.then(async ()=>{
    //
    const loading = Promise.allSettled([

    ]);

    //
    const services = Promise.allSettled([
    ]);

    //
    (await services).map((mod)=>{
        const lazy = mod?.value?.default;
        if (typeof lazy == "function") { lazy?.(); };
    });

    //
    updateStyleRule("#1060A0", false);

    //
    const {createApp} = await import("vue");
    const App = (await import("./Main.vue")).default;
    const app = createApp(App);
    app.directive("observe", {
        created: (el, binding, vNode, prevNode) => {
            observeAttribute(el, binding.arg, (mut)=>{
                binding?.value?.(el.getAttribute(binding.arg));
            });
        }
    });
    app.mount(document.body);

    //
    (await loading).map((mod)=>{
        const lazy = mod?.value?.default;
        if (typeof lazy == "function") { lazy?.(); };
    });
});

//
document.documentElement.style.setProperty("--theme-base-color", localStorage.getItem("--theme-base-color") || "oklch(50% 0.3 0)", "");
document.documentElement.style.setProperty("--theme-wallpaper-is-dark", localStorage.getItem("--theme-wallpaper-is-dark") || "0", "");

// avoid any dragging when no-needed...
document.documentElement.addEventListener("dragstart", (ev) => {
    if ((ev?.target as HTMLElement)?.matches?.("div, img, picture, canvas, video, svg")) {
        ev.preventDefault();
    }
}, {passive: false, capture: true});
