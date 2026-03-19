'use client';

import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import LinkExt from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';

interface TipTapEditorProps {
  content: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
}

function TBtn({ onClick, active, title, children }: {
  onClick: () => void; active?: boolean; title?: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        padding: '0.3rem 0.5rem', border: '1px solid',
        borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem',
        fontWeight: 600, transition: 'all 0.15s',
        background: active ? 'var(--color-text)' : 'transparent',
        color: active ? 'var(--color-bg)' : 'var(--color-text)',
        borderColor: active ? 'var(--color-text)' : 'var(--color-border)',
        minWidth: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '0.2rem',
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span style={{ width: 1, background: 'var(--color-border)', margin: '0 0.15rem', alignSelf: 'stretch' }} />;
}

export default function TipTapEditor({ content, onChange, placeholder = 'Empieza a escribir...', minHeight = 400 }: TipTapEditorProps) {
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
      LinkExt.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener' } }),
      Image.configure({ inline: false, allowBase64: false, HTMLAttributes: { class: 'cms-img' } }),
      Youtube.configure({ width: '100%', height: 400, nocookie: true }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'tiptap-content',
        style: `min-height:${minHeight}px;outline:none;padding:1.25rem;font-size:0.95rem;line-height:1.75;`,
      },
    },
  });

  // Sync content when key prop changes (page/post switch)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  if (!editor) return null;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) editor.chain().focus().setImage({ src: data.url }).run();
    } catch { /* ignore */ }
    finally { setUploading(false); e.target.value = ''; }
  }

  function handleImageUrl() {
    const url = prompt('URL de la imagen:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }

  function handleLink() {
    const prev = editor.getAttributes('link').href || '';
    const url = prompt('URL del enlace:', prev);
    if (url === null) return;
    if (url === '') { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  }

  function handleYoutube() {
    const url = prompt('URL de YouTube o Vimeo:');
    if (url) editor.commands.setYoutubeVideo({ src: url });
  }

  function handleColor() {
    const color = prompt('Color hexadecimal:', editor.getAttributes('textStyle').color || '#000000');
    if (color) editor.chain().focus().setColor(color).run();
  }

  const row: React.CSSProperties = {
    display: 'flex', flexWrap: 'wrap', gap: '0.2rem', padding: '0.5rem 0.75rem',
    borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)',
    alignItems: 'center',
  };
  const label: React.CSSProperties = { fontSize: '0.65rem', opacity: 0.45, marginRight: '0.2rem', letterSpacing: '0.05em', textTransform: 'uppercase' };

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>

      {/* Fila 1: Texto */}
      <div style={row}>
        <span style={label}>Texto</span>
        <TBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrita"><b>B</b></TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Cursiva"><i>I</i></TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Subrayado"><u>U</u></TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado"><s>S</s></TBtn>
        <Divider />
        <span style={label}>Tamaño</span>
        <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Título H1">H1</TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Subtítulo H2">H2</TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3">H3</TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive('heading', { level: 4 })} title="H4">H4</TBtn>
        <TBtn onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} title="Párrafo">P</TBtn>
        <Divider />
        <span style={label}>Color</span>
        <TBtn onClick={handleColor} title="Color de texto">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <span>A</span>
            <span style={{ width: 14, height: 3, background: editor.getAttributes('textStyle').color || 'var(--color-text)', borderRadius: 2, display: 'block' }} />
          </div>
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().unsetColor().run()} title="Quitar color">✕</TBtn>
      </div>

      {/* Fila 2: Estructura */}
      <div style={row}>
        <span style={label}>Alinear</span>
        <TBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Izquierda">⬅</TBtn>
        <TBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centro">↔</TBtn>
        <TBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Derecha">➡</TBtn>
        <TBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justificar">≡</TBtn>
        <Divider />
        <span style={label}>Listas</span>
        <TBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista viñetas">• Lista</TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">1. Lista</TBtn>
        <Divider />
        <span style={label}>Bloques</span>
        <TBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Cita">" Cita</TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Código">&lt;/&gt;</TBtn>
        <TBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Separador">— HR</TBtn>
      </div>

      {/* Fila 3: Medios */}
      <div style={row}>
        <span style={label}>Medios</span>
        <label style={{
          padding: '0.3rem 0.6rem', border: '1px solid var(--color-border)', borderRadius: 4,
          cursor: uploading ? 'wait' : 'pointer', fontSize: '0.8rem', fontWeight: 600,
          background: 'transparent', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.3rem',
        }}>
          {uploading ? '⏳ Subiendo...' : '📁 Subir imagen'}
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
        </label>
        <TBtn onClick={handleImageUrl} title="Imagen por URL">🔗 Img URL</TBtn>
        <Divider />
        <span style={label}>Img posición</span>
        <TBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Imagen izquierda">◧ Izq</TBtn>
        <TBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Imagen centro">◫ Centro</TBtn>
        <TBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Imagen derecha">◨ Der</TBtn>
        <Divider />
        <TBtn onClick={handleYoutube} title="Embed YouTube/Vimeo">▶ Video</TBtn>
        <TBtn onClick={handleLink} active={editor.isActive('link')} title="Enlace">🔗 Link</TBtn>
        <TBtn onClick={() => editor.chain().focus().unsetLink().run()} title="Quitar enlace">✕ Link</TBtn>
        <Divider />
        <TBtn onClick={() => editor.chain().focus().undo().run()} title="Deshacer">↩</TBtn>
        <TBtn onClick={() => editor.chain().focus().redo().run()} title="Rehacer">↪</TBtn>
      </div>

      <EditorContent editor={editor} />

      <div style={{ padding: '0.4rem 0.75rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', fontSize: '0.72rem', opacity: 0.5, textAlign: 'right' }}>
        {editor.getText().length} caracteres
      </div>
    </div>
  );
}
