/**
 * Strips all markdown formatting syntax to return pure plain text.
 * Highly useful for clean article card snippets and search previews.
 * @param {string} md The raw markdown content
 * @returns {string} Plain text content
 */
export const stripMarkdown = (md = '') => {
  if (!md) return '';
  return md
    .replace(/#+\s+.+/g, '') // remove headings
    .replace(/\[\[(.*?)(?:\|(.*?))?\]\]/g, '$2' || '$1') // remove wiki links
    .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // remove external links
    .replace(/\*\*+(.*?)\*\*+/g, '$1') // remove bold
    .replace(/\*+(.*?)\*+/g, '$1') // remove italic
    .replace(/`+(.*?)`+/g, '$1') // remove code
    .replace(/^\s*-\s+/gm, '') // remove bullets
    .replace(/^\s*\d+\.\s+/gm, '') // remove numbered lists
    .replace(/:::info|:::warning|:::danger|:::/g, '') // remove callout markers
    .replace(/\|.*?\|/g, '') // remove table pipes
    .replace(/\n+/g, ' ') // replace newlines with space
    .trim();
};

/**
 * Preprocesses custom wiki tags like [[slug|label]] into standard markdown format
 * that react-markdown can natively render as links.
 * @param {string} md Raw markdown content
 * @returns {string} Standard markdown content
 */
export const preprocessMarkdown = (md = '') => {
  if (!md) return '';
  
  // Convert internal wiki links: [[slug|label]] -> [label](/articles/slug)
  let processed = md.replace(/\[\[(.*?)(?:\|(.*?))?\]\]/g, (match, slug, label) => {
    const displayLabel = label || slug.replace(/-/g, ' ');
    const formattedSlug = slug.toLowerCase().trim().replace(/\s+/g, '-');
    return `[${displayLabel}](/articles/${formattedSlug})`;
  });

  // Convert callout blocks into simple HTML div blocks
  processed = processed
    .replace(/:::info([\s\S]*?):::/g, '<div class="wiki-callout wiki-callout-info">$1</div>')
    .replace(/:::warning([\s\S]*?):::/g, '<div class="wiki-callout wiki-callout-warning">$1</div>')
    .replace(/:::danger([\s\S]*?):::/g, '<div class="wiki-callout wiki-callout-danger">$1</div>');

  return processed;
};
