export function StorefrontJsonLd({ blocks }: { blocks: Record<string, unknown>[] }) {
  return (
    <>
      {blocks.map((block, index) => (
        <script
          // eslint-disable-next-line react/no-danger
          key={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
