import React, { useRef, useState } from 'react';
import { 
  Bold, Italic, Heading1, Heading2, List, ListOrdered, Code, 
  Table, Info, Link, FileImage, Clipboard, Eye, FileText
} from 'lucide-react';
import api from '../utils/api.js';
import { toast } from 'react-hot-toast';

// Simple client-side markdown formatter for Live Preview
const parseMarkdown = (markdown = '') => {
  let html = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 1. Headings
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');

  // 2. Callouts (e.g., :::info)
  html = html.replace(/:::info([\s\S]*?):::/g, '<div class="wiki-callout wiki-callout-info"><p>$1</p></div>');
  html = html.replace(/:::warning([\s\S]*?):::/g, '<div class="wiki-callout wiki-callout-warning"><p>$1</p></div>');
  html = html.replace(/:::danger([\s\S]*?):::/g, '<div class="wiki-callout wiki-callout-danger"><p>$1</p></div>');

  // 3. Fenced Code Blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // 4. Tables
  // Simple table parsing: lines starting/ending with |
  const lines = html.split('\n');
  let inTable = false;
  let tableRows = [];
  
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      
      // Split and clean cell values
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      
      // Skip alignment rows (e.g., |---|---|)
      if (cells.every(c => c.match(/^:?-+:?$/))) {
        continue;
      }
      
      tableRows.push(cells);
      lines[idx] = ''; // clear line
    } else {
      if (inTable) {
        // Construct Table HTML
        let tableHtml = '<table><thead><tr>';
        tableRows[0].forEach(cell => {
          tableHtml += `<th>${cell}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
        
        tableRows.slice(1).forEach(row => {
          tableHtml += '<tr>';
          row.forEach(cell => {
            tableHtml += `<td>${cell}</td>`;
          });
          tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';
        
        // Replace previous empty line with Table HTML
        lines[idx - 1] = tableHtml;
        inTable = false;
      }
    }
  }
  html = lines.join('\n');

  // 5. Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');

  // 6. Wiki Internal Links [[slug]] -> <a href="/articles/slug">slug</a>
  html = html.replace(/\[\[(.*?)(?:\|(.*?))?\]\]/g, (match, slug, label) => {
    const displayLabel = label || slug.replace(/-/g, ' ');
    const formattedSlug = slug.toLowerCase().trim().replace(/\s+/g, '-');
    return `<a class="wiki-link" href="/articles/${formattedSlug}">${displayLabel}</a>`;
  });

  // 7. External Links [Label](Url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a class="wiki-link" href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // 8. Images ![Alt](Url)
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<div class="my-4"><img src="$2" alt="$1" class="rounded-lg max-h-96 mx-auto" /><p class="text-center text-xs text-gray-500 mt-1">$1</p></div>');

  // 9. Unordered Lists
  html = html.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');

  // 10. Ordered Lists
  html = html.replace(/^\s*\d+\.\s+(.*?)$/gm, '<li>$1</li>');
  // Since ol has same tags as ul, let's wrap sequentially
  
  // 11. Paragraphs (lines that aren't html headings, tags, lists or tables)
  html = html.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<div') || trimmed.startsWith('<table') || trimmed.startsWith('<pre') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('</pre>') || trimmed.startsWith('</table>') || trimmed.startsWith('</div>') || trimmed.startsWith('</ul>')) {
      return line;
    }
    return `<p>${line}</p>`;
  }).join('\n');

  return { __html: html };
};

export const Editor = ({ value, onChange }) => {
  const textareaRef = useRef(null);
  const [activeTab, setActiveTab] = useState('write'); // 'write' or 'preview'
  const [uploading, setUploading] = useState(false);

  const insertAtCursor = (beforeVal, afterVal = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = beforeVal + selectedText + afterVal;
    
    const newVal = text.substring(0, start) + replacement + text.substring(end);
    onChange(newVal);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + beforeVal.length,
        start + beforeVal.length + selectedText.length
      );
    }, 0);
  };

  // Handle image upload from file or clipboard
  const handleUploadImage = async (file) => {
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading('Uploading image to Cloudinary...');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success && data.media) {
        toast.success('Image uploaded successfully!', { id: toastId });
        // Insert markdown image code
        insertAtCursor(`![Image caption](${data.media.url})`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to upload image', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  // Listen to drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleUploadImage(files[0]);
    }
  };

  // Listen to clipboard pastes
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let idx = 0; idx < items.length; idx++) {
      if (items[idx].type.indexOf('image') !== -1) {
        const file = items[idx].getAsFile();
        handleUploadImage(file);
        break;
      }
    }
  };

  // File Selector handler
  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleUploadImage(files[0]);
    }
  };

  const toolbarActions = [
    { label: 'Bold', icon: Bold, action: () => insertAtCursor('**', '**') },
    { label: 'Italic', icon: Italic, action: () => insertAtCursor('*', '*') },
    { label: 'H1', icon: Heading1, action: () => insertAtCursor('# ', '\n') },
    { label: 'H2', icon: Heading2, action: () => insertAtCursor('## ', '\n') },
    { label: 'Bullet List', icon: List, action: () => insertAtCursor('- ', '\n') },
    { label: 'Numbered List', icon: ListOrdered, action: () => insertAtCursor('1. ', '\n') },
    { label: 'Code Block', icon: Code, action: () => insertAtCursor('```\n', '\n```') },
    { label: 'Table', icon: Table, action: () => insertAtCursor('| Header 1 | Header 2 |\n|---|---|\n| Cell 1 | Cell 2 |\n') },
    { label: 'Callout Info', icon: Info, action: () => insertAtCursor(':::info\n', '\n:::') },
    { label: 'Internal Wiki Link', icon: Link, action: () => insertAtCursor('[[', ']]') },
    { label: 'External Link', icon: Link, action: () => insertAtCursor('[Link Text](', ')') },
  ];

  return (
    <div className="rounded-xl border border-gray-250 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-950">
      
      {/* Editor Tabs & File Picker */}
      <div className="flex items-center justify-between border-b border-gray-205 bg-gray-50/50 px-4 py-2 dark:border-slate-800 dark:bg-slate-900/30">
        
        {/* Toggle tabs */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all
              ${activeTab === 'write' 
                ? 'bg-iitgn-maroon text-white' 
                : 'text-gray-655 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }
            `}
          >
            <FileText className="h-3.5 w-3.5" /> Write Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all
              ${activeTab === 'preview' 
                ? 'bg-iitgn-maroon text-white' 
                : 'text-gray-655 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }
            `}
          >
            <Eye className="h-3.5 w-3.5" /> Live Preview
          </button>
        </div>

        {/* Upload Button */}
        <div className="relative">
          <input
            type="file"
            id="editor-file-upload"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          <label
            htmlFor="editor-file-upload"
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            <FileImage className="h-3.5 w-3.5 text-gray-400" />
            <span>Upload Image</span>
          </label>
        </div>

      </div>

      {/* Editor Main Content Area */}
      {activeTab === 'write' ? (
        <div className="flex flex-col">
          
          {/* Format Toolbar */}
          <div className="flex flex-wrap items-center gap-1 bg-gray-50 border-b border-gray-150 p-2 dark:border-slate-850 dark:bg-slate-900/60">
            {toolbarActions.map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={btn.action}
                className="rounded p-1.5 hover:bg-gray-200 text-gray-500 hover:text-gray-800 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
                title={btn.label}
              >
                <btn.icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onPaste={handlePaste}
            rows="16"
            className="w-full p-4 font-mono text-sm outline-none border-0 resize-y min-h-[350px] dark:bg-slate-950 dark:text-white"
            placeholder="Type your markdown here... Tip: Drag & drop or paste images directly into this area to upload them!"
          />
        </div>
      ) : (
        /* Live Preview tab */
        <div className="p-6 overflow-y-auto min-h-[380px] max-h-[600px] wiki-content dark:bg-slate-950/20">
          <div 
            dangerouslySetInnerHTML={parseMarkdown(value)}
          />
          {!value && (
            <p className="text-gray-400 italic text-center py-10">Nothing to preview. Type something in the write tab!</p>
          )}
        </div>
      )}

      {/* Helper Footer */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-t border-gray-100 bg-gray-50/50 text-[11px] text-gray-500 dark:border-slate-850 dark:bg-slate-900/20">
        <Clipboard className="h-3.5 w-3.5 text-gray-400" />
        <span>Supports Markdown, Drag & Drop Images, and internal Wiki links like <code>[[Computer Science Department]]</code></span>
      </div>

    </div>
  );
};

export default Editor;
