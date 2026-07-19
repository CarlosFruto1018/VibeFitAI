import Image from "next/image";
import { getTranslations } from "next-intl/server";

const PHOTOS = [
  "/img/gym-spotting.webp",
  "/img/gym-interior.webp",
  "/img/gym-dumbbell-rack.webp",
  "/img/gym-kettlebells.webp",
];

// Se duplica la lista para lograr un loop continuo: al llegar a la mitad del
// track (que mide el doble del ancho real) se reinicia sin salto visible.
const TRACK = [...PHOTOS, ...PHOTOS];

export async function Gallery() {
  const t = await getTranslations("landing.gallery");
  return (
    <section className="py-12 lg:py-16 overflow-hidden bg-surface-container-low">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 text-center mb-9">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3 [text-wrap:balance]">
          {t("title")}
        </h2>
        <p className="text-sm text-on-surface-variant leading-relaxed [text-wrap:pretty]">
          {t("subtitle")}
        </p>
      </div>

      {/* Desvanecido suave en los bordes + loop infinito en CSS puro (sin JS) */}
      <div className="relative [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max gap-5 animate-marquee">
          {TRACK.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="group relative shrink-0 w-[280px] h-[360px] sm:w-[360px] sm:h-[440px] rounded-3xl overflow-hidden shadow-float ring-1 ring-black/5"
            >
              <Image
                src={src}
                alt=""
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
