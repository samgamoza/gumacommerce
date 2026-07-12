import Image from "next/image";

const GALLERY = [
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
  "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80",
] as const;

export function MellowGallery() {
  return (
    <section className="mellow-section pt-0" id="gallery">
      <div className="mellow-container">
        <h2 className="mellow-section-title">Our gallery</h2>
        <p className="mx-auto mb-8 max-w-2xl text-center text-[var(--ml-muted)]">
          Explore images of our well-appointed accommodations, rooftop views, and resort spaces designed to make your
          stay memorable.
        </p>
        <div className="mellow-gallery-grid">
          {GALLERY.map((src, index) => (
            <Image key={src} src={src} alt={`Resort gallery ${index + 1}`} width={480} height={360} />
          ))}
        </div>
      </div>
    </section>
  );
}
