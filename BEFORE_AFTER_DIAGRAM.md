# Before and After - Visual Comparison

## Issue 1: Canvas Rendering Overlap

### BEFORE (Problem)
```
┌─────────────────────────────────────┐
│ Advanced LoRA Stacker               │ ← Node Title
├─────────────────────────────────────┤
│ MODEL: [input]                      │ ← Native Widget (30px)
│ CLIP: [input]                       │ ← Native Widget (30px)
│ seed: [12345] [🎲] [↻] [🔢]        │ ← Native Widget + controls (30px + 20px)
├─────────────────────────────────────┤
│ ▼ GROUP 1  [X]                     │ ← Canvas UI starts at 40px
│ │ THIS OVERLAPS WITH SEED WIDGET! │ ← PROBLEM: Overlap!
│ │ Max Model: [1.00]               │
│ │ Max CLIP: [1.00]                │
└─────────────────────────────────────┘
       ↑ Fixed offset (40px) doesn't account 
         for actual widget height (~110px)
```

### AFTER (Fixed)
```
┌─────────────────────────────────────┐
│ Advanced LoRA Stacker               │ ← Node Title
├─────────────────────────────────────┤
│ MODEL: [input]                      │ ← Native Widget (30px)
│ CLIP: [input]                       │ ← Native Widget (30px)
│ seed: [12345] [🎲] [↻] [🔢]        │ ← Native Widget + controls (30px + 20px)
│                                     │ ← Proper spacing
├─────────────────────────────────────┤
│ ▼ GROUP 1                      [X]  │ ← Canvas UI starts at 130px
│ │ Max Model: [1.00]  Max CLIP: [1.00]│ ← No overlap! ✅
│ │   LoRA: [character.safetensors] [X]│
│ │   Type: [Character]              │
│ │   🔒 Model  [LOCK]  🔒 CLIP     │
│ │ + Add LoRA to Group 1           │
└─────────────────────────────────────┘
       ↑ Dynamic offset (130px) calculated from
         actual visible widget count (3 × 30 + 20)
```

---

## Issue 2: Float Input Positioning

### BEFORE (Problem)
```
Screen coordinates (wrong):
┌────────────────────────────────────┐
│ Browser Window                     │
│                                    │
│  [Input appears here!] ← Wrong!   │ ← Used element.bounds.x directly
│                                    │    (node-local coordinates)
│    ┌──────────────────┐           │
│    │ Node at (500,200)│           │
│    │ Max MODEL: [1.00]│ ← Click  │
│    │                  │           │
│    └──────────────────┘           │
└────────────────────────────────────┘

Problem: Coordinates not transformed correctly
- element.bounds.x = 90 (relative to node)
- Input appears at screen position 90
- Should appear at 500 + 90 = 590
```

### AFTER (Fixed)
```
Screen coordinates (correct):
┌────────────────────────────────────┐
│ Browser Window                     │
│                                    │
│                                    │
│    ┌──────────────────┐           │
│    │ Node at (500,200)│           │
│    │ Max MODEL: [1.00]│ ← Click  │
│    │         [1.50]   │ ← Input! ✅│ ← Proper transformation
│    └──────────────────┘           │
└────────────────────────────────────┘

Coordinate Transformation:
1. Node-local: element.bounds.x = 90
2. Canvas: nodeX + bounds.x = 500 + 90 = 590
3. Screen: (canvas + offset) × scale
   = (590 + 0) × 1.0 = 590 ✅

Accounts for:
- Node position (this.pos)
- Canvas pan (graphCanvas.ds.offset)
- Zoom scale (graphCanvas.ds.scale)
```

---

## Issue 3: Dropdown Value Updates

### BEFORE (Problem)
```
User Action:
1. Click on: [character.safetensors]
2. Menu appears with options
3. User selects: "style.safetensors"
4. Menu closes

Result:
Display still shows: [character.safetensors] ← NOT UPDATED! ❌

Why?
LiteGraph.ContextMenu callback:
  v = "style.safetensors"  (string, not object)
  Code tried: v.content    (undefined!)
  widget.value unchanged   ← Problem
```

