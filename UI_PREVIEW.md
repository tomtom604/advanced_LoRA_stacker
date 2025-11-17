# Advanced LoRA Stacker - Native Widget UI Preview

## Overview

This document provides a visual preview of the new native widget-based UI. The redesign maintains all functionality while using ComfyUI's standard widget rendering.

## Node Appearance

### Empty Node (Initial State)

```
╔═══════════════════════════════════════════════╗
║ Advanced LoRA Stacker                         ║
╟───────────────────────────────────────────────╢
║ ● MODEL                                       ║
║ ● CLIP                                        ║
║ seed [0] 🎲                                   ║
║                                               ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ➕ Add LoRA                              │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ➕ Add Group                             │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ● model                                       ║
║ ● clip                                        ║
║ ● info                                        ║
╚═══════════════════════════════════════════════╝
```

### With One Group (Expanded)

```
╔═══════════════════════════════════════════════╗
║ Advanced LoRA Stacker                         ║
╟───────────────────────────────────────────────╢
║ ● MODEL                                       ║
║ ● CLIP                                        ║
║ seed [0] 🎲                                   ║
║                                               ║
║ ═══ GROUP 1 ═══                               ║
║                                               ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ▼ Collapse                               │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ✕ Remove Group                           │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ Max MODEL       [1.00] ⟳                      ║
║ Max CLIP        [1.00] ⟳                      ║
║                                               ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ➕ Add LoRA to Group 1                   │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ➕ Add LoRA                              │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ➕ Add Group                             │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ● model                                       ║
║ ● clip                                        ║
║ ● info                                        ║
╚═══════════════════════════════════════════════╝
```

### Group with Grouped LoRA

```
╔═══════════════════════════════════════════════╗
║ Advanced LoRA Stacker                         ║
╟───────────────────────────────────────────────╢
║ ● MODEL                                       ║
║ ● CLIP                                        ║
║ seed [42] 🎲                                  ║
║                                               ║
║ ═══ GROUP 1 ═══                               ║
║                                               ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ▼ Collapse                               │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ✕ Remove Group                           │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ Max MODEL       [1.00] ⟳                      ║
║ Max CLIP        [1.00] ⟳                      ║
║                                               ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ➕ Add LoRA to Group 1                   │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ───────────                                   ║
║   LoRA          [character_lora.safetensors ▼]║
║   Type          [Character ▼]                 ║
║   Lock MODEL    ☐                             ║
║   Lock CLIP     ☑                             ║
║     Value       [0.50] ⟳                      ║
║                                               ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ✕ Remove                                 │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ➕ Add LoRA                              │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ➕ Add Group                             │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ● model                                       ║
║ ● clip                                        ║
║ ● info                                        ║
╚═══════════════════════════════════════════════╝
```

### Ungrouped LoRA with Random

```
╔═══════════════════════════════════════════════╗
║ Advanced LoRA Stacker                         ║
╟───────────────────────────────────────────────╢
║ ● MODEL                                       ║
║ ● CLIP                                        ║
║ seed [12345] 🎲                               ║
║                                               ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ➕ Add LoRA                              │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ➕ Add Group                             │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ───────────                                   ║
║ LoRA            [style_lora.safetensors ▼]    ║
║ Type            [Style ▼]                     ║
║ MODEL Str       [0.80] ⟳                      ║
║   Random        ☑                             ║
║     Min         [0.50] ⟳                      ║
║     Max         [1.00] ⟳                      ║
║ CLIP Str        [0.80] ⟳                      ║
║   Random        ☐                             ║
║                                               ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ✕ Remove                                 │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ● model                                       ║
║ ● clip                                        ║
║ ● info                                        ║
╚═══════════════════════════════════════════════╝
```

### Complex Configuration

