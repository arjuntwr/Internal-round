import React from "react";

/*
  Maximalist Image Showcase
  - Uses external royalty-free images (Unsplash) to avoid adding heavy assets to the repo
  - Responsive masonry-style collage with colorful overlays and hover animations
*/

const images: { src: string; alt: string; span?: string }[] = [
  { src: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1600&auto=format&fit=crop", alt: "Fresh vegetables", span: "md:col-span-2" },
  { src: "https://images.unsplash.com/photo-1598514982871-2e9a9b735812?q=80&w=1400&auto=format&fit=crop", alt: "Grains and wheat" },
  { src: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1600&auto=format&fit=crop", alt: "Blockchain visualization" },
  { src: "https://images.unsplash.com/photo-1506807803488-8eafc15316c0?q=80&w=1600&auto=format&fit=crop", alt: "Logistics truck in motion" },
  { src: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=1600&auto=format&fit=crop", alt: "Fresh fruits", span: "md:row-span-2" },
  { src: "https://images.unsplash.com/photo-1542834369-f10ebf06d3cb?q=80&w=1400&auto=format&fit=crop", alt: "Data dashboard" },
  { src: "https://images.unsplash.com/photo-1492496913980-501348b61469?q=80&w=1600&auto=format&fit=crop", alt: "Farm landscape" },
];

const ImageShowcase: React.FC = () => {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Decorative wave background */}
      <div className="absolute inset-0 -z-10 opacity-40">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 560" aria-hidden>
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" />
            </linearGradient>
          </defs>
          <path fill="url(#waveGradient)" d="M0,160L60,149.3C120,139,240,117,360,112C480,107,600,117,720,112C840,107,960,85,1080,80C1200,75,1320,85,1380,90.7L1440,96L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"/>
        </svg>
      </div>

      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-section">A Visual Journey</h2>
          <p className="text-muted-foreground mt-2">From farm freshness to blockchain brilliance — immerse in the experience.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {images.map((img, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden rounded-xl border border-border shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all duration-500 hover:-translate-y-1 ${img.span ?? ""}`}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="h-40 md:h-56 w-full object-cover scale-100 group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
              />
              {/* Colorful overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-secondary/0 to-accent/0 group-hover:from-primary/20 group-hover:via-secondary/20 group-hover:to-accent/20 transition-colors duration-500" />
              {/* Caption */}
              <div className="absolute bottom-2 left-2 right-2 p-2 rounded-lg bg-background/70 backdrop-blur shadow-sm opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <p className="text-xs md:text-sm font-medium line-clamp-1">{img.alt}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA strip under collage */}
        <div className="mt-10 md:mt-14 text-center">
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full border border-border bg-card hero-gradient animate-gradient text-primary-foreground shadow-[var(--shadow-md)]">
            <span className="text-sm md:text-base font-semibold">Max transparency. Max freshness. Max style.</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImageShowcase;
