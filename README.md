# Advanced LoRA Stacker

A comprehensive ComfyUI custom node collection that includes:
1. **Advanced LoRA Stacker**: Dynamic UI with LoRA preset functionality and sophisticated group-based random strength distribution
2. **Text Concatenator**: Infinite dynamic text input concatenation with indexing support

**NEW in v2.0**: Complete UI redesign using **native ComfyUI widgets** for better performance, maintainability, and compatibility!

## Nodes

### Advanced LoRA Stacker

#### 🎯 Core Functionality

- **Dynamic UI**: Native ComfyUI widgets with "Add LoRA" and "Add Group" buttons
- **LoRA Presets**: Five preset types targeting specific model blocks
- **Group Management**: Organize LoRAs into groups with shared max strengths
- **Random Strength Distribution**: Automatically partition strength values across grouped LoRAs
- **Individual Randomization**: Per-LoRA randomization controls for ungrouped LoRAs
- **Lock System**: Lock specific strength values while randomizing others
- **Collapsible Groups**: Expand/collapse groups to manage UI space
- **Native Rendering**: All UI elements use ComfyUI's standard widgets (no custom canvas drawing)

### Text Concatenator

#### 🔗 Core Functionality

- **Infinite Dynamic Inputs**: Automatically reveals new text input connections as you plug them in
- **Custom Delimiter**: Multiline text field for flexible separators (commas, newlines, custom strings)
- **Concatenated Output**: Joins all connected text inputs with the specified delimiter
- **Indexed Output**: Access any specific input by index (0-based)
- **Smart Ordering**: Maintains proper order even when inputs are connected out of sequence

### 📋 LoRA Preset Types

1. **Full**: Apply to all blocks (standard LoRA application)
2. **Character**: Target blocks 4-11 (middle to output blocks)
3. **Style**: Target blocks 0-5 (input to middle blocks)
4. **Concept**: Target blocks 6-11 (output blocks)
5. **Fix Hands/Anatomy**: Target blocks 8-11 (late output blocks)

### 🎲 Random Partitioning Algorithm

The node uses a "stick-breaking" method for random strength distribution:

1. Generates n-1 random cut points between 0 and 1
2. Sorts cut points and calculates segments as differences
3. Rounds to 4 decimal places for precision
4. Fixes rounding errors by adjusting the largest segment
5. Respects locked values by subtracting them before partitioning
6. Uses seed-based random generation for reproducibility

## Installation

1. Navigate to your ComfyUI custom nodes directory:
   ```bash
   cd ComfyUI/custom_nodes/
   ```

2. Clone this repository:
   ```bash
   git clone https://github.com/tomtom604/advanced_LoRA_stacker.git
   ```

3. Restart ComfyUI

## Usage

### Getting Started

1. Add the "Advanced LoRA Stacker" node to your workflow
2. Connect MODEL and CLIP inputs from your checkpoint loader
3. The node starts with a minimal interface showing:
   - MODEL and CLIP input connectors
   - Seed parameter (auto-randomizes each run)
   - ➕ Add LoRA button
   - ➕ Add Group button

### Working with Groups

#### Creating a Group

1. Click "➕ Add Group" button
2. A collapsible group container appears with:
   - Group header with collapse/expand button (▼/▶)
   - Remove button (✕)
   - Max MODEL Strength parameter
   - Max CLIP Strength parameter
   - "➕ Add LoRA to Group N" button

#### Adding LoRAs to a Group

1. Click "➕ Add LoRA to Group N" within the group
2. Configure each grouped LoRA:
   - Select LoRA file from dropdown
   - Choose Type/Preset
   - Lock MODEL checkbox (shows current runtime strength)
   - Lock CLIP checkbox (shows current runtime strength)
   - When locked, enter the specific locked value

#### How Group Random Distribution Works

1. Set Max MODEL Strength (e.g., 1.0) and Max CLIP Strength (e.g., 1.0)
2. Add multiple LoRAs to the group
3. On execution, the node:
   - Identifies locked values and subtracts from max strength
   - Randomly partitions remaining strength across unlocked LoRAs
   - Displays assigned values in console output