```
╔═══════════════════════════════════════════════╗
║ Advanced LoRA Stacker                         ║
╟───────────────────────────────────────────────╢
║ ● MODEL                                       ║
║ ● CLIP                                        ║
║ seed [99999] 🎲                               ║
║                                               ║
║ ═══ GROUP 1 ═══                               ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ▼ Collapse                               │ ║
║ └───────────────────────────────────────────┘ ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ✕ Remove Group                           │ ║
║ └───────────────────────────────────────────┘ ║
║ Max MODEL       [1.00] ⟳                      ║
║ Max CLIP        [1.00] ⟳                      ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ➕ Add LoRA to Group 1                   │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ───────────                                   ║
║   LoRA          [char1.safetensors ▼]         ║
║   Type          [Character ▼]                 ║
║   Lock MODEL    ☐                             ║
║   Lock CLIP     ☐                             ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ✕ Remove                                 │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ───────────                                   ║
║   LoRA          [char2.safetensors ▼]         ║
║   Type          [Character ▼]                 ║
║   Lock MODEL    ☑                             ║
║     Value       [0.30] ⟳                      ║
║   Lock CLIP     ☐                             ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ✕ Remove                                 │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ═══ GROUP 2 ═══                               ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ▶ Expand                                 │ ║
║ └───────────────────────────────────────────┘ ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ✕ Remove Group                           │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ➕ Add LoRA                              │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ➕ Add Group                             │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ───────────                                   ║
║ LoRA            [hands_fix.safetensors ▼]     ║
║ Type            [Fix Hands ▼]                 ║
║ MODEL Str       [0.75] ⟳                      ║
║   Random        ☑                             ║
║     Min         [0.60] ⟳                      ║
║     Max         [0.90] ⟳                      ║
║ CLIP Str        [0.75] ⟳                      ║
║   Random        ☑                             ║
║     Min         [0.60] ⟳                      ║
║     Max         [0.90] ⟳                      ║
║ ┌───────────────────────────────────────────┐ ║
║ │  ✕ Remove                                 │ ║
║ └───────────────────────────────────────────┘ ║
║                                               ║
║ ● model                                       ║
║ ● clip                                        ║
║ ● info                                        ║
╚═══════════════════════════════════════════════╝
```

## Widget Type Reference

### Text Widgets (Read-only)
```
═══ GROUP 1 ═══     <- Group header
───────────         <- Separator line
```
These are disabled text widgets used as visual separators.

### Button Widgets
```
┌───────────────────────────────────────────┐
│  ➕ Add LoRA                              │  <- Green button
└───────────────────────────────────────────┘

┌───────────────────────────────────────────┐
│  ✕ Remove                                 │  <- Red button
└───────────────────────────────────────────┘

┌───────────────────────────────────────────┐
│  ▼ Collapse                               │  <- Gray button
└───────────────────────────────────────────┘
```
All buttons use ComfyUI's native button widget with hover effects.

### Combo Widgets (Dropdowns)
```
LoRA            [character_lora.safetensors ▼]
Type            [Character ▼]
```
Native ComfyUI combo widgets with:
- Click to open dropdown
- Search/filter capability
- Keyboard navigation (arrows, Enter)
- Esc to close

### Number Widgets
```
Max MODEL       [1.00] ⟳
MODEL Str       [0.80] ⟳
    Min         [0.50] ⟳
```
Native ComfyUI number widgets with:
- Click to type exact value
- Drag to adjust smoothly
- Scroll wheel to increment/decrement
- Shift+drag for fine adjustment
- Ctrl+drag for coarse adjustment

### Toggle Widgets (Checkboxes)
```
Lock MODEL      ☐       <- Unchecked
Lock CLIP       ☑       <- Checked
  Random        ☑       <- Checked
```
Native ComfyUI toggle widgets:
- Click to toggle on/off
- Space bar when focused
- Visual checked/unchecked states

## Interaction Examples

### Adding a Group
1. Click "➕ Add Group" button
2. Group appears with header and controls
3. Can immediately add LoRAs or adjust max strengths
4. Can collapse with "▼ Collapse" button

### Adding a LoRA to Group
1. Click "➕ Add LoRA to Group N" button
2. LoRA section appears with separator line
3. Select LoRA from dropdown
4. Choose preset type
5. Toggle locks as needed
6. When locked, value input appears