### AFTER (Fixed)
```
User Action:
1. Click on: [character.safetensors]
2. Menu appears with options
3. User selects: "style.safetensors"
4. Menu closes

Result:
Display updates to: [style.safetensors] ← UPDATED! ✅

Why?
LiteGraph.ContextMenu callback:
  v = "style.safetensors"  (string)
  Code checks: typeof v === 'object' ? v.content : v
  newValue = "style.safetensors"  ← Correct!
  widget.value = newValue         ✅
  widget.callback(newValue)       ✅
  setDirtyCanvas(true, true)      ✅
  Visual updates on next render   ✅
```

---

## Code Flow Comparison

### BEFORE - Float Editing
```
User clicks [1.00]
  ↓
onMouseDown(e, localPos)
  ↓
Find clicked element
  ↓
element.type === 'value'
  ↓
showNumberInput(widget, element)
  ↓
Position calculation:
  x = rect.left + element.bounds.x  ← WRONG!
  y = rect.top + element.bounds.y   ← WRONG!
  ↓
Input appears at wrong position ❌
```

### AFTER - Float Editing
```
User clicks [1.00]
  ↓
onMouseDown(e, localPos)
  ↓
Find clicked element
  ↓
element.type === 'value'
  ↓
showNumberInput(widget, element)
  ↓
Position calculation:
  1. Node-local to canvas:
     canvasX = nodeX + element.bounds.x
     canvasY = nodeY + element.bounds.y
  2. Canvas to screen:
     screenX = rect.left + (canvasX + offsetX) × scale
     screenY = rect.top + (canvasY + offsetY) × scale
  ↓
Input appears at correct position ✅
  ↓
User types new value → Enter
  ↓
widget.value = newValue
widget.callback(newValue)
  ↓
group.max_model = newValue
updateStackData()
setDirtyCanvas(true, true)
  ↓
Canvas redraws with new value ✅
```

---

## Layout Calculation Changes

### BEFORE
```javascript
calculateLayout() {
    let currentY = LAYOUT.TITLE_BAR_HEIGHT; // = 40
    //                    ↑
    //           Fixed, doesn't account
    //           for actual widget height
    
    // Draw groups starting at Y=40
    // This overlaps with widgets! ❌
}
```

### AFTER
```javascript
getCustomRenderingOffset() {
    let offset = LAYOUT.TITLE_BAR_HEIGHT; // = 40
    let visibleWidgetCount = 0;
    
    // Count visible widgets
    for (const widget of this.widgets) {
        if (!widget.groupWidget && 
            widget.type !== "hidden" && 
            computeSize()[1] >= 0) {
            visibleWidgetCount++;
        }
    }
    
    // Add widget space + padding
    offset += (visibleWidgetCount × 30) + 20;
    //         ↑                          ↑
    //    ~30px per widget          control padding
    
    return offset; // = 130 for 3 widgets
}

calculateLayout() {
    let currentY = this.getCustomRenderingOffset();
    //                    ↑
    //             Dynamic calculation
    //             accounts for actual height
    
    // Draw groups starting at Y=130
    // No overlap with widgets! ✅
}
```

---

## Widget Callback Improvements

### BEFORE - Group Max Model
```javascript
maxModelWidget.widget.callback = () => {
    group.max_model = maxModelWidget.widget.value;
    //                              ↑
    //                    Reading from widget
    //                    (works but indirect)
};
```

### AFTER - Group Max Model
```javascript
maxModelWidget.widget.callback = (value) => {
    group.max_model = value;
    //                ↑
    //         Direct parameter
    //         (cleaner, more reliable)
};
```

---

## Summary of Changes

| Issue | Before | After | Lines Changed |
|-------|--------|-------|---------------|
| Canvas Overlap | Fixed 40px offset | Dynamic calculation | +28 (new method) |
| Float Editing | Wrong coordinates | Proper transformation | +22 (modified) |
| Dropdown Updates | Value extraction bug | Handle both types | +3 (modified) |
| Widget Callbacks | Indirect reading | Direct parameter | +2 (modified) |

**Total**: ~65 lines changed/added
**Impact**: All three critical issues resolved
**Breaking Changes**: None
**Compatibility**: Fully backward compatible
