'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Preprocess: replace <YouTube id="abc" /> with a placeholder we can catch
function preprocessYouTube(content: string): string {
  return content.replace(/<YouTube\s+id="([^"]+)"\s*\/>/g, '%%YOUTUBE:$1%%');
}

export function ContentRenderer({ content }: { content: string }) {
  const processed = preprocessYouTube(content);
  return (
    <div className="prose prose-zinc max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p({ children }) {
            // Detect YouTube placeholder
            if (typeof children === 'string' && children.startsWith('%%YOUTUBE:')) {
              const id = children.replace('%%YOUTUBE:', '').replace('%%', '');
              return (
                <div className="relative my-6" style={{ paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${id}`}
                    title="YouTube video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full rounded"
                  />
                </div>
              );
            }
            return <p>{children}</p>;
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
