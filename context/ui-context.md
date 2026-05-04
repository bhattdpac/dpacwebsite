# UI Context

## Theme

The design language is professional, clear, and trustworthy, reflecting a legal tech application. It uses a clean, light mode interface with high contrast for readability, subtle interactive states, and distinct visual hierarchy to guide users through complex document reviews.

## Colors

All components must use these tokens (configured in Tailwind) — no hardcoded hex values.

| Role            | CSS Variable       | Value     |
| --------------- | ------------------ | --------- |
| Page background | `--bg-base`        | `#F9FAFB` |
| Surface         | `--bg-surface`     | `#FFFFFF` |
| Primary text    | `--text-primary`   | `#111827` |
| Muted text      | `--text-muted`     | `#6B7280` |
| Primary accent  | `--accent-primary` | `#2563EB` |
| Border          | `--border-default` | `#E5E7EB` |
| Error           | `--state-error`    | `#EF4444` |
| Success         | `--state-success`  | `#10B981` |
| Warning         | `--state-warning`  | `#F59E0B` |

## Typography

| Role      | Font                | Variable      |
| --------- | ------------------- | ------------- |
| UI text   | Inter / System Sans | `--font-sans` |
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