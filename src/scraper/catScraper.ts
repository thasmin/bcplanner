/**
 * Scraper for Battle Cats wiki to extract cat names and images
 */

interface Cat {
  name: string;
  imageUrl: string;
}

async function scrapeCatDictionary(): Promise<Cat[]> {
  const url = "https://battlecats.miraheze.org/wiki/Cat_Dictionary";

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const cats: Cat[] = [];

    // Parse HTML to find span elements with typeof="mw:File"
    const spanRegex = /<span[^>]*typeof="mw:File"[^>]*>[\s\S]*?<\/span>/g;
    const spans = html.match(spanRegex) || [];

    for (const span of spans) {
      // Extract image src
      const imgMatch = span.match(/<img[^>]*src="([^"]+)"/);
      const imgSrc = imgMatch ? imgMatch[1] : null;

      // Extract title from a element
      const titleMatch = span.match(/<a[^>]*title="([^"]+)"/);
      const title = titleMatch ? titleMatch[1] : null;

      if (imgSrc && title) {
        cats.push({
          name: title,
          imageUrl: imgSrc.startsWith('//') ? `https:${imgSrc}` : imgSrc
        });
      }
    }

    return cats;
  } catch (error) {
    console.error("Error scraping cat dictionary:", error);
    throw error;
  }
}

// Run the scraper if this file is executed directly
if (import.meta.main) {
  const cats = await scrapeCatDictionary();
  console.log(`Found ${cats.length} cats`);
  console.log(JSON.stringify(cats, null, 2));
}

export { scrapeCatDictionary, type Cat };