### Adding Ungrouped LoRA
1. Click "➕ Add LoRA" button (main one)
2. LoRA section appears
3. Configure strengths directly
4. Toggle Random for min/max inputs
5. Can adjust all values independently

### Adjusting Number Values
**Method 1: Type**
1. Click on number value
2. Type exact value
3. Press Enter

**Method 2: Drag**
1. Click and drag number value
2. Left/right to increase/decrease
3. Release when desired

**Method 3: Scroll**
1. Hover over number value
2. Scroll wheel up/down
3. Value changes by step amount

### Toggling Options
**Lock/Random:**
1. Click checkbox to toggle
2. When checked, additional inputs appear
3. When unchecked, additional inputs hide

## Layout Characteristics

### Vertical Stacking
All widgets stack vertically - this is ComfyUI's standard layout. Cannot put widgets side-by-side on the same row.

### Indentation
Hierarchy is shown through name indentation:
```
LoRA              <- No indent (level 0)
  LoRA            <- Single indent (level 1, part of group)
  Lock MODEL      <- Single indent (level 1)
    Value         <- Double indent (level 2, sub-option)
```

### Visual Grouping
Related controls are grouped using:
1. **Headers**: `═══ GROUP 1 ═══`
2. **Separators**: `───────────`
3. **Indentation**: Space prefix in names
4. **Proximity**: Related widgets close together

### Responsive Sizing
- Node width: Fixed at creation (typically 450px)
- Node height: Grows/shrinks dynamically
- Widgets: Fill available width
- Text: Truncates with ellipsis if too long

## Color Scheme

Colors are handled by ComfyUI's theme system:

### Dark Theme (Default)
- Background: Dark gray/blue
- Text: White/light gray
- Buttons: Themed colors
- Widgets: Dark with light borders
- Focus: Blue highlight

### Light Theme
- Background: Light gray/white
- Text: Dark gray/black
- Buttons: Themed colors
- Widgets: Light with dark borders
- Focus: Blue highlight

**Note**: The node automatically adapts to ComfyUI's active theme.

## Accessibility Features

### Keyboard Navigation
- **Tab**: Move to next widget
- **Shift+Tab**: Move to previous widget
- **Enter**: Activate button/dropdown
- **Space**: Toggle checkbox
- **Arrows**: Navigate dropdown options
- **Esc**: Close dropdown/cancel

### Screen Reader Support
All widgets have proper ARIA labels and roles:
- Buttons announce their purpose
- Combos announce their values
- Numbers announce their values and ranges
- Toggles announce their checked state

### Focus Indicators
Native focus rings show which widget is active:
- Blue outline around focused widget
- Visible in all themes
- Works with keyboard navigation

## Comparison with Old UI

### Old (Canvas-Based)
- Custom drawn everything
- Non-standard appearance
- May not match theme
- No native accessibility
- Complex to maintain

### New (Native Widgets)
- Standard ComfyUI widgets
- Matches theme automatically
- Native look and feel
- Full accessibility support
- Simple to maintain

## Notes for Testing

When testing in ComfyUI:

1. **Visual Appearance**: Should look like standard ComfyUI
2. **Interactions**: All native (click, drag, keyboard)
3. **Theme Adaptation**: Switches with ComfyUI theme
4. **Performance**: Smooth, no lag
5. **Zoom**: Widgets scale correctly with canvas zoom
6. **Saving**: Workflow saves all configurations
7. **Loading**: Workflow restores all settings

## Future Enhancements

Possible additions (all using native widgets):

1. **Up/Down Buttons**: Reorder LoRAs
2. **Duplicate Button**: Clone configuration
3. **Preset Manager**: Save/load configurations
4. **Batch Toggle**: Enable/disable multiple LoRAs
5. **Search**: Filter long LoRA lists

All additions would maintain the native widget approach.