**Example**: Three LoRAs in a group with Max MODEL = 1.0
- LoRA1: unlocked → gets 0.12
- LoRA2: locked at 0.30 → stays 0.30
- LoRA3: unlocked → gets 0.58
- Total: 0.12 + 0.30 + 0.58 = 1.00

### Working with Ungrouped LoRAs

#### Adding an Ungrouped LoRA

1. Click "➕ Add LoRA" (main button at top)
2. Configure the LoRA:
   - Select LoRA file
   - Choose Type/Preset
   - Set MODEL Strength (or enable randomization)
   - Set CLIP Strength (or enable randomization)

#### Using Randomization for Solo LoRAs

1. Enable "Random MODEL" checkbox
   - Shows Min MODEL and Max MODEL inputs
   - Each run generates random value within range
2. Enable "Random CLIP" checkbox
   - Shows Min CLIP and Max CLIP inputs
   - Each run generates random value within range
3. Disable checkboxes to use fixed strength values

### Understanding the Seed Parameter

- **control_after_generate** set to "randomize"
- Automatically generates new seed after each execution
- Ensures different random distributions each run
- Can be fixed for reproducible results

## UI Layout Structure

### Visual Hierarchy (Native Widgets)

```
┌─────────────────────────────────────┐
│ MODEL input                         │
│ CLIP input                          │
│ Seed parameter                      │
├─────────────────────────────────────┤
│ ═══ GROUP 1 ═══                     │
│ ▼ Collapse                          │
│ ✕ Remove Group                      │
│ Max MODEL: [1.0]                    │
│ Max CLIP: [1.0]                     │
│ ➕ Add LoRA to Group 1              │
│ ───────────                         │
│   LoRA: [dropdown]                  │
│   Type: [dropdown]                  │
│   Lock MODEL: [toggle]              │
│     Value: [0.50]                   │
│   Lock CLIP: [toggle]               │
│ ───────────                         │
│   LoRA: [dropdown]                  │
│   Type: [dropdown]                  │
├─────────────────────────────────────┤
│ ═══ GROUP 2 ═══                     │
│ ▶ Expand (collapsed)                │
├─────────────────────────────────────┤
│ ➕ Add LoRA                          │
│ ➕ Add Group                         │
├─────────────────────────────────────┤
│ ───────────                         │
│ LoRA: [dropdown]                    │
│ Type: [dropdown]                    │
│ MODEL Str: [1.0]                    │
│   Random: [toggle]                  │
│     Min: [0.0]                      │
│     Max: [1.0]                      │
│ CLIP Str: [1.0]                     │
│   Random: [toggle]                  │
│ ✕ Remove                            │
└─────────────────────────────────────┘
```

### Design Principles

- **Native ComfyUI Widgets**: All standard widget types
- **Vertical Stacking**: Natural ComfyUI layout
- **Visual Separators**: Text widgets for headers (═══) and dividers (───)
- **Indentation**: Names with spaces for hierarchy ("  LoRA" vs "LoRA")
- **Dynamic Show/Hide**: Widgets appear/disappear based on toggles
- **Collapsible Groups**: Click collapse button to hide group contents
- **Clean & Organized**: Logical grouping of related controls

## Console Output

The node provides detailed execution logs:

```
================================================================================
Advanced LoRA Stacker - Execution
================================================================================
Seed: 12345

────────────────────────────────────────────────────────────────────────────────
Group 1
  Max MODEL strength: 1.0000
  Max CLIP strength: 1.0000
────────────────────────────────────────────────────────────────────────────────
  ✓ character_lora.safetensors
    Type: Character
    MODEL: 0.3521  CLIP: 0.4123
  ✓ style_lora.safetensors
    Type: Style
    MODEL: 0.6479  CLIP: 0.5877 [MODEL locked]

────────────────────────────────────────────────────────────────────────────────
Ungrouped LoRAs
────────────────────────────────────────────────────────────────────────────────
  ✓ hands_fix.safetensors
    Type: Fix Hands
    MODEL: 0.7234  CLIP: 0.8912 [MODEL random, CLIP random]
================================================================================
```

