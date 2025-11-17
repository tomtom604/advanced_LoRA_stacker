/**
 * Advanced LoRA Stacker - JavaScript Frontend
 * Comprehensive UI with groups, presets, and sophisticated controls
 * Redesigned with hybrid widget-canvas system for enhanced visual layout
 */

import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";

// Store reference to available LoRAs
let availableLoRAs = ["None"];
let loraListPromise = null;

// Color scheme constants
const COLORS = {
    group: {
        background: 'rgba(45, 65, 85, 0.9)',     // Darker blue-gray
        border: '#5a8fb9',                        // Bright blue border
        header: 'rgba(70, 120, 170, 0.3)'        // Light blue header tint
    },
    lora: {
        grouped: 'rgba(55, 75, 95, 0.7)',        // Slightly lighter than group
        ungrouped: 'rgba(40, 50, 60, 0.8)'       // Darker for ungrouped
    },
    text: {
        label: '#ffffff',                         // White for labels
        value: '#a0c4e0',                         // Light blue for values
        header: '#ffcc00'                         // Gold for headers
    },
    buttons: {
        remove: '#ff4444',                        // Red for remove
        add: '#44ff44',                           // Green for add
        lock: '#ffa500',                          // Orange for lock
        random: '#9966ff'                         // Purple for random
    }
};

// Layout constants
const LAYOUT = {
    ROW_HEIGHT: 26,
    PADDING: 4,
    MARGIN: 10,
    BUTTON_SIZE: 22,
    BORDER_RADIUS: 6,
    TITLE_BAR_HEIGHT: 40
};

/**
 * Fetch available LoRAs from ComfyUI
 */
async function fetchLoraList() {
    if (loraListPromise) return loraListPromise;
    
    loraListPromise = (async () => {
        try {
            const response = await fetch('/object_info/LoraLoader');
            const data = await response.json();
            
            if (data && data.LoraLoader && data.LoraLoader.input && data.LoraLoader.input.required) {
                const loraOptions = data.LoraLoader.input.required.lora_name;
                if (loraOptions && loraOptions[0]) {
                    availableLoRAs = ["None", ...loraOptions[0]];
                }
            }
        } catch (error) {
            console.error("Failed to fetch LoRA list:", error);
        }
    })();
    
    return loraListPromise;
}

/**
 * Helper function to adjust color brightness
 */
function adjustColorBrightness(color, amount) {
    // Parse RGB/RGBA color
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return color;
    
    let [, r, g, b, a] = match;
    r = Math.min(255, Math.max(0, parseInt(r) + amount));
    g = Math.min(255, Math.max(0, parseInt(g) + amount));
    b = Math.min(255, Math.max(0, parseInt(b) + amount));
    
    return a ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
}

/**
 * Helper function to check if point is inside rectangle
 */
function isPointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width &&
           y >= rect.y && y <= rect.y + rect.height;
}

