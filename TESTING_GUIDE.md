# UI Redesign Testing Guide

## Overview
This guide helps test the redesigned UI for the Advanced LoRA Stacker node.

## Pre-Testing Setup

1. **Backup existing workflows** that use the Advanced LoRA Stacker
2. **Restart ComfyUI** after applying the changes
3. **Clear browser cache** to ensure JavaScript updates are loaded

## Visual Inspection Tests

### Test 1: Initial Node Appearance
**Steps:**
1. Add "Advanced LoRA Stacker" node to canvas
2. Observe initial state

**Expected Result:**
- Node shows seed parameter (standard ComfyUI widget)
- Two green buttons at bottom: "+ Add LoRA" and "+ Add Group"
- Node size approximately 450x140 pixels
- Dark theme matching ComfyUI

**Screenshot Location:** (Take screenshot here)

### Test 2: Group Creation
**Steps:**
1. Click "+ Add Group" button
2. Observe the group container

**Expected Result:**
- Blue-gray rounded container appears
- Header shows "▼ GROUP 1" in gold text
- Red X button on right side of header
- "Max Model: [1.00]" and "Max CLIP: [1.00]" controls visible
- Green "+ Add LoRA" button inside group
- Blue border around group

**Screenshot Location:** (Take screenshot here)

### Test 3: Grouped LoRA
**Steps:**
1. Click "+ Add LoRA" inside a group
2. Observe the LoRA container

**Expected Result:**
- Lighter blue-gray container inside group (indented)
- LoRA dropdown showing available LoRAs
- Red X button on right
- Second row shows "Type:" dropdown and lock controls
- Lock icons: "🔒Model" and "🔒CLIP" with values

**Screenshot Location:** (Take screenshot here)

### Test 4: Ungrouped LoRA
**Steps:**
1. Click main "+ Add LoRA" button (not in a group)
2. Observe the ungrouped LoRA

**Expected Result:**
- Dark gray container (not indented)
- Row 1: LoRA dropdown + X button
- Row 2: "MODEL: [1.00] Min: [0.0] 🎲"
- Row 3: "CLIP: [1.00] Min: [0.0] 🎲"
- Row 4: "Type: [Full]"

**Screenshot Location:** (Take screenshot here)

## Interaction Tests

### Test 5: Hover Effects
**Steps:**
1. Hover mouse over various buttons
2. Observe cursor and button appearance

**Expected Result:**
- Cursor changes to pointer over buttons
- Button color brightens on hover
- Smooth visual feedback

**Pass/Fail:** ______

### Test 6: Group Collapse/Expand
**Steps:**
1. Click the "▼" button in group header
2. Observe the group

**Expected Result:**
- Arrow changes to "▶"
- Group contents hidden
- Node height decreases
- Click again to expand

**Pass/Fail:** ______

### Test 7: Remove Group
**Steps:**
1. Create a group with some LoRAs
2. Click red X button on group header
3. Observe

**Expected Result:**
- Entire group removed
- All LoRAs in group removed
- Remaining groups renumbered
- Node height adjusts

**Pass/Fail:** ______

### Test 8: Remove LoRA
**Steps:**
1. Create a LoRA (grouped or ungrouped)
2. Click red X button on LoRA
3. Observe

**Expected Result:**
- LoRA removed
- Container removed
- Node height adjusts
- Other LoRAs unaffected

**Pass/Fail:** ______

### Test 9: Lock Toggle (Grouped LoRA)
**Steps:**
1. Add a LoRA to a group
2. Click "🔒Model" toggle
3. Observe

**Expected Result:**
- Toggle color changes (gray → orange when active)
- Value displayed next to lock
- Can click again to unlock

**Pass/Fail:** ______

### Test 10: Random Toggle (Ungrouped LoRA)
**Steps:**
1. Add an ungrouped LoRA
2. Click "🎲" toggle for MODEL
3. Observe

**Expected Result:**
- Toggle color changes (gray → purple when active)
- Indicates random mode is enabled

**Pass/Fail:** ______

## Functional Tests

### Test 11: Workflow Execution
**Steps:**
1. Create a complete workflow:
   - Add checkpoint loader
   - Add Advanced LoRA Stacker
   - Add at least one group with two LoRAs
   - Add one ungrouped LoRA
   - Connect to model/clip outputs
2. Queue prompt

**Expected Result:**
- Workflow executes successfully
- Console shows LoRA application details
- Group random partitioning works
- Ungrouped LoRA applies with fixed/random values

**Console Output:** (Paste relevant console output)

**Pass/Fail:** ______

### Test 12: Save and Load Workflow
**Steps:**
1. Create a workflow with various groups and LoRAs
2. Save workflow as JSON
3. Reload ComfyUI
4. Load saved workflow
5. Verify all settings preserved

**Expected Result:**
- All groups load correctly
- All LoRAs load with correct names
- All toggle states preserved
- All numeric values preserved
- Layout renders correctly

**Pass/Fail:** ______

### Test 13: Group Random Partitioning
**Steps:**
1. Create group with Max MODEL = 1.0
2. Add 3 LoRAs to group
3. Don't lock any values
4. Execute multiple times with different seeds

**Expected Result:**
- Console shows different strength values each time
- All three LoRAs get different strengths
- Sum of strengths equals 1.0 (within rounding)
- Values change with seed