## Technical Details

### Python Backend (`advanced_lora_stacker.py`)

**Key Methods**:
- `partition_strengths()`: Implements stick-breaking random partitioning
- `apply_lora_with_preset()`: Applies LoRA with block targeting
- `apply_loras()`: Main execution function

**Inputs**:
- `model`: MODEL type
- `clip`: CLIP type
- `seed`: INT with auto-randomize
- `stack_data`: STRING (hidden, stores JSON configuration)

**Outputs**:
- `model`: Processed MODEL
- `clip`: Processed CLIP
- `info`: STRING summary of applied LoRAs

### JavaScript Frontend (`js/advanced_lora_stacker.js`)

**Design**: Native ComfyUI widgets with minimal JavaScript (v2.0 redesign)

**Key Functions**:
- `addGroup()`: Creates group with native widgets
- `removeGroup()`: Removes group and members
- `addLora(groupId)`: Adds LoRA with native controls
- `removeLora(loraId)`: Removes individual LoRA
- `updateStackData()`: Serializes state to JSON
- `fetchLoraList()`: Fetches available LoRAs via API

**Widget Types Used**:
- `text`: Headers and visual separators
- `combo`: LoRA selection and preset dropdowns
- `number`: Strength values with sliders
- `toggle`: Lock and Random checkboxes
- `button`: Add/Remove actions

**Data Structure**:
```json
{
  "groups": [
    {
      "id": 1,
      "index": 1,
      "max_model": 1.0,
      "max_clip": 1.0
    }
  ],
  "loras": [
    {
      "id": 1,
      "group_id": 1,
      "name": "lora_name.safetensors",
      "preset": "Character",
      "lock_model": false,
      "locked_model_value": 0.0,
      "lock_clip": true,
      "locked_clip_value": 0.5
    }
  ]
}
```

### UI Redesign (v2.0)

The node has been completely redesigned to use **native ComfyUI widgets** instead of custom canvas rendering:

- **70% less code**: Simplified from 1654 to 494 lines of JavaScript
- **No canvas rendering**: ComfyUI handles all visual rendering
- **No custom mouse handlers**: Native widget interactions
- **Better performance**: Optimized native rendering
- **Better accessibility**: Keyboard navigation, screen readers
- **Better compatibility**: No custom rendering to break

For details, see [NATIVE_WIDGET_REDESIGN.md](NATIVE_WIDGET_REDESIGN.md)

## Workflow Examples

### Example 1: Character with Multiple Styles

1. Create Group 1 for character LoRAs (Max: 1.0/1.0)
   - Add main_character.safetensors (Character preset)
   - Add character_details.safetensors (Character preset)
2. Create Group 2 for style LoRAs (Max: 0.8/0.8)
   - Add anime_style.safetensors (Style preset)
   - Add lighting_style.safetensors (Style preset)
3. Add ungrouped hands_fix.safetensors (Fix Hands preset)
   - Random MODEL: 0.5-0.8
   - Random CLIP: 0.5-0.8

### Example 2: Exploring Style Combinations

1. Create Group 1 with 5 style LoRAs (Max: 1.0/1.0)
2. Run multiple times with different seeds
3. Console output shows which combination was used
4. Lock successful combinations for future use

### Example 3: Fine-tuning Character Strength

1. Add character LoRA ungrouped
2. Enable Random MODEL: 0.6-0.9
3. Enable Random CLIP: 0.7-1.0
4. Run multiple times to find sweet spot
5. Once found, disable random and set fixed value

## Text Concatenator Usage

The Text Concatenator node provides a simple and powerful way to combine multiple text inputs with custom delimiters.

### Getting Started

