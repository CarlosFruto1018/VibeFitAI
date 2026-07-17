import type { ReactNode } from "react";

/**
 * Frame decorativo de iPhone para el hero del landing.
 *
 * Proporción base: 393px de ancho (viewport de iPhone 15 Pro) con altura
 * recortada a 780 para que el mockup se vea compacto — elección visual,
 * no la proporción física exacta del dispositivo.
 *
 * El tamaño en la página se controla solo con `width` + `aspect-ratio`
 * (sin transform/zoom/JS). Todo el chrome (bisel, radios, Dynamic Island)
 * está en `cqw` vía container queries, y la pantalla fija `fontSize` en
 * `cqw`: el contenido hijo dimensionado en `em` escala proporcionalmente
 * con el ancho del frame, como una captura — nunca hay scroll ni reflow.
 */
const VIEWPORT_WIDTH = 393;
const VIEWPORT_HEIGHT = 780;
const SCREEN_RADIUS = 55;
const BEZEL = 14;
const FRAME_RADIUS = SCREEN_RADIUS + BEZEL;
const NATURAL_WIDTH = VIEWPORT_WIDTH + BEZEL * 2; // 421
const NATURAL_HEIGHT = VIEWPORT_HEIGHT + BEZEL * 2; // 808

/** Convierte una medida del diseño natural (421px de ancho) a `cqw`. */
const cqw = (px: number) => `${(px / NATURAL_WIDTH) * 100}cqw`;

/* Anchos contenidos: el mockup es un elemento de apoyo del hero, no el
 * protagonista. El más ancho (330px) da una altura de ~633px, por debajo
 * del tope de 650px en pantallas grandes. */
const WIDTH_CLASSES =
  "w-[210px] sm:w-[230px] md:w-[250px] lg:w-[280px] xl:w-[clamp(300px,21vw,330px)]";

interface IPhoneFrameProps {
  /** Pantalla a renderizar dentro del teléfono (dimensionada en `em`). */
  children: ReactNode;
  className?: string;
}

export function IPhoneFrame({ children, className }: IPhoneFrameProps) {
  return (
    <div
      className={`mx-auto ${WIDTH_CLASSES} ${className ?? ""}`}
      style={{
        aspectRatio: `${NATURAL_WIDTH} / ${NATURAL_HEIGHT}`,
        containerType: "inline-size",
      }}
    >
      <div className="relative h-full w-full">
        {/* Bisel — puramente decorativo */}
        <div
          className="absolute inset-0 bg-on-surface shadow-[0_20px_45px_-18px_rgb(19_27_46_/_0.28),0_8px_18px_-10px_rgb(19_27_46_/_0.18)]"
          style={{ borderRadius: cqw(FRAME_RADIUS) }}
          aria-hidden
        />

        {/* Botones laterales — decorativos */}
        <div className="absolute rounded-l-sm bg-on-surface" style={{ left: cqw(-2), top: cqw(110), height: cqw(28), width: cqw(3) }} aria-hidden />
        <div className="absolute rounded-l-sm bg-on-surface" style={{ left: cqw(-2), top: cqw(152), height: cqw(48), width: cqw(3) }} aria-hidden />
        <div className="absolute rounded-l-sm bg-on-surface" style={{ left: cqw(-2), top: cqw(220), height: cqw(48), width: cqw(3) }} aria-hidden />
        <div className="absolute rounded-r-sm bg-on-surface" style={{ right: cqw(-2), top: cqw(160), height: cqw(72), width: cqw(3) }} aria-hidden />

        {/* Pantalla — fontSize en cqw: 1em ≈ 14px al ancho natural de 393 */}
        <div
          className="absolute overflow-hidden bg-white"
          style={{
            top: cqw(BEZEL),
            left: cqw(BEZEL),
            width: cqw(VIEWPORT_WIDTH),
            height: `${(VIEWPORT_HEIGHT / NATURAL_WIDTH) * 100}cqw`,
            borderRadius: cqw(SCREEN_RADIUS),
            fontSize: cqw(17),
          }}
        >
          {children}

          {/* Dynamic Island — decorativa, flota sobre el contenido */}
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full bg-black"
            style={{ top: cqw(11), width: cqw(126), height: cqw(37) }}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
