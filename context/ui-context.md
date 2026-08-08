# UI Context

## Theme

The design language is professional, clear, and trustworthy, reflecting a legal tech application. It uses a clean, light mode interface with high contrast for readability, subtle interactive states, and distinct visual hierarchy to guide users through complex document reviews.

## Colors

All components must use these tokens (configured in Tailwind) — no hardcoded hex values.

| Role            | CSS Variable       | Value     |
| --------------- | ------------------ | --------- |
| Page background | `--bg-base`        | `#FCFAF7` |
| Surface         | `--bg-surface`     | `#FFFFFF` |
| Primary text    | `--text-primary`   | `#1E2229` |
| Muted text      | `--text-muted`     | `#6B7280` |
| Primary accent  | `--accent-primary` | `#D95420` |
| Border          | `--border-default` | `#EAE3D9` |
| Error           | `--state-error`    | `#DC2626` |
| Success         | `--state-success`  | `#059669` |
| Warning         | `--state-warning`  | `#D97706` |

## Typography

| Role      | Font                | Variable      |
| --------- | ------------------- | ------------- |
| UI text   | Inter / System Sans | `--font-sans` |
| Display   | Playfair Display    | `--font-display`|
| Research  | Lora (Serif)        | `--font-serif`|
| Code/mono | Fira Code / Mono    | `--font-mono` |

## Border Radius

| Context           | Class      |
| ----------------- | ---------- |
| Buttons / Inputs  | `rounded-md` |
| Cards / panels    | `rounded-lg` |
| Modals / overlays | `rounded-xl` |

## Layout Patterns

- **Dashboard:** Sidebar navigation on the left, main content area on the right.
- **Document Review:** Split view (original text on the left, AI interpretations/contract generation on the right).
- **Modals:** Centered overlay with a semi-transparent dark backdrop for confirmations and complex settings.

## Icons

Use Lucide React. Stroke-based icons only. 
- Sizes: `h-4 w-4` for inline text, `h-5 w-5` for standard buttons and navigation.