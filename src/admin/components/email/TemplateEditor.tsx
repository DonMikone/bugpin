import { useState, useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { VariableNode } from './tiptap-extensions/variable-node';
import { extractEditableContent, wrapContentInTemplate } from './template-content';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  List,
  ListOrdered,
  Undo,
  Redo,
  Variable,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../ui/tooltip';

interface TemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  availableVariables: string[];
  placeholder?: string;
}

type EditorMode = 'wysiwyg' | 'source';

export function TemplateEditor({
  value,
  onChange,
  availableVariables,
  placeholder,
}: TemplateEditorProps) {
  const [mode, setMode] = useState<EditorMode>('source'); // Default to source mode for full HTML templates
  const [sourceValue, setSourceValue] = useState(value);
  // Store the template wrapper so we can re-wrap content when editing in WYSIWYG mode
  const templateWrapperRef = useRef<string>('');

  // Extract content for WYSIWYG editing and initialize wrapper
  const { content: initialContent, wrapper: initialWrapper } = extractEditableContent(value);

  // Initialize wrapper ref on first render
  if (templateWrapperRef.current === '' && initialWrapper) {
    templateWrapperRef.current = initialWrapper;
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      VariableNode,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const editedContent = editor.getHTML();
      // Re-wrap content in template structure if we have a wrapper
      const fullHtml = templateWrapperRef.current
        ? wrapContentInTemplate(editedContent, templateWrapperRef.current)
        : editedContent;
      onChange(fullHtml);
      setSourceValue(fullHtml);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[300px] p-4 focus:outline-none [&_.variable-node]:inline-flex [&_.variable-node]:items-center [&_.variable-node]:px-1.5 [&_.variable-node]:py-0.5 [&_.variable-node]:rounded [&_.variable-node]:text-xs [&_.variable-node]:font-medium [&_.variable-node]:bg-primary/10 [&_.variable-node]:text-primary [&_.variable-node]:border [&_.variable-node]:border-primary/20',
      },
    },
  });

  // Sync editor content when value prop changes externally
  useEffect(() => {
    if (editor) {
      const { content: newContent, wrapper: newWrapper } = extractEditableContent(value);
      if (newWrapper) {
        templateWrapperRef.current = newWrapper;
      }
      // Only update if content actually changed
      if (newContent !== editor.getHTML()) {
        editor.commands.setContent(newContent);
      }
      setSourceValue(value);
    }
  }, [editor, value]);

  const handleModeToggle = useCallback(() => {
    if (mode === 'wysiwyg') {
      // Switching to source mode - get full HTML (content re-wrapped in template)
      const editedContent = editor?.getHTML() || '';
      const fullHtml = templateWrapperRef.current
        ? wrapContentInTemplate(editedContent, templateWrapperRef.current)
        : editedContent;
      setSourceValue(fullHtml);
      setMode('source');
    } else {
      // Switching to WYSIWYG mode - extract content from full HTML
      const { content, wrapper } = extractEditableContent(sourceValue);
      if (wrapper) {
        templateWrapperRef.current = wrapper;
      }
      editor?.commands.setContent(content);
      onChange(sourceValue);
      setMode('wysiwyg');
    }
  }, [mode, editor, sourceValue, onChange]);

  const handleSourceChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setSourceValue(newValue);
      onChange(newValue);
    },
    [onChange]
  );

  const insertVariable = useCallback(
    (variable: string) => {
      if (mode === 'wysiwyg' && editor) {
        editor.chain().focus().insertVariable(variable).run();
      } else {
        // In source mode, insert at cursor position
        const textarea = document.querySelector(
          '[data-source-editor]'
        ) as HTMLTextAreaElement | null;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newValue =
            sourceValue.substring(0, start) + `{{${variable}}}` + sourceValue.substring(end);
          setSourceValue(newValue);
          onChange(newValue);
          // Reset cursor position after insert
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
          }, 0);
        }
      }
    },
    [mode, editor, sourceValue, onChange]
  );

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="border rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
          {mode === 'wysiwyg' && (
            <>
              {/* Text formatting */}
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                tooltip="Bold"
              >
                <Bold className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                tooltip="Italic"
              >
                <Italic className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive('underline')}
                tooltip="Underline"
              >
                <UnderlineIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} tooltip="Link">
                <LinkIcon className="h-4 w-4" />
              </ToolbarButton>

              <div className="w-px h-6 bg-border mx-1" />

              {/* Alignment */}
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({ textAlign: 'left' })}
                tooltip="Align left"
              >
                <AlignLeft className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({ textAlign: 'center' })}
                tooltip="Align center"
              >
                <AlignCenter className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({ textAlign: 'right' })}
                tooltip="Align right"
              >
                <AlignRight className="h-4 w-4" />
              </ToolbarButton>

              <div className="w-px h-6 bg-border mx-1" />

              {/* Lists */}
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                tooltip="Bullet list"
              >
                <List className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                tooltip="Numbered list"
              >
                <ListOrdered className="h-4 w-4" />
              </ToolbarButton>

              <div className="w-px h-6 bg-border mx-1" />

              {/* Undo/Redo */}
              <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                tooltip="Undo"
              >
                <Undo className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                tooltip="Redo"
              >
                <Redo className="h-4 w-4" />
              </ToolbarButton>

              <div className="w-px h-6 bg-border mx-1" />
            </>
          )}

          {/* Variable insertion */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Variable className="h-4 w-4" />
                Insert Variable
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="grid gap-1">
                <p className="text-xs text-muted-foreground px-2 py-1">
                  Click to insert a variable
                </p>
                <div className="max-h-48 overflow-y-auto">
                  {availableVariables.map((variable) => (
                    <button
                      key={variable}
                      onClick={() => insertVariable(variable)}
                      className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors font-mono"
                    >
                      {`{{${variable}}}`}
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Mode toggle */}
          <Button variant="outline" size="sm" onClick={handleModeToggle} className="gap-1.5">
            <Code className="h-4 w-4" />
            {mode === 'wysiwyg' ? 'Source' : 'Visual'}
          </Button>
        </div>

        {/* Editor content */}
        {mode === 'wysiwyg' ? (
          <EditorContent
            editor={editor}
            className="bg-background [&_.ProseMirror]:min-h-[300px] [&_.ProseMirror]:p-4 [&_.ProseMirror:focus]:outline-none"
          />
        ) : (
          <Textarea
            data-source-editor
            value={sourceValue}
            onChange={handleSourceChange}
            placeholder={placeholder}
            className="min-h-[300px] font-mono text-sm rounded-none border-0 resize-none focus-visible:ring-0"
          />
        )}
      </div>
    </TooltipProvider>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, disabled, tooltip, children }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className={`h-8 w-8 p-0 ${isActive ? 'bg-muted' : ''}`}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
