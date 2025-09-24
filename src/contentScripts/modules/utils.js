// utils.js - Utility functions for content script modules

export const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

// Function to strip markdown formatting and return plain text
export const stripMarkdown = (text) => {
  if (!text) return '';

  return (
    text
      // Remove headers (# ## ### etc.)
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold (**text** or __text__)
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      // Remove italic (*text* or _text_)
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      // Remove strikethrough (~~text~~)
      .replace(/~~(.*?)~~/g, '$1')
      // Remove inline code (`text`)
      .replace(/`(.*?)`/g, '$1')
      // Remove links [text](url) -> text
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Remove images ![alt](url) -> alt
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Remove blockquotes (> text)
      .replace(/^>\s+/gm, '')
      // Remove list markers (- * + 1. 2. etc.)
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // Remove horizontal rules (--- or ***)
      .replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '')
      // Remove code blocks (```code```)
      .replace(/```[\s\S]*?```/g, '')
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Clean up extra whitespace
      .replace(/\n\s*\n/g, '\n')
      .replace(/^\s+|\s+$/g, '')
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      .trim()
  );
};

// Function to get the first line of content for header display
export const getFirstLineForHeader = (content) => {
  if (!content) return '';

  // Split by newlines and get the first non-empty line
  const lines = content.split('\n');
  const firstLine = lines.find((line) => line.trim() !== '') || '';

  const plainText = stripMarkdown(firstLine);
  if (!plainText) return '';

  // Trim and limit length if needed (keep reasonable length for header)
  const trimmedLine = plainText.trim();
  const maxLength = 50; // Slightly longer than before since it's just one line

  return trimmedLine.length > maxLength
    ? trimmedLine.substring(0, maxLength) + '...'
    : trimmedLine;
};

// Function to collapse multiple consecutive newlines into single newlines
export const collapseMultipleNewlines = (text) => {
  if (!text) return '';

  // Replace multiple consecutive newlines (3 or more) with two newlines
  return text.replace(/\n{3,}/g, '\n\n');
};
