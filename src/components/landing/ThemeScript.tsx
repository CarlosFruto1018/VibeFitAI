/**
 * Script inline que aplica la clase .dark en <html> antes del primer paint,
 * leyendo la preferencia guardada o, en su defecto, la del sistema.
 * Evita el flash de tema incorrecto al cargar la página.
 */
export function ThemeScript() {
  const code = `try{var t=localStorage.getItem('vibefitai-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
