# Text Concatenator - Visual Guide

## Node Interface

```
┌─────────────────────────────────────┐
│   Text Concatenator                 │
├─────────────────────────────────────┤
│ Inputs:                             │
│   ○ text (empty slot)               │  ← Starts with one empty slot
├─────────────────────────────────────┤
│ Parameters:                         │
│   delimiter: [, ]                   │  ← Multiline text field
│   index: [0]                        │  ← Integer (0-999)
├─────────────────────────────────────┤
│ Outputs:                            │
│   ○ concatenated                    │
│   ○ indexed                         │
└─────────────────────────────────────┘
```

## Dynamic Expansion Example

### Step 1: Connect First Input
```
Connect a text node →
                      ┌─────────────────────────┐
                      │   Text Concatenator     │
                      ├─────────────────────────┤
[Text] ──────────────○ text_1                   │
                      │ ○ text (new empty slot) │  ← New slot appears!
                      ├─────────────────────────┤
                      │ delimiter: [, ]         │
                      │ index: [0]              │
                      ├─────────────────────────┤
                      │ ○ concatenated          │
                      │ ○ indexed               │
                      └─────────────────────────┘
```

### Step 2: Connect Second Input
```
                      ┌─────────────────────────┐
                      │   Text Concatenator     │
                      ├─────────────────────────┤
[Text A] ────────────○ text_1                   │
[Text B] ────────────○ text_2                   │
                      │ ○ text (new empty slot) │  ← Always one empty slot
                      ├─────────────────────────┤
                      │ delimiter: [, ]         │
                      │ index: [0]              │
                      ├─────────────────────────┤
                      │ ○ concatenated          │
                      │ ○ indexed               │
                      └─────────────────────────┘
```

### Step 3: Multiple Inputs Connected
```
                      ┌─────────────────────────┐
                      │   Text Concatenator     │
                      ├─────────────────────────┤
[Text A] ────────────○ text_1                   │
[Text B] ────────────○ text_2                   │
[Text C] ────────────○ text_3                   │
[Text D] ────────────○ text_4                   │
                      │ ○ text (new empty slot) │  ← Ready for more!
                      ├─────────────────────────┤
                      │ delimiter: [, ]         │
                      │ index: [0]              │
                      ├─────────────────────────┤
                      │ ○ concatenated          │
                      │ ○ indexed               │
                      └─────────────────────────┘
```

## Output Examples

### Example 1: Simple Concatenation

**Inputs:**
- text_1: "Hello"
- text_2: "World"
- text_3: "ComfyUI"

**Parameters:**
- delimiter: ", "
- index: 0

**Outputs:**
- concatenated: `"Hello, World, ComfyUI"`
- indexed: `"Hello"` (index 0)

---

### Example 2: Newline Delimiter

**Inputs:**
- text_1: "Line 1"
- text_2: "Line 2"
- text_3: "Line 3"

**Parameters:**
- delimiter: "\n"
- index: 1

**Outputs:**
- concatenated:
  ```
  Line 1
  Line 2
  Line 3
  ```
- indexed: `"Line 2"` (index 1)

---

### Example 3: Section Separator

**Inputs:**
- text_1: "Introduction"
- text_2: "Main Content"
- text_3: "Conclusion"

**Parameters:**
- delimiter: "\n---\n"
- index: 2

**Outputs:**
- concatenated:
  ```
  Introduction
  ---
  Main Content
  ---
  Conclusion
  ```
- indexed: `"Conclusion"` (index 2)

---

### Example 4: Prompt Building

**Inputs:**
- text_1: "a beautiful landscape"
- text_2: "oil painting style"
- text_3: "golden hour lighting"
- text_4: "highly detailed"

**Parameters:**
- delimiter: ", "
- index: 0

**Outputs:**
- concatenated: `"a beautiful landscape, oil painting style, golden hour lighting, highly detailed"`
- indexed: `"a beautiful landscape"` (index 0)

## Workflow Patterns