app.registerExtension({
    name: "advanced_lora_stacker.AdvancedLoraStacker",
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "AdvancedLoraStacker") return;
        
        // Fetch LoRA list on load
        await fetchLoraList();
        
        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function() {
            const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
            
            // Initialize node data
            this.groups = [];
            this.loras = [];
            this.nextGroupId = 1;
            this.nextLoraId = 1;
            this.collapsedGroups = new Set();
            
            // Interaction state
            this.hoveredElement = null;
            this.clickableElements = [];
            
            // Set initial size
            this.setSize([450, 140]);
            this.originalSize = [450, 140];
            
            // Find the seed widget - it should already exist from INPUT_TYPES
            this.seedWidget = this.widgets.find(w => w.name === "seed");
            // Keep seed widget visible - it's a standard ComfyUI widget that users expect to interact with normally
            
            // Find stack_data widget (hidden)
            this.stackDataWidget = this.widgets.find(w => w.name === "stack_data");
            if (!this.stackDataWidget) {
                // Create hidden widget if not exists
                this.stackDataWidget = this.addWidget("text", "stack_data", "", () => {});
                this.stackDataWidget.type = "hidden";
                this.stackDataWidget.computeSize = () => [0, -4]; // Hide completely
            }
            
            // Override serialize to save state
            const originalSerialize = this.serialize;
            this.serialize = function() {
                const data = originalSerialize ? originalSerialize.apply(this) : {};
                this.updateStackData();
                return data;
            };
            
            return r;
        };
        
        /**
         * Get all widgets belonging to a group (including LoRAs)
         */
        nodeType.prototype.getGroupWidgets = function(groupId) {
            const group = this.groups.find(g => g.id === groupId);
            if (!group) return [];
            
            const widgets = [...group.widgets];
            
            // Add LoRA widgets that belong to this group
            const groupLoras = this.loras.filter(l => l.group_id === groupId);
            for (const lora of groupLoras) {
                widgets.push(...lora.widgets);
            }
            
            return widgets;
        };
        
        /**
         * Add a new group
         */
        nodeType.prototype.addGroup = function() {
            const groupId = this.nextGroupId++;
            const groupIndex = this.groups.length + 1;
            
            const group = {
                id: groupId,
                index: groupIndex,
                max_model: 1.0,
                max_clip: 1.0,
                widgets: []
            };
            
            // Find insertion index - groups go at the top, before action buttons
            const seedIdx = this.widgets.indexOf(this.seedWidget);
            let insertIdx = seedIdx + 1;
            
            // Insert after last group
            if (this.groups.length > 0) {
                const lastGroup = this.groups[this.groups.length - 1];
                const lastGroupWidgets = this.getGroupWidgets(lastGroup.id);
                if (lastGroupWidgets.length > 0) {
                    const lastWidget = lastGroupWidgets[lastGroupWidgets.length - 1];
                    const widgetIdx = this.widgets.indexOf(lastWidget);
                    if (widgetIdx !== -1) {
                        insertIdx = widgetIdx + 1;
                    }
                }
            }
            
            // Group header with collapse toggle and remove button (invisible - rendered on canvas)
            const headerWidget = this.addWidget("button", `▼ group_${groupIndex}`, null, () => {
                this.toggleGroupCollapse(groupId);
            });
            headerWidget.groupWidget = true;
            headerWidget.groupId = groupId;
            headerWidget.computeSize = () => [0, -4]; // Make invisible
            group.widgets.push(headerWidget);
            
            // Remove group button (inline with header conceptually)
            const removeBtn = this.addWidget("button", "✕", null, () => {
                this.removeGroup(groupId);
            });
            removeBtn.groupWidget = true;
            removeBtn.groupId = groupId;
            removeBtn.computeSize = () => [0, -4]; // Make invisible
            group.widgets.push(removeBtn);
            
            // Max Model strength
            const maxModelWidget = ComfyWidgets.FLOAT(this, "max_model", ["FLOAT", {default: 1.0, min: 0.0, max: 10.0, step: 0.01}], app);
            maxModelWidget.widget.name = `  Max MODEL`;
            maxModelWidget.widget.value = 1.0;
            maxModelWidget.widget.groupWidget = true;
            maxModelWidget.widget.groupId = groupId;
            maxModelWidget.widget.computeSize = () => [0, -4]; // Make invisible
            maxModelWidget.widget.callback = () => {
                group.max_model = maxModelWidget.widget.value;
                this.updateStackData();
            };
            group.widgets.push(maxModelWidget.widget);
            
            // Max CLIP strength
            const maxClipWidget = ComfyWidgets.FLOAT(this, "max_clip", ["FLOAT", {default: 1.0, min: 0.0, max: 10.0, step: 0.01}], app);
            maxClipWidget.widget.name = `  Max CLIP`;
            maxClipWidget.widget.value = 1.0;
            maxClipWidget.widget.groupWidget = true;
            maxClipWidget.widget.groupId = groupId;
            maxClipWidget.widget.computeSize = () => [0, -4]; // Make invisible
            maxClipWidget.widget.callback = () => {
                group.max_clip = maxClipWidget.widget.value;
                this.updateStackData();
            };
            group.widgets.push(maxClipWidget.widget);
            
            // Add LoRA to group button
            const addLoraBtn = this.addWidget("button", `  ➕ Add LoRA`, null, () => {
                this.addLora(groupId);
            });
            addLoraBtn.groupWidget = true;
            addLoraBtn.groupId = groupId;
            addLoraBtn.computeSize = () => [0, -4]; // Make invisible
            group.widgets.push(addLoraBtn);
            
            // Move widgets to correct position
            for (const widget of group.widgets) {
                const currentIdx = this.widgets.indexOf(widget);
                if (currentIdx > insertIdx) {
                    this.widgets.splice(currentIdx, 1);
                    this.widgets.splice(insertIdx, 0, widget);
                }
                insertIdx++;
            }
            
            this.groups.push(group);
            this.updateStackData();
            this.setSize(this.computeSize());
        };
        
        /**
         * Remove a group and all its LoRAs
         */
        nodeType.prototype.removeGroup = function(groupId) {
            const groupIdx = this.groups.findIndex(g => g.id === groupId);
            if (groupIdx === -1) return;
            
            const group = this.groups[groupIdx];
            
            // Remove all LoRAs in this group
            const groupLoRAs = this.loras.filter(l => l.group_id === groupId);
            for (const lora of groupLoRAs) {
                this.removeLora(lora.id, true);
            }
            
            // Remove group widgets
            for (const widget of group.widgets) {
                const idx = this.widgets.indexOf(widget);
                if (idx !== -1) {
                    this.widgets.splice(idx, 1);
                }
            }
            
            // Remove group
            this.groups.splice(groupIdx, 1);
            
            // Update group indices and labels
            for (let i = 0; i < this.groups.length; i++) {
                this.groups[i].index = i + 1;
                const headerWidget = this.groups[i].widgets.find(w => w.name.includes('group_'));
                if (headerWidget) {
                    const collapsed = this.collapsedGroups.has(this.groups[i].id);
                    headerWidget.name = `${collapsed ? '▶' : '▼'} group_${i + 1}`;
                }
            }
            
            this.updateStackData();
            this.setSize(this.computeSize());
        };
        
        /**
         * Toggle group collapse state
         */
        nodeType.prototype.toggleGroupCollapse = function(groupId) {
            const group = this.groups.find(g => g.id === groupId);
            if (!group) return;
            
            const wasCollapsed = this.collapsedGroups.has(groupId);
            
            if (wasCollapsed) {
                this.collapsedGroups.delete(groupId);
            } else {
                this.collapsedGroups.add(groupId);
            }
            
            // Update header button text
            const headerWidget = group.widgets.find(w => w.name.includes('group_'));
            if (headerWidget) {
                headerWidget.name = `${wasCollapsed ? '▼' : '▶'} group_${group.index}`;
            }
            
            // Update stack data and redraw
            this.updateStackData();
            this.setSize(this.computeSize());
            this.setDirtyCanvas(true, true);
        };
        
        /**
         * Add a LoRA (to a group or ungrouped)
         */
        nodeType.prototype.addLora = function(groupId) {
            const loraId = this.nextLoraId++;
            
            const lora = {
                id: loraId,
                group_id: groupId,
                name: "None",
                preset: "Full",
                widgets: []
            };
            
            if (groupId === null) {
                // Ungrouped LoRA - full controls
                lora.model_strength = 1.0;
                lora.clip_strength = 1.0;
                lora.random_model = false;
                lora.min_model = 0.0;
                lora.max_model = 1.0;
                lora.random_clip = false;
                lora.min_clip = 0.0;
                lora.max_clip = 1.0;
            } else {
                // Grouped LoRA - lock controls
                lora.lock_model = false;
                lora.locked_model_value = 0.0;
                lora.lock_clip = false;
                lora.locked_clip_value = 0.0;
            }
            
            // Find insertion index
            let insertIdx;
            if (groupId !== null) {
                // Insert after group's add button or last LoRA in group
                const group = this.groups.find(g => g.id === groupId);
                if (!group) return;
                
                const addLoraBtn = group.widgets.find(w => w.name.includes('Add LoRA'));
                insertIdx = this.widgets.indexOf(addLoraBtn) + 1;
                
                // Find last LoRA in this group
                const groupLoRAs = this.loras.filter(l => l.group_id === groupId);
                if (groupLoRAs.length > 0) {
                    const lastLora = groupLoRAs[groupLoRAs.length - 1];
                    const lastWidget = lastLora.widgets[lastLora.widgets.length - 1];
                    insertIdx = this.widgets.indexOf(lastWidget) + 1;
                }
            } else {
                // Insert at end for ungrouped LoRAs
                insertIdx = this.widgets.length;
                
                // Find last ungrouped LoRA to insert after it
                const ungroupedLoras = this.loras.filter(l => l.group_id === null);
                if (ungroupedLoras.length > 0) {
                    const lastLora = ungroupedLoras[ungroupedLoras.length - 1];
                    const lastWidget = lastLora.widgets[lastLora.widgets.length - 1];
                    const lastWidgetIdx = this.widgets.indexOf(lastWidget);
                    if (lastWidgetIdx !== -1) {
                        insertIdx = lastWidgetIdx + 1;
                    }
                }
            }
            
            // LoRA name selector with inline remove button
            const loraWidget = this.addWidget("combo", groupId ? "    LoRA" : "LoRA", "None", (value) => {
                lora.name = value;
                this.updateStackData();
            }, { values: availableLoRAs });
            loraWidget.computeSize = () => [0, -4]; // Make invisible
            if (groupId) {
                loraWidget.groupWidget = true;
                loraWidget.groupId = groupId;
            }
            lora.widgets.push(loraWidget);
            
            // Remove button (small X button)
            const removeBtn = this.addWidget("button", "✕", null, () => {
                this.removeLora(loraId);
            });
            removeBtn.computeSize = () => [0, -4]; // Make invisible
            if (groupId) {
                removeBtn.groupWidget = true;
                removeBtn.groupId = groupId;
            }
            lora.widgets.push(removeBtn);
            
            // Preset selector
            const presetWidget = this.addWidget("combo", groupId ? "    Type" : "Type", "Full", (value) => {
                lora.preset = value;
                this.updateStackData();
            }, { values: ["Full", "Character", "Style", "Concept", "Fix Hands"] });
            presetWidget.computeSize = () => [0, -4]; // Make invisible
            if (groupId) {
                presetWidget.groupWidget = true;
                presetWidget.groupId = groupId;
            }
            lora.widgets.push(presetWidget);
            
            if (groupId !== null) {
                // ===== GROUPED LORA - LOCK CONTROLS =====
                
                // MODEL lock checkbox
                const lockModelWidget = ComfyWidgets.BOOLEAN(this, "lock_model", ["BOOLEAN", {default: false}], app);
                lockModelWidget.widget.name = "    🔒 MODEL";
                lockModelWidget.widget.value = false;
                lockModelWidget.widget.groupWidget = true;
                lockModelWidget.widget.groupId = groupId;
                lockModelWidget.widget.computeSize = () => [0, -4]; // Make invisible
                lockModelWidget.widget.callback = (value) => {
                    lora.lock_model = value;
                    this.updateStackData();
                    this.setDirtyCanvas(true, true);
                };
                lora.widgets.push(lockModelWidget.widget);
                
                // Locked Model value input
                const lockedModelValueWidget = ComfyWidgets.FLOAT(this, "locked_model_value", ["FLOAT", {default: 0.0, min: 0.0, max: 10.0, step: 0.01}], app);
                lockedModelValueWidget.widget.name = "      Value";
                lockedModelValueWidget.widget.value = 0.0;
                lockedModelValueWidget.widget.groupWidget = true;
                lockedModelValueWidget.widget.groupId = groupId;
                lockedModelValueWidget.widget.computeSize = () => [0, -4]; // Make invisible
                lockedModelValueWidget.widget.callback = (value) => {
                    lora.locked_model_value = value;
                    this.updateStackData();
                };
                lora.widgets.push(lockedModelValueWidget.widget);
                
                // CLIP lock checkbox
                const lockClipWidget = ComfyWidgets.BOOLEAN(this, "lock_clip", ["BOOLEAN", {default: false}], app);
                lockClipWidget.widget.name = "    🔒 CLIP";
                lockClipWidget.widget.value = false;
                lockClipWidget.widget.groupWidget = true;
                lockClipWidget.widget.groupId = groupId;
                lockClipWidget.widget.computeSize = () => [0, -4]; // Make invisible
                lockClipWidget.widget.callback = (value) => {
                    lora.lock_clip = value;
                    this.updateStackData();
                    this.setDirtyCanvas(true, true);
                };
                lora.widgets.push(lockClipWidget.widget);
                
                // Locked CLIP value input
                const lockedClipValueWidget = ComfyWidgets.FLOAT(this, "locked_clip_value", ["FLOAT", {default: 0.0, min: 0.0, max: 10.0, step: 0.01}], app);
                lockedClipValueWidget.widget.name = "      Value";
                lockedClipValueWidget.widget.value = 0.0;
                lockedClipValueWidget.widget.groupWidget = true;
                lockedClipValueWidget.widget.groupId = groupId;
                lockedClipValueWidget.widget.computeSize = () => [0, -4]; // Make invisible
                lockedClipValueWidget.widget.callback = (value) => {
                    lora.locked_clip_value = value;
                    this.updateStackData();
                };
                lora.widgets.push(lockedClipValueWidget.widget);
                
            } else {
                // ===== UNGROUPED LORA - FULL RANDOMIZATION CONTROLS =====
                
                // MODEL strength (fixed)
                const modelStrWidget = ComfyWidgets.FLOAT(this, "model_strength", ["FLOAT", {default: 1.0, min: 0.0, max: 10.0, step: 0.01}], app);
                modelStrWidget.widget.name = "MODEL Str";
                modelStrWidget.widget.value = 1.0;
                modelStrWidget.widget.computeSize = () => [0, -4]; // Make invisible
                modelStrWidget.widget.callback = (value) => {
                    lora.model_strength = value;
                    this.updateStackData();
                };
                lora.widgets.push(modelStrWidget.widget);
                
                // Random MODEL checkbox
                const randomModelWidget = ComfyWidgets.BOOLEAN(this, "random_model", ["BOOLEAN", {default: false}], app);
                randomModelWidget.widget.name = "  🎲 Random";
                randomModelWidget.widget.value = false;
                randomModelWidget.widget.computeSize = () => [0, -4]; // Make invisible
                randomModelWidget.widget.callback = (value) => {
                    lora.random_model = value;
                    this.updateStackData();
                    this.setDirtyCanvas(true, true);
                };
                lora.widgets.push(randomModelWidget.widget);
                
                // Min MODEL
                const minModelWidget = ComfyWidgets.FLOAT(this, "min_model", ["FLOAT", {default: 0.0, min: 0.0, max: 10.0, step: 0.01}], app);
                minModelWidget.widget.name = "    Min";
                minModelWidget.widget.value = 0.0;
                minModelWidget.widget.computeSize = () => [0, -4]; // Make invisible
                minModelWidget.widget.callback = (value) => {
                    lora.min_model = value;
                    this.updateStackData();
                };
                lora.widgets.push(minModelWidget.widget);
                
                // Max MODEL
                const maxModelWidget = ComfyWidgets.FLOAT(this, "max_model", ["FLOAT", {default: 1.0, min: 0.0, max: 10.0, step: 0.01}], app);
                maxModelWidget.widget.name = "    Max";
                maxModelWidget.widget.value = 1.0;
                maxModelWidget.widget.computeSize = () => [0, -4]; // Make invisible
                maxModelWidget.widget.callback = (value) => {
                    lora.max_model = value;
                    this.updateStackData();
                };
                lora.widgets.push(maxModelWidget.widget);
                
                // CLIP strength (fixed)
                const clipStrWidget = ComfyWidgets.FLOAT(this, "clip_strength", ["FLOAT", {default: 1.0, min: 0.0, max: 10.0, step: 0.01}], app);
                clipStrWidget.widget.name = "CLIP Str";
                clipStrWidget.widget.value = 1.0;
                clipStrWidget.widget.computeSize = () => [0, -4]; // Make invisible
                clipStrWidget.widget.callback = (value) => {
                    lora.clip_strength = value;
                    this.updateStackData();
                };
                lora.widgets.push(clipStrWidget.widget);
                
                // Random CLIP checkbox
                const randomClipWidget = ComfyWidgets.BOOLEAN(this, "random_clip", ["BOOLEAN", {default: false}], app);
                randomClipWidget.widget.name = "  🎲 Random";
                randomClipWidget.widget.value = false;
                randomClipWidget.widget.computeSize = () => [0, -4]; // Make invisible
                randomClipWidget.widget.callback = (value) => {
                    lora.random_clip = value;
                    this.updateStackData();
                    this.setDirtyCanvas(true, true);
                };
                lora.widgets.push(randomClipWidget.widget);
                
                // Min CLIP
                const minClipWidget = ComfyWidgets.FLOAT(this, "min_clip", ["FLOAT", {default: 0.0, min: 0.0, max: 10.0, step: 0.01}], app);
                minClipWidget.widget.name = "    Min";
                minClipWidget.widget.value = 0.0;
                minClipWidget.widget.computeSize = () => [0, -4]; // Make invisible
                minClipWidget.widget.callback = (value) => {
                    lora.min_clip = value;
                    this.updateStackData();
                };
                lora.widgets.push(minClipWidget.widget);
                
                // Max CLIP
                const maxClipWidget = ComfyWidgets.FLOAT(this, "max_clip", ["FLOAT", {default: 1.0, min: 0.0, max: 10.0, step: 0.01}], app);
                maxClipWidget.widget.name = "    Max";
                maxClipWidget.widget.value = 1.0;
                maxClipWidget.widget.computeSize = () => [0, -4]; // Make invisible
                maxClipWidget.widget.callback = (value) => {
                    lora.max_clip = value;
                    this.updateStackData();
                };
                lora.widgets.push(maxClipWidget.widget);
            }
            
            // Move widgets to correct position
            for (const widget of lora.widgets) {
                const currentIdx = this.widgets.indexOf(widget);
                if (currentIdx !== -1 && currentIdx !== insertIdx) {
                    this.widgets.splice(currentIdx, 1);
                    this.widgets.splice(insertIdx, 0, widget);
                    insertIdx++;
                } else {
                    insertIdx++;
                }
            }
            
            this.loras.push(lora);
            this.updateStackData();
            this.setSize(this.computeSize());
        };
        
        /**
         * Remove a LoRA
         */
        nodeType.prototype.removeLora = function(loraId, skipUpdate = false) {
            const loraIdx = this.loras.findIndex(l => l.id === loraId);
            if (loraIdx === -1) return;
            
            const lora = this.loras[loraIdx];
            
            // Remove widgets
            for (const widget of lora.widgets) {
                const idx = this.widgets.indexOf(widget);
                if (idx !== -1) {
                    this.widgets.splice(idx, 1);
                }
            }
            
            // Remove lora
            this.loras.splice(loraIdx, 1);
            
            if (!skipUpdate) {
                this.updateStackData();
                this.setSize(this.computeSize());
            }
        };
        
        /**
         * Update stack_data hidden widget with current configuration
         */
        nodeType.prototype.updateStackData = function() {
            if (!this.stackDataWidget) return;
            
            const data = {
                groups: this.groups.map(g => ({
                    id: g.id,
                    index: g.index,
                    max_model: g.max_model,
                    max_clip: g.max_clip
                })),
                loras: this.loras.map(l => {
                    const base = {
                        id: l.id,
                        group_id: l.group_id,
                        name: l.name,
                        preset: l.preset
                    };
                    
                    if (l.group_id !== null) {
                        // Grouped LoRA
                        base.lock_model = l.lock_model;
                        base.locked_model_value = l.locked_model_value;
                        base.lock_clip = l.lock_clip;
                        base.locked_clip_value = l.locked_clip_value;
                    } else {
                        // Ungrouped LoRA
                        base.model_strength = l.model_strength;
                        base.clip_strength = l.clip_strength;
                        base.random_model = l.random_model;
                        base.min_model = l.min_model;
                        base.max_model = l.max_model;
                        base.random_clip = l.random_clip;
                        base.min_clip = l.min_clip;
                        base.max_clip = l.max_clip;
                    }
                    
                    return base;
                })
            };
            
            this.stackDataWidget.value = JSON.stringify(data);
        };
        
        /**
         * Override computeSize to calculate proper node size
         */
        nodeType.prototype.computeSize = function(out) {
            const layout = this.calculateLayout ? this.calculateLayout() : null;
            const height = layout ? layout.totalHeight + 20 : 140;
            const width = 450;
            
            const size = [width, Math.max(140, height)];
            if (out) {
                out[0] = size[0];
                out[1] = size[1];
                return out;
            }
            return size;
        };
        
        /**
         * Calculate layout for all elements (groups, loras, buttons)
         */
        nodeType.prototype.calculateLayout = function() {
            // Safety check: ensure node is initialized
            if (!this.groups || !Array.isArray(this.groups) || !this.loras || !Array.isArray(this.loras)) {
                return { rows: [], containers: [], totalHeight: LAYOUT.TITLE_BAR_HEIGHT + 60 };
            }
            
            const rows = [];
            const containers = []; // Store containers separately to draw first
            this.clickableElements = [];
            
            let currentY = LAYOUT.TITLE_BAR_HEIGHT;
            const nodeWidth = this.size[0];
            const contentWidth = nodeWidth - (LAYOUT.MARGIN * 2);
            
            // Render groups
            for (const group of this.groups) {
                const collapsed = this.collapsedGroups.has(group.id);
                const groupStartY = currentY;
                
                // Group header row
                const headerRow = {
                    y: currentY,
                    height: LAYOUT.ROW_HEIGHT,
                    background: COLORS.group.header,
                    elements: []
                };
                
                // Collapse/expand toggle
                headerRow.elements.push({
                    type: 'button',
                    text: collapsed ? '>' : 'v',
                    x: LAYOUT.MARGIN,
                    y: currentY,
                    width: LAYOUT.BUTTON_SIZE,
                    height: LAYOUT.ROW_HEIGHT,
                    color: COLORS.text.header,
                    action: () => this.toggleGroupCollapse(group.id)
                });
                
                // Group title
                headerRow.elements.push({
                    type: 'label',
                    text: `GROUP ${group.index}`,
                    x: LAYOUT.MARGIN + LAYOUT.BUTTON_SIZE + 5,
                    y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                    color: COLORS.text.header,
                    bold: true
                });
                
                // Remove group button
                headerRow.elements.push({
                    type: 'button',
                    text: 'X',
                    x: nodeWidth - LAYOUT.MARGIN - LAYOUT.BUTTON_SIZE,
                    y: currentY,
                    width: LAYOUT.BUTTON_SIZE,
                    height: LAYOUT.ROW_HEIGHT,
                    color: COLORS.buttons.remove,
                    action: () => this.removeGroup(group.id)
                });
                
                rows.push(headerRow);
                currentY += LAYOUT.ROW_HEIGHT + LAYOUT.PADDING;
                
                if (!collapsed) {
                    // Group controls row
                    const controlsRow = {
                        y: currentY,
                        height: LAYOUT.ROW_HEIGHT,
                        background: COLORS.group.background,
                        elements: []
                    };
                    
                    // Max Model label
                    controlsRow.elements.push({
                        type: 'label',
                        text: 'Max Model:',
                        x: LAYOUT.MARGIN + 10,
                        y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                        color: COLORS.text.label
                    });
                    
                    // Max Model value
                    const maxModelWidget = group.widgets.find(w => w.name && w.name.includes('Max MODEL'));
                    if (maxModelWidget) {
                        controlsRow.elements.push({
                            type: 'value',
                            text: `[${maxModelWidget.value.toFixed(2)}]`,
                            x: LAYOUT.MARGIN + 90,
                            y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                            width: 60,
                            color: COLORS.text.value,
                            widget: maxModelWidget
                        });
                    }
                    
                    // Max CLIP label
                    controlsRow.elements.push({
                        type: 'label',
                        text: 'Max CLIP:',
                        x: nodeWidth / 2,
                        y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                        color: COLORS.text.label
                    });
                    
                    // Max CLIP value
                    const maxClipWidget = group.widgets.find(w => w.name && w.name.includes('Max CLIP'));
                    if (maxClipWidget) {
                        controlsRow.elements.push({
                            type: 'value',
                            text: `[${maxClipWidget.value.toFixed(2)}]`,
                            x: nodeWidth / 2 + 70,
                            y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                            width: 60,
                            color: COLORS.text.value,
                            widget: maxClipWidget
                        });
                    }
                    
                    rows.push(controlsRow);
                    currentY += LAYOUT.ROW_HEIGHT + LAYOUT.PADDING;
                    
                    // Group LoRAs
                    const groupLoras = this.loras.filter(l => l.group_id === group.id);
                    for (const lora of groupLoras) {
                        currentY = this.addLoraRows(rows, lora, currentY, nodeWidth, true, containers);
                    }
                    
                    // Add LoRA button row
                    const addRow = {
                        y: currentY,
                        height: LAYOUT.ROW_HEIGHT,
                        background: COLORS.group.background,
                        elements: []
                    };
                    
                    addRow.elements.push({
                        type: 'button',
                        text: '+ Add LoRA',
                        x: LAYOUT.MARGIN + 10,
                        y: currentY,
                        width: contentWidth - 20,
                        height: LAYOUT.ROW_HEIGHT,
                        color: COLORS.buttons.add,
                        action: () => this.addLora(group.id)
                    });
                    
                    rows.push(addRow);
                    currentY += LAYOUT.ROW_HEIGHT + LAYOUT.PADDING;
                }
                
                // Add group container to be drawn first
                containers.push({
                    y: groupStartY,
                    height: currentY - groupStartY,
                    isContainer: true,
                    background: COLORS.group.background,
                    border: COLORS.group.border,
                    x: LAYOUT.MARGIN,
                    width: contentWidth
                });
                
                currentY += LAYOUT.PADDING;
            }
            
            // Ungrouped LoRAs
            const ungroupedLoras = this.loras.filter(l => l.group_id === null);
            if (ungroupedLoras.length > 0) {
                for (const lora of ungroupedLoras) {
                    currentY = this.addLoraRows(rows, lora, currentY, nodeWidth, false, containers);
                }
            }
            
            // Main action buttons
            const buttonRow = {
                y: currentY,
                height: LAYOUT.ROW_HEIGHT,
                elements: []
            };
            
            const halfWidth = contentWidth / 2 - LAYOUT.PADDING;
            
            buttonRow.elements.push({
                type: 'button',
                text: '+ Add LoRA',
                x: LAYOUT.MARGIN,
                y: currentY,
                width: halfWidth,
                height: LAYOUT.ROW_HEIGHT,
                color: COLORS.buttons.add,
                action: () => this.addLora(null)
            });
            
            buttonRow.elements.push({
                type: 'button',
                text: '+ Add Group',
                x: LAYOUT.MARGIN + halfWidth + LAYOUT.PADDING,
                y: currentY,
                width: halfWidth,
                height: LAYOUT.ROW_HEIGHT,
                color: COLORS.buttons.add,
                action: () => this.addGroup()
            });
            
            rows.push(buttonRow);
            currentY += LAYOUT.ROW_HEIGHT + LAYOUT.PADDING;
            
            // Store clickable elements
            for (const row of rows) {
                if (row.elements) {
                    for (const element of row.elements) {
                        if (element.action || element.widget) {
                            // Calculate proper bounds for clickable area
                            let boundsY = element.y;
                            let boundsHeight = element.height || LAYOUT.ROW_HEIGHT;
                            
                            // For text-based elements (dropdown, value, toggle, label), 
                            // y is the text baseline, so adjust to get the full row area
                            if (element.type === 'dropdown' || element.type === 'value' || element.type === 'toggle') {
                                // y is set to row.y + ROW_HEIGHT/2 + 5 for text baseline
                                // So calculate the actual row.y by subtracting
                                boundsY = row.y;
                                boundsHeight = LAYOUT.ROW_HEIGHT;
                            }
                            
                            this.clickableElements.push({
                                ...element,
                                bounds: {
                                    x: element.x,
                                    y: boundsY,
                                    width: element.width || 60,
                                    height: boundsHeight
                                }
                            });
                        }
                    }
                }
            }
            
            return { rows, containers, totalHeight: currentY };
        };
        
        /**
         * Add rows for a single LoRA
         */
        nodeType.prototype.addLoraRows = function(rows, lora, currentY, nodeWidth, isGrouped, containers) {
            const loraStartY = currentY;
            const contentWidth = nodeWidth - (LAYOUT.MARGIN * 2);
            const backgroundColor = isGrouped ? COLORS.lora.grouped : COLORS.lora.ungrouped;
            
            // Row 1: LoRA selector + Remove button
            const row1 = {
                y: currentY,
                height: LAYOUT.ROW_HEIGHT,
                background: backgroundColor,
                elements: []
            };
            
            const loraWidget = lora.widgets.find(w => w.name && w.name.includes('LoRA'));
            if (loraWidget) {
                row1.elements.push({
                    type: 'dropdown',
                    text: loraWidget.value || 'None',
                    x: LAYOUT.MARGIN + (isGrouped ? 20 : 10),
                    y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                    width: contentWidth - 60,
                    color: COLORS.text.value,
                    widget: loraWidget
                });
            }
            
            row1.elements.push({
                type: 'button',
                text: 'X',
                x: nodeWidth - LAYOUT.MARGIN - LAYOUT.BUTTON_SIZE,
                y: currentY,
                width: LAYOUT.BUTTON_SIZE,
                height: LAYOUT.ROW_HEIGHT,
                color: COLORS.buttons.remove,
                action: () => this.removeLora(lora.id)
            });
            
            rows.push(row1);
            currentY += LAYOUT.ROW_HEIGHT + LAYOUT.PADDING;
            
            // Row 2: Different content for grouped vs ungrouped
            const row2 = {
                y: currentY,
                height: LAYOUT.ROW_HEIGHT,
                background: backgroundColor,
                elements: []
            };
            
            const presetWidget = lora.widgets.find(w => w.name && w.name.includes('Type'));
            
            if (isGrouped) {
                // Grouped: Type + Lock controls
                row2.elements.push({
                    type: 'label',
                    text: 'Type:',
                    x: LAYOUT.MARGIN + 20,
                    y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                    color: COLORS.text.label
                });
                
                if (presetWidget) {
                    row2.elements.push({
                        type: 'dropdown',
                        text: presetWidget.value || 'Full',
                        x: LAYOUT.MARGIN + 60,
                        y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                        width: 100,
                        color: COLORS.text.value,
                        widget: presetWidget
                    });
                }
                
                // Lock MODEL
                const lockModelWidget = lora.widgets.find(w => w.name && w.name.includes('🔒 MODEL'));
                if (lockModelWidget) {
                    row2.elements.push({
                        type: 'toggle',
                        text: lockModelWidget.value ? '[LOCK]Model' : 'Model',
                        x: LAYOUT.MARGIN + 170,
                        y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                        width: 80,
                        color: lockModelWidget.value ? COLORS.buttons.lock : COLORS.text.label,
                        widget: lockModelWidget
                    });
                    
                    if (lockModelWidget.value) {
                        // Find the locked value widget
                        const lockedValueWidget = lora.widgets.find(w => w.name && w.name.includes('Value') && lora.widgets.indexOf(w) < lora.widgets.length / 2);
                        if (lockedValueWidget) {
                            row2.elements.push({
                                type: 'value',
                                text: `[${lockedValueWidget.value.toFixed(2)}]`,
                                x: LAYOUT.MARGIN + 260,
                                y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                                width: 50,
                                color: COLORS.text.value,
                                widget: lockedValueWidget
                            });
                        }
                    }
                }
                
                // Lock CLIP
                const lockClipWidget = lora.widgets.find(w => w.name && w.name.includes('🔒 CLIP'));
                if (lockClipWidget) {
                    row2.elements.push({
                        type: 'toggle',
                        text: lockClipWidget.value ? '[LOCK]CLIP' : 'CLIP',
                        x: LAYOUT.MARGIN + 315,
                        y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                        width: 70,
                        color: lockClipWidget.value ? COLORS.buttons.lock : COLORS.text.label,
                        widget: lockClipWidget
                    });
                    
                    if (lockClipWidget.value) {
                        // Find the locked value widget (second Value widget in the lora)
                        const lockedValueWidget = lora.widgets.find(w => w.name && w.name.includes('Value') && lora.widgets.indexOf(w) > lora.widgets.length / 2);
                        if (lockedValueWidget) {
                            row2.elements.push({
                                type: 'value',
                                text: `[${lockedValueWidget.value.toFixed(2)}]`,
                                x: LAYOUT.MARGIN + 390,
                                y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                                width: 50,
                                color: COLORS.text.value,
                                widget: lockedValueWidget
                            });
                        }
                    }
                }
            } else {
                // Ungrouped: MODEL controls on row 2
                row2.elements.push({
                    type: 'label',
                    text: 'MODEL:',
                    x: LAYOUT.MARGIN + 10,
                    y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                    color: COLORS.text.label,
                    bold: true
                });
                
                const modelStrWidget = lora.widgets.find(w => w.name === 'MODEL Str');
                if (modelStrWidget) {
                    row2.elements.push({
                        type: 'value',
                        text: `[${modelStrWidget.value.toFixed(2)}]`,
                        x: LAYOUT.MARGIN + 65,
                        y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                        width: 50,
                        color: COLORS.text.value,
                        widget: modelStrWidget
                    });
                }
                
                const minModelWidget = lora.widgets.find(w => w.name === '    Min' && lora.widgets.indexOf(w) < lora.widgets.length / 2);
                if (minModelWidget) {
                    row2.elements.push({
                        type: 'label',
                        text: 'Min:',
                        x: LAYOUT.MARGIN + 115,
                        y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                        color: COLORS.text.label
                    });
                    row2.elements.push({
                        type: 'value',
                        text: `[${minModelWidget.value.toFixed(1)}]`,
                        x: LAYOUT.MARGIN + 145,
                        y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                        width: 40,
                        color: COLORS.text.value,
                        widget: minModelWidget
                    });
                }
                
                const randomModelWidget = lora.widgets.find(w => w.name === '  🎲 Random' && lora.widgets.indexOf(w) < lora.widgets.length / 2);
                if (randomModelWidget) {
                    row2.elements.push({
                        type: 'toggle',
                        text: randomModelWidget.value ? '[RND]' : 'RND',
                        x: LAYOUT.MARGIN + 190,
                        y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                        width: 50,
                        color: randomModelWidget.value ? COLORS.buttons.random : COLORS.text.label,
                        widget: randomModelWidget
                    });
                }
            }
            
            rows.push(row2);
            currentY += LAYOUT.ROW_HEIGHT + LAYOUT.PADDING;
            
            // Row 3 for ungrouped: CLIP controls and Type
            if (!isGrouped) {
                const row3 = {
                    y: currentY,
                    height: LAYOUT.ROW_HEIGHT,
                    background: backgroundColor,
                    elements: []
                };
                
                row3.elements.push({
                    type: 'label',
                    text: 'CLIP:',
                    x: LAYOUT.MARGIN + 10,
                    y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                    color: COLORS.text.label,
                    bold: true
                });
                
                const clipStrWidget = lora.widgets.find(w => w.name === 'CLIP Str');
                if (clipStrWidget) {
                    row3.elements.push({
                        type: 'value',
                        text: `[${clipStrWidget.value.toFixed(2)}]`,
                        x: LAYOUT.MARGIN + 50,
                        y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                        width: 50,
                        color: COLORS.text.value,
                        widget: clipStrWidget
                    });
                }
                
                const minClipWidget = lora.widgets.find(w => w.name === '    Min' && lora.widgets.indexOf(w) > lora.widgets.length / 2);
                if (minClipWidget) {
                    row3.elements.push({
                        type: 'label',
                        text: 'Min:',
                        x: LAYOUT.MARGIN + 100,
                        y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                        color: COLORS.text.label
                    });
                    row3.elements.push({
                        type: 'value',
                        text: `[${minClipWidget.value.toFixed(1)}]`,
                        x: LAYOUT.MARGIN + 130,
                        y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                        width: 40,
                        color: COLORS.text.value,
                        widget: minClipWidget
                    });
                }
                
                const randomClipWidget = lora.widgets.find(w => w.name === '  🎲 Random' && lora.widgets.indexOf(w) > lora.widgets.length / 2);
                if (randomClipWidget) {
                    row3.elements.push({
                        type: 'toggle',
                        text: randomClipWidget.value ? '[RND]' : 'RND',
                        x: LAYOUT.MARGIN + 175,
                        y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                        width: 50,
                        color: randomClipWidget.value ? COLORS.buttons.random : COLORS.text.label,
                        widget: randomClipWidget
                    });
                }
                
                rows.push(row3);
                currentY += LAYOUT.ROW_HEIGHT + LAYOUT.PADDING;
                
                // Row 4: Type
                const row4 = {
                    y: currentY,
                    height: LAYOUT.ROW_HEIGHT,
                    background: backgroundColor,
                    elements: []
                };
                
                row4.elements.push({
                    type: 'label',
                    text: 'Type:',
                    x: LAYOUT.MARGIN + 10,
                    y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                    color: COLORS.text.label
                });
                
                if (presetWidget) {
                    row4.elements.push({
                        type: 'dropdown',
                        text: presetWidget.value || 'Full',
                        x: LAYOUT.MARGIN + 50,
                        y: currentY + LAYOUT.ROW_HEIGHT / 2 + 5,
                        width: 150,
                        color: COLORS.text.value,
                        widget: presetWidget
                    });
                }
                
                rows.push(row4);
                currentY += LAYOUT.ROW_HEIGHT + LAYOUT.PADDING;
            }
            
            // Add LoRA container to be drawn first
            if (containers) {
                containers.push({
                    y: loraStartY,
                    height: currentY - loraStartY,
                    isContainer: true,
                    background: backgroundColor,
                    x: LAYOUT.MARGIN + (isGrouped ? 10 : 0),
                    width: contentWidth - (isGrouped ? 10 : 0)
                });
            }
            
            return currentY;
        };
        
        /**
         * Draw rounded rectangle
         */
        nodeType.prototype.drawRoundedRect = function(ctx, x, y, width, height, radius, fillColor, strokeColor) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            
            if (fillColor) {
                const gradient = ctx.createLinearGradient(x, y, x, y + height);
                gradient.addColorStop(0, fillColor);
                gradient.addColorStop(1, adjustColorBrightness(fillColor, -20));
                ctx.fillStyle = gradient;
                ctx.fill();
            }
            
            if (strokeColor) {
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        };
        
        /**
         * Custom rendering function
         */
        nodeType.prototype.onDrawForeground = function(ctx) {
            if (!this.calculateLayout) return;
            
            const layout = this.calculateLayout();
            
            // Draw containers first (background)
            if (layout.containers) {
                for (const container of layout.containers) {
                    this.drawRoundedRect(
                        ctx,
                        container.x,
                        container.y,
                        container.width,
                        container.height,
                        LAYOUT.BORDER_RADIUS,
                        container.background,
                        container.border
                    );
                }
            }
            
            // Draw row backgrounds and elements
            for (const row of layout.rows) {
                
                // Draw row background if specified
                if (row.background && !row.isContainer) {
                    ctx.fillStyle = row.background;
                    ctx.fillRect(0, row.y, this.size[0], row.height);
                }
                
                // Draw elements
                if (row.elements) {
                    for (const element of row.elements) {
                        this.drawElement(ctx, element);
                    }
                }
            }
        };
        
        /**
         * Draw a single element
         */
        nodeType.prototype.drawElement = function(ctx, element) {
            const isHovered = this.hoveredElement === element;
            
            // Enable better text rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            switch (element.type) {
                case 'label':
                    ctx.font = element.bold ? 'bold 14px sans-serif' : '14px sans-serif';
                    ctx.fillStyle = element.color || COLORS.text.label;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    // Add text shadow for better legibility
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                    ctx.shadowBlur = 3;
                    ctx.shadowOffsetX = 1;
                    ctx.shadowOffsetY = 1;
                    ctx.fillText(element.text, element.x, element.y);
                    // Reset shadow
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    break;
                    
                case 'value':
                    ctx.font = '14px monospace';
                    ctx.fillStyle = element.color || COLORS.text.value;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    // Add text shadow for better legibility
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                    ctx.shadowBlur = 3;
                    ctx.shadowOffsetX = 1;
                    ctx.shadowOffsetY = 1;
                    ctx.fillText(element.text, element.x, element.y);
                    // Reset shadow
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    break;
                    
                case 'button':
                    const btnColor = isHovered ? adjustColorBrightness(element.color, 30) : element.color;
                    this.drawRoundedRect(
                        ctx,
                        element.x,
                        element.y + 2,
                        element.width,
                        element.height - 4,
                        3,
                        btnColor,
                        null
                    );
                    ctx.font = 'bold 14px sans-serif';
                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    // Add text shadow for button text
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                    ctx.shadowBlur = 2;
                    ctx.shadowOffsetX = 1;
                    ctx.shadowOffsetY = 1;
                    ctx.fillText(element.text, element.x + element.width / 2, element.y + element.height / 2);
                    // Reset shadow
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    break;
                    
                case 'dropdown':
                    ctx.font = '14px sans-serif';
                    ctx.fillStyle = element.color || COLORS.text.value;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    const displayText = element.text.length > 30 ? element.text.substring(0, 27) + '...' : element.text;
                    // Add text shadow for better legibility
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                    ctx.shadowBlur = 3;
                    ctx.shadowOffsetX = 1;
                    ctx.shadowOffsetY = 1;
                    ctx.fillText('[' + displayText + ']', element.x, element.y);
                    // Reset shadow
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    break;
                    
                case 'toggle':
                    ctx.font = 'bold 13px sans-serif';
                    ctx.fillStyle = element.color;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    // Add text shadow for better legibility
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                    ctx.shadowBlur = 3;
                    ctx.shadowOffsetX = 1;
                    ctx.shadowOffsetY = 1;
                    ctx.fillText(element.text, element.x, element.y);
                    // Reset shadow
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    break;
            }
        };
        
        /**
         * Handle mouse down events
         */
        nodeType.prototype.onMouseDown = function(e, localPos, canvas) {
            for (const element of this.clickableElements) {
                if (isPointInRect(localPos[0], localPos[1], element.bounds)) {
                    if (element.action) {
                        // Direct action callback (for buttons)
                        element.action();
                        this.setDirtyCanvas(true, true);
                        return true;
                    }
                    if (element.widget) {
                        const widget = element.widget;
                        
                        // Handle different element types that reference widgets
                        if (element.type === 'toggle') {
                            // Toggle boolean widgets
                            widget.value = !widget.value;
                            if (widget.callback) {
                                widget.callback(widget.value);
                            }
                            this.setDirtyCanvas(true, true);
                            return true;
                        } 
                        else if (element.type === 'dropdown') {
                            // Show ComfyUI's native dropdown for combo widgets
                            const options = widget.options ? widget.options.values : [];
                            if (options && options.length > 0) {
                                // Create a temporary context menu
                                const menu = new LiteGraph.ContextMenu(
                                    options,
                                    {
                                        event: e,
                                        title: widget.name,
                                        callback: (v) => {
                                            widget.value = v.content;
                                            if (widget.callback) {
                                                widget.callback(v.content);
                                            }
                                            this.setDirtyCanvas(true, true);
                                        }
                                    }
                                );
                            }
                            return true;
                        }
                        else if (element.type === 'value') {
                            // For value elements (numeric), create a temporary input overlay
                            this.showNumberInput(widget, element, e, canvas);
                            return true;
                        }
                    }
                }
            }
            return false;
        };
        
        /**
         * Show number input overlay for editing numeric values
         */
        nodeType.prototype.showNumberInput = function(widget, element, event, canvas) {
            // Get canvas element - try multiple sources
            const canvasElement = canvas || (this.graph && this.graph.canvas && this.graph.canvas.canvas) || event.target;
            if (!canvasElement) {
                console.warn("Cannot show number input: canvas not available");
                return;
            }
            
            // Create an input element
            const input = document.createElement("input");
            input.type = "text";
            input.value = widget.value.toString();
            input.style.position = "fixed";
            
            // Position the input at the click location
            const rect = canvasElement.getBoundingClientRect();
            input.style.left = (rect.left + element.bounds.x) + "px";
            input.style.top = (rect.top + element.bounds.y) + "px";
            input.style.width = element.bounds.width + "px";
            input.style.height = element.bounds.height + "px";
            
            // Style the input
            input.style.border = "2px solid #5a8fb9";
            input.style.backgroundColor = "#2d3e4a";
            input.style.color = "#a0c4e0";
            input.style.fontSize = "14px";
            input.style.fontFamily = "monospace";
            input.style.padding = "2px 5px";
            input.style.zIndex = "10000";
            
            // Add input to document
            document.body.appendChild(input);
            input.focus();
            input.select();
            
            // Handle input completion
            const finishInput = () => {
                const newValue = parseFloat(input.value);
                if (!isNaN(newValue)) {
                    // Clamp value to widget's min/max
                    let clampedValue = newValue;
                    if (widget.options) {
                        if (widget.options.min !== undefined) {
                            clampedValue = Math.max(widget.options.min, clampedValue);
                        }
                        if (widget.options.max !== undefined) {
                            clampedValue = Math.min(widget.options.max, clampedValue);
                        }
                    }
                    
                    widget.value = clampedValue;
                    if (widget.callback) {
                        widget.callback(clampedValue);
                    }
                    this.setDirtyCanvas(true, true);
                }
                document.body.removeChild(input);
            };
            
            // Enter key or blur to finish
            input.addEventListener("blur", finishInput);
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    finishInput();
                } else if (e.key === "Escape") {
                    document.body.removeChild(input);
                }
            });
        };
        
        /**
         * Handle mouse move events for hover effects
         */
        nodeType.prototype.onMouseMove = function(e, localPos) {
            let foundHover = false;
            
            for (const element of this.clickableElements) {
                if (isPointInRect(localPos[0], localPos[1], element.bounds)) {
                    if (this.hoveredElement !== element) {
                        this.hoveredElement = element;
                        this.setDirtyCanvas(true, false);
                    }
                    foundHover = true;
                    if (this.canvas) {
                        this.canvas.style.cursor = 'pointer';
                    }
                    break;
                }
            }
            
            if (!foundHover) {
                if (this.hoveredElement) {
                    this.hoveredElement = null;
                    this.setDirtyCanvas(true, false);
                }
                if (this.canvas) {
                    this.canvas.style.cursor = 'default';
                }
            }
        };
    }
});
