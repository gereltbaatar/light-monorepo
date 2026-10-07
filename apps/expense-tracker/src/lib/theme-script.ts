export const THEME_STORAGE_KEY = "theme";
export const DARK_QUERY = "(prefers-color-scheme: dark)";

// Runs before hydration so the first paint already has the right class.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var d=t==="dark"||((!t||t==="system")&&matchMedia(${JSON.stringify(DARK_QUERY)}).matches);var c=document.documentElement.classList;c.toggle("dark",d);c.toggle("light",!d);document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}})()`;