### Pattern 1: Random Selector
```
┌──────────┐
│ Option A │──┐
└──────────┘  │
┌──────────┐  │    ┌─────────────────┐
│ Option B │──┼───○ TextConcatenator │
└──────────┘  │    │   index: [?]    │
┌──────────┐  │    └────────┬────────┘
│ Option C │──┘             │
└──────────┘                │
                            │
┌────────────┐              │
│ Random Int │──────────────┘
│  (0-2)     │
└────────────┘

Use 'indexed' output → Gets random selection
Use 'concatenated' → See all options
```

### Pattern 2: Prompt Assembly
```
┌───────────┐
│ Base      │─────┐
│ Prompt    │     │
└───────────┘     │
┌───────────┐     │    ┌─────────────────┐
│ Style     │─────┼───○ TextConcatenator │
│ Tags      │     │    │  delimiter: ", "│─→ Final Prompt
└───────────┘     │    └─────────────────┘
┌───────────┐     │
│ Quality   │─────┘
│ Tags      │
└───────────┘
```

### Pattern 3: Document Builder
```
┌────────┐
│ Header │────┐
└────────┘    │
┌────────┐    │    ┌─────────────────┐
│ Body   │────┼───○ TextConcatenator │
└────────┘    │    │delimiter: "\n\n"│─→ Document
┌────────┐    │    └─────────────────┘
│ Footer │────┘
└────────┘
```

### Pattern 4: List Builder
```
┌────────────┐
│ Item 1     │────┐
└────────────┘    │
┌────────────┐    │    ┌─────────────────┐
│ Item 2     │────┼───○ TextConcatenator │
└────────────┘    │    │  delimiter: "\n"│─→ Ordered List
┌────────────┐    │    └─────────────────┘
│ Item 3     │────┘
└────────────┘
```

## Key Features Visualized

### 🔗 Dynamic Input Creation
```
Before:                      After Connection:
┌──────────┐                 ┌──────────┐
│ ○ text   │                 │ ● text_1 │ ← Connected
└──────────┘                 │ ○ text   │ ← New empty slot
                             └──────────┘
```

### 🗑️ Automatic Cleanup
```
Before:                      After Disconnect:
┌──────────┐                 ┌──────────┐
│ ● text_1 │ ← Connected     │ ● text_1 │
│ ● text_2 │ ← Connected     │ ○ text   │ ← Renumbered & cleaned
│ ○ text   │                 └──────────┘
└──────────┘
  Disconnect text_2 →
```

### 🔢 Smart Ordering
```
Connection Order:            Internal Order:
text_3 → "third"             text_1 → "first"    ← Sorted!
text_1 → "first"      →      text_2 → "second"
text_2 → "second"            text_3 → "third"
```

### 📝 Multiline Delimiter
```
Delimiter: [      ]  ← Can contain:
           [ ---   ]     • Newlines (\n)
           [      ]      • Tabs (\t)
                         • Multiple lines
                         • Special characters
```

## Tips for Usage

### ✅ Do's
- Connect inputs in any order (auto-sorted)
- Use multiline delimiters for formatting
- Use index to preview individual inputs
- Connect/disconnect freely (auto-cleans)

### ❌ Don'ts
- Don't worry about empty slots (filtered out)
- Don't worry about ordering (handled automatically)
- Don't worry about disconnecting (safe to do)

## Comparison with Fixed Inputs

### ❌ Traditional Fixed Input Node
```
┌─────────────────┐
│ ○ input_1       │ ← Wasted if unused
│ ○ input_2       │ ← Wasted if unused
│ ○ input_3       │ ← Wasted if unused
│ ○ input_4       │ ← Wasted if unused
│ ○ input_5       │ ← Wasted if unused
└─────────────────┘
   Limited to 5!
```

### ✅ Dynamic Input Node (Our Implementation)
```
┌─────────────────┐
│ ● text_1        │ ← Used
│ ● text_2        │ ← Used
│ ○ text          │ ← Ready for more
└─────────────────┘
   Infinite inputs!
   Only shows what you need!
```

## Summary

The Text Concatenator provides:
- 🔄 **Infinite inputs** that expand as needed
- ✂️ **Custom delimiters** with multiline support
- 🔗 **Concatenated output** for combined text
- 🎯 **Indexed output** for specific selection
- 🧹 **Auto-cleanup** when disconnecting
- 📊 **Smart ordering** regardless of connection sequence

Perfect for prompt engineering, document building, and dynamic text assembly!
