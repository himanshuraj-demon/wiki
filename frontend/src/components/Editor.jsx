import React from 'react';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import api from '../utils/api.js';
import { toast } from 'react-hot-toast';
import { Clipboard } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { preprocessMarkdown } from '../utils/helpers.js';

// Flatten children elements to plain text string recursively
const flattenText = (children) => {
  return React.Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') {
        return child;
      }
      if (child.props && child.props.children) {
        return flattenText(child.props.children);
      }
      return '';
    })
    .join('');
};

export const Editor = ({ value, onChange }) => {
  const handleEditorChange = ({ text }) => {
    onChange(text);
  };

  const handleImageUpload = (file) => {
    return new Promise(async (resolve, reject) => {
      const toastId = toast.loading('Uploading image to Cloudinary...');
      const formData = new FormData();
      formData.append('image', file);

      try {
        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (data.success && data.media) {
          toast.success('Image uploaded successfully!', { id: toastId });
          resolve(data.media.url);
        } else {
          toast.error('Failed to upload image.', { id: toastId });
          reject(new Error('Upload failed'));
        }
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Failed to upload image', { id: toastId });
        reject(err);
      }
    });
  };

  const renderHTML = (text) => (
    <article className="wiki-content prose dark:prose-invert font-sans text-gray-850 dark:text-slate-200">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ children, ...props }) => {
            const textVal = flattenText(children);
            const id = encodeURIComponent(textVal.trim());
            return <h1 id={id} {...props}>{children}</h1>;
          },
          h2: ({ children, ...props }) => {
            const textVal = flattenText(children);
            const id = encodeURIComponent(textVal.trim());
            return <h2 id={id} {...props}>{children}</h2>;
          },
          img: ({ node, ...props }) => {
            let floatClass = '';
            let altText = props.alt || '';
            let widthClass = 'w-full sm:w-80';
            
            // Parse alt text for width/resizing overrides, e.g. "altText | right | w-40"
            const parts = altText.split('|').map(p => p.trim());
            altText = parts[0];
            
            // Default float behavior
            let align = '';
            let width = '';
            parts.slice(1).forEach(part => {
              const p = part.toLowerCase();
              if (p === 'right' || p === 'left') {
                align = p;
              } else if (p.startsWith('w-') || p.match(/^\d+$/)) {
                width = p;
              }
            });

            if (align === 'right') {
              floatClass = 'sm:float-right sm:ml-6 sm:clear-right mb-4';
            } else if (align === 'left') {
              floatClass = 'sm:float-left sm:mr-6 sm:clear-left mb-4';
            } else {
              floatClass = 'block my-6 text-center';
            }

            if (width) {
              if (width.startsWith('w-')) {
                widthClass = width; // e.g. w-40, w-60, w-96, etc.
              } else {
                widthClass = `w-[${width}px]`; // numeric value
              }
            } else {
              widthClass = align ? 'w-full sm:w-80' : 'w-full max-w-2xl';
            }

            return (
              <span className={`${floatClass} ${widthClass} border border-gray-200 dark:border-slate-800 bg-[#f8f9fa] dark:bg-slate-900 p-2 text-center rounded-xl shadow-sm block`}>
                <img
                  {...props}
                  alt={altText}
                  className="max-h-96 mx-auto rounded-md object-contain"
                />
                {altText && (
                  <span className="block text-center text-xs text-gray-500 mt-2 font-medium">
                    {altText}
                  </span>
                )}
              </span>
            );
          }
        }}
      >
        {preprocessMarkdown(text)}
      </ReactMarkdown>
    </article>
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <MdEditor
        value={value}
        style={{ height: '500px' }}
        renderHTML={renderHTML}
        onChange={handleEditorChange}
        onImageUpload={handleImageUpload}
        imageAccept=".jpg,.png,.gif,.jpeg,.webp"
        placeholder="Type your markdown here... Tip: Drag & drop or paste images directly into this area to upload them!"
        config={{
          view: {
            menu: true,
            md: true,
            html: true,
          },
        }}
      />
      {/* Helper Footer */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-t border-gray-100 bg-gray-50/50 text-[11px] text-gray-500 dark:border-slate-850 dark:bg-slate-900/20">
        <Clipboard className="h-3.5 w-3.5 text-gray-400" />
        <span>Supports Markdown, custom floating and resizing (e.g. <code>![alt | right | w-48](url)</code>), and Accordions via <code>&lt;details&gt;</code></span>
      </div>
    </div>
  );
};

export default Editor;
