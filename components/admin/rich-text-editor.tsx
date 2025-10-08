'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List, 
  ListOrdered,
  Quote,
  Link,
  Image,
  Code,
  Type,
  Palette,
  Undo,
  Redo
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Start writing your blog post...",
  className = ""
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleContentChange();
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      execCommand('insertHTML', '<br>');
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const formatText = (command: string) => {
    execCommand(command);
  };

  const setAlignment = (alignment: string) => {
    execCommand('justify' + alignment);
  };

  const insertList = (ordered: boolean = false) => {
    execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
  };

  const insertQuote = () => {
    execCommand('formatBlock', 'blockquote');
  };

  const insertCode = () => {
    execCommand('formatBlock', 'pre');
  };

  const changeFontSize = () => {
    const size = prompt('Enter font size (1-7):');
    if (size && parseInt(size) >= 1 && parseInt(size) <= 7) {
      execCommand('fontSize', size);
    }
  };

  const changeTextColor = () => {
    const color = prompt('Enter color (e.g., #ff0000 or red):');
    if (color) {
      execCommand('foreColor', color);
    }
  };

  const ToolbarButton = ({ 
    onClick, 
    icon: Icon, 
    title, 
    isActive = false 
  }: { 
    onClick: () => void; 
    icon: any; 
    title: string; 
    isActive?: boolean;
  }) => (
    <Button
      type="button"
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      title={title}
      className="h-8 w-8 p-0"
    >
      <Icon className="h-4 w-4 text-black dark:text-white" />
    </Button>
  );

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        {/* Undo/Redo */}
        <div className="flex gap-1 mr-2">
          <ToolbarButton
            onClick={() => execCommand('undo')}
            icon={Undo}
            title="Undo"
          />
          <ToolbarButton
            onClick={() => execCommand('redo')}
            icon={Redo}
            title="Redo"
          />
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text Formatting */}
        <div className="flex gap-1 mr-2">
          <ToolbarButton
            onClick={() => formatText('bold')}
            icon={Bold}
            title="Bold"
          />
          <ToolbarButton
            onClick={() => formatText('italic')}
            icon={Italic}
            title="Italic"
          />
          <ToolbarButton
            onClick={() => formatText('underline')}
            icon={Underline}
            title="Underline"
          />
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Alignment */}
        <div className="flex gap-1 mr-2">
          <ToolbarButton
            onClick={() => setAlignment('Left')}
            icon={AlignLeft}
            title="Align Left"
          />
          <ToolbarButton
            onClick={() => setAlignment('Center')}
            icon={AlignCenter}
            title="Align Center"
          />
          <ToolbarButton
            onClick={() => setAlignment('Right')}
            icon={AlignRight}
            title="Align Right"
          />
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <div className="flex gap-1 mr-2">
          <ToolbarButton
            onClick={() => insertList(false)}
            icon={List}
            title="Bullet List"
          />
          <ToolbarButton
            onClick={() => insertList(true)}
            icon={ListOrdered}
            title="Numbered List"
          />
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Special Formatting */}
        <div className="flex gap-1 mr-2">
          <ToolbarButton
            onClick={insertQuote}
            icon={Quote}
            title="Quote"
          />
          <ToolbarButton
            onClick={insertCode}
            icon={Code}
            title="Code Block"
          />
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Media & Links */}
        <div className="flex gap-1 mr-2">
          <ToolbarButton
            onClick={insertLink}
            icon={Link}
            title="Insert Link"
          />
          <ToolbarButton
            onClick={insertImage}
            icon={Image}
            title="Insert Image"
          />
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Font Options */}
        <div className="flex gap-1 mr-2">
          <ToolbarButton
            onClick={changeFontSize}
            icon={Type}
            title="Font Size"
          />
          <ToolbarButton
            onClick={changeTextColor}
            icon={Palette}
            title="Text Color"
          />
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`min-h-[400px] p-4 focus:outline-none text-black dark:text-white ${
          isFocused ? 'ring-2 ring-blue-500 ring-inset' : ''
        } ${className}`}
        style={{
          lineHeight: '1.6',
          fontSize: '16px'
        }}
        dangerouslySetInnerHTML={{ __html: content || '' }}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
