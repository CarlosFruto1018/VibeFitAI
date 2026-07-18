import Image from "next/image";

const PHOTOS = [
  { src: "/img/gym-spotting.webp", alt: "Dos personas entrenando juntas, pasándose una mancuerna en el rack" },
  { src: "/img/gym-interior.webp", alt: "Interior de un gimnasio moderno con zona funcional y área de pesas" },
  { src: "/img/gym-dumbbell-rack.webp", alt: "Rack de mancuernas ordenadas de menor a mayor peso" },
  { src: "/img/gym-kettlebells.webp", alt: "Fila de kettlebells con su peso marcado en libras y kilos" },
];

// Se duplica la lista para lograr un loop continuo: al llegar a la mitad del
// track (que mide el doble del ancho real) se reinicia sin salto visible.
const TRACK = [...PHOTOS, ...PHOTOS];

export function Gallery() {
  return (
    <section className="py-12 lg:py-16 overflow-hidden bg-surface-container-low">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 text-center mb-9">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3 [text-wrap:balance]">
          Hecho para el gym real
        </h2>
        <p className="text-sm text-on-surface-variant leading-relaxed [text-wrap:pretty]">
          Sin excusas ni fricción — saca el teléfono, habla o toma una foto, y sigue entrenando.
        </p>
      </div>

      {/* Desvanecido suave en los bordes + loop infinito en CSS puro (sin JS) */}
      <div className="relative [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max gap-5 animate-marquee">
          {TRACK.map((photo, i) => (
            <div
              key={`${photo.src}-${i}`}
              className="group relative shrink-0 w-[280px] h-[360px] sm:w-[360px] sm:h-[440px] rounded-3xl overflow-hidden shadow-float ring-1 ring-black/5"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 640px) 280px, 360px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                priority={i < 2}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
