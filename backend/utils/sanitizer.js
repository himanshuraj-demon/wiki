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