1. Add the "Text Concatenator" node to your workflow
2. The node starts with:
   - **delimiter**: Text field for custom separator (default: ", ")
   - **index**: Integer to select specific input (default: 0)
   - One empty text input slot
   - Two outputs: **concatenated** and **indexed**

### How It Works

1. **Connect a text input** - When you connect a text source to the input slot, a new empty slot automatically appears below it
2. **Keep adding inputs** - Connect as many text inputs as you need; new slots keep appearing
3. **Disconnect to remove** - Disconnecting an input automatically removes that slot and renumbers remaining inputs

### Parameters

- **delimiter**: The text to place between concatenated inputs
  - Multiline support for complex separators
  - Examples: `", "`, `"\n"`, `" | "`, `"\n---\n"`
- **index**: Zero-based index to select a specific input
  - 0 = first input, 1 = second input, etc.
  - Returns empty string if index is out of range

### Outputs

- **concatenated**: All text inputs joined with the delimiter
  - Example: `"Hello, World, Test"` with delimiter `", "`
- **indexed**: The specific text at the selected index
  - Example: index=1 returns `"World"` from the above inputs

### Example Workflows

#### Example 1: Building a Prompt

1. Connect multiple text sources (base prompt, style tags, quality tags)
2. Set delimiter to `", "`
3. Use **concatenated** output as your final prompt
4. Use **indexed** output to preview individual components

#### Example 2: Multi-line Text Assembly

1. Connect text sources for different sections
2. Set delimiter to `"\n\n"` (double newline)
3. Creates a properly formatted multi-paragraph text

#### Example 3: Template Building

1. Connect template parts (header, body, footer)
2. Set delimiter to `"\n---\n"` (horizontal rule separator)
3. Build structured documents with clear sections

#### Example 4: Random Selection with Indexing

1. Connect multiple text variations
2. Use a random integer node to set the **index** parameter
3. The **indexed** output will randomly select one of the inputs
4. The **concatenated** output shows all options (useful for debugging)

### Tips

- **Empty/None inputs are automatically skipped** - No need to worry about blank entries
- **Inputs are automatically ordered** - text_1, text_2, text_3, etc., regardless of connection order
- **Use multiline delimiter** - Perfect for creating formatted output with newlines, sections, or custom markup
- **Access any input by index** - Makes the node multi-functional (concatenator + selector)

## Troubleshooting

### LoRAs Not Appearing in Dropdown

- Ensure LoRAs are in `ComfyUI/models/loras/` directory
- Restart ComfyUI to refresh LoRA list
- Check browser console for API errors

### Node Not Applying LoRAs

- Check console output for error messages
- Verify LoRA files are not corrupted
- Ensure MODEL and CLIP inputs are connected

### Groups Not Displaying Correctly

- Try collapsing and expanding the group
- Check that all widgets are visible
- Restart ComfyUI if issues persist

### Random Distribution Not Working

- Verify seed parameter is changing between runs
- Check that unlocked LoRAs exist in group
- Review console output for assigned values

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project follows the same license as ComfyUI.

## Credits

Inspired by:
- **rgthree's Power Lora Loader**: Dynamic UI concept
- **Bob's LoRA Loader (FLUX)**: Preset functionality
- **Random Partitioning Algorithm**: Stick-breaking method
- **cozy_ex_dynamic by amorano**: Dynamic input pattern for ComfyUI nodes

## Changelog

### v2.1 (TextConcatenator Addition)
- **New Node: Text Concatenator**
  - Infinite dynamic text inputs
  - Auto-expanding input slots as connections are made
  - Custom multiline delimiter support
  - Concatenated output (all inputs joined)
  - Indexed output (access individual inputs by index)
  - Comprehensive test suite with 8 test cases

### v1.0.0 (Initial Release)
- Dynamic expandable UI with groups
- LoRA preset system (Full, Character, Style, Concept, Fix Hands)
- Group-based random strength distribution
- Individual LoRA randomization controls
- Lock system for precise control
- Collapsible groups
- Comprehensive console output
- Seed-based reproducibility
