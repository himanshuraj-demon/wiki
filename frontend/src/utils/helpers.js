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
 * Sanitizes markdown content to strip dangerous HTML tags, javascript URLs, 
 * and inline event handlers to prevent Cross-Site Scripting (XSS) attacks.
 * @param {string} text Markdown content to sanitize
 * @returns {string} Sanitized markdown
 */
export const sanitizeMarkdown = (text = '') => {
  if (typeof text !== 'string') return text;
  
  return text
    // 1. Remove script tags completely
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<script[\s\S]*?>/gi, '')
    
    // 2. Remove inline event handlers (onload, onerror, onclick, etc.) inside raw HTML tags
    .replace(/\b(on[a-z]+)\s*=\s*(['"][^'"]*['"]|[^>\s]+)/gi, '')
    
    // 3. Remove javascript: pseudo-protocol inside href or src attributes
    .replace(/href\s*=\s*(['"]\s*javascript:[^'"]*['"]|\s*javascript:[^>\s]+)/gi, 'href="#"')
    .replace(/src\s*=\s*(['"]\s*javascript:[^'"]*['"]|\s*javascript:[^>\s]+)/gi, 'src="#"')
    
    // 4. Remove javascript: links in markdown, e.g. [click](javascript:alert(1))
    .replace(/\[([^\]]*?)\]\(\s*javascript:[^)]*?\)/gi, '[$1](#)')
    
    // 5. Remove dangerous tags: iframe, object, embed, form, input, button
    .replace(/<(iframe|object|embed|form|input|button)[\s\S]*?>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(iframe|object|embed|form|input|button)[\s\S]*?>/gi, '');
};

/**
 * Preprocesses custom wiki tags like [[slug|label]] into standard markdown format
 * that react-markdown can natively render as links.
 * @param {string} md Raw markdown content
 * @returns {string} Standard markdown content
 */
export const preprocessMarkdown = (md = '') => {
  if (!md) return '';
  
  // First, sanitize the content to protect against XSS
  const sanitized = sanitizeMarkdown(md);

  // Convert internal wiki links: [[slug|label]] -> [label](/articles/slug)
  let processed = sanitized.replace(/\[\[(.*?)(?:\|(.*?))?\]\]/g, (match, slug, label) => {
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