**Example Console Output:**
```
Group 1 - Processing 3 LoRA(s)
  Max MODEL strength: 1.0000
  ✓ lora1.safetensors
    MODEL: 0.2341  CLIP: 0.4123
  ✓ lora2.safetensors
    MODEL: 0.5234  CLIP: 0.3456
  ✓ lora3.safetensors
    MODEL: 0.2425  CLIP: 0.2421
```

**Pass/Fail:** ______

### Test 14: Locked Values in Group
**Steps:**
1. Create group with Max MODEL = 1.0
2. Add 3 LoRAs
3. Lock first LoRA at 0.3
4. Execute workflow

**Expected Result:**
- Locked LoRA gets exactly 0.3
- Other two LoRAs share remaining 0.7
- Console shows "[MODEL locked]" annotation
- Consistent across multiple executions

**Pass/Fail:** ______

### Test 15: Ungrouped Random Range
**Steps:**
1. Add ungrouped LoRA
2. Enable "🎲 Random" for MODEL
3. Set Min: 0.5, Max: 0.9
4. Execute multiple times

**Expected Result:**
- MODEL strength varies between 0.5 and 0.9
- Different value each execution (different seed)
- Console shows "(random from 0.5000-0.9000)"

**Pass/Fail:** ______

### Test 16: Mixed Configuration
**Steps:**
1. Create workflow with:
   - Group 1: 2 LoRAs (one locked)
   - Group 2: 3 LoRAs (no locks)
   - Ungrouped: 1 LoRA with random MODEL
2. Execute workflow

**Expected Result:**
- Each group partitions independently
- Ungrouped LoRA uses random value
- All LoRAs apply in correct order
- Console output matches configuration

**Pass/Fail:** ______

## Edge Case Tests

### Test 17: Empty Node
**Steps:**
1. Create node with no groups or LoRAs
2. Connect to workflow
3. Execute

**Expected Result:**
- Workflow executes
- Console shows "No LoRAs applied"
- No errors

**Pass/Fail:** ______

### Test 18: Group with No LoRAs
**Steps:**
1. Create a group
2. Don't add any LoRAs to it
3. Execute workflow

**Expected Result:**
- Group ignored during execution
- No errors
- Other LoRAs processed normally

**Pass/Fail:** ______

### Test 19: All LoRAs Locked
**Steps:**
1. Create group with 3 LoRAs
2. Lock all three at specific values (0.3, 0.4, 0.3)
3. Execute

**Expected Result:**
- Each LoRA gets exact locked value
- No random partitioning occurs
- Consistent across executions

**Pass/Fail:** ______

### Test 20: Very Large Configuration
**Steps:**
1. Create 5 groups
2. Add 5 LoRAs to each group
3. Add 5 ungrouped LoRAs
4. Observe performance and rendering

**Expected Result:**
- Node renders without lag
- All elements visible and clickable
- Execution completes successfully
- Scrolling works if needed

**Pass/Fail:** ______

## Regression Tests

### Test 21: Existing Workflow Compatibility
**Steps:**
1. Load a workflow saved with OLD version of node
2. Verify it loads correctly

**Expected Result:**
- Workflow loads without errors
- All LoRAs appear in correct locations
- All settings preserved
- Can execute successfully

**Pass/Fail:** ______

### Test 22: Python Backend Unchanged
**Steps:**
1. Run `python test_partitioning.py`
2. Verify all tests pass

**Expected Result:**
```
All tests completed!
All assertions passed
```

**Pass/Fail:** ______

## Browser Compatibility Tests

### Test 23: Chrome/Chromium
**Browser Version:** ____________
**Pass/Fail:** ______
**Notes:** _______________

### Test 24: Firefox
**Browser Version:** ____________
**Pass/Fail:** ______
**Notes:** _______________

### Test 25: Edge
**Browser Version:** ____________
**Pass/Fail:** ______
**Notes:** _______________

## Performance Tests

### Test 26: Rendering Performance
**Steps:**
1. Create large configuration (20+ elements)
2. Interact with node (hover, click, collapse)
3. Monitor for lag or delays

**Expected Result:**
- Smooth interactions
- No visible lag
- Instant response to clicks
- Hover effects immediate

**Pass/Fail:** ______

### Test 27: Memory Usage
**Steps:**
1. Open browser dev tools
2. Monitor memory usage
3. Create/delete many groups and LoRAs
4. Check for memory leaks

**Expected Result:**
- Memory usage stable
- No significant leaks
- Garbage collection works

**Pass/Fail:** ______

## Bug Report Template

If you find issues, report them using this format:

```markdown
### Bug: [Short Description]

**Severity:** Critical / High / Medium / Low

**Environment:**
- ComfyUI Version: 
- Browser: 
- OS: 

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**


**Actual Behavior:**


**Screenshots:**
[Attach screenshots]

**Console Errors:**
[Paste any console errors]

**Additional Context:**

```

## Testing Summary

Total Tests: 27
Tests Passed: ______
Tests Failed: ______
Tests Skipped: ______

**Overall Assessment:** ________________

**Critical Issues Found:** ________________

**Recommendations:** ________________

**Tested By:** ________________
**Date:** ________________
