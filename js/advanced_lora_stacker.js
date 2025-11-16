/**
 * Advanced LoRA Stacker - JavaScript Frontend
 * Implements dynamic UI with groups, presets, and random strength controls
 */

import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";

// Store reference to available LoRAs
let availableLoRAs = ["None"];
let loraListPromise = null;

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

app.registerExtension({
    name: "AdvancedLoraStacker",
    
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
            
            // Store original size
            this.setSize([400, 120]);
            
            // Create main action buttons
            this.addButton = this.addWidget(
                "button",
                "➕ Add LoRA",
                null,
                () => {
                    this.addLora(null);
                }
            );
            
            this.addGroupButton = this.addWidget(
                "button",
                "➕ Add Group",
                null,
                () => {
                    this.addGroup();
                }
            );
            
            // Find stack_data widget (hidden)
            this.stackDataWidget = this.widgets.find(w => w.name === "stack_data");
            if (!this.stackDataWidget) {
                // Create hidden widget if not exists
                this.stackDataWidget = this.addWidget("text", "stack_data", "", () => {});
                this.stackDataWidget.type = "hidden";
            }
            
            // Override serialize to save state
            const originalSerialize = this.serialize;
            this.serialize = function() {
                const data = originalSerialize ? originalSerialize.apply(this) : {};
                this.updateStackData();
                return data;
            };
            
            // Custom draw for visual styling
            const originalOnDrawForeground = this.onDrawForeground;
            this.onDrawForeground = function(ctx) {
                if (originalOnDrawForeground) {
                    originalOnDrawForeground.apply(this, arguments);
                }
                
                // Draw group containers
                for (const group of this.groups) {
                    if (group.containerBounds) {
                        const bounds = group.containerBounds;
                        
                        // Draw rounded container
                        ctx.fillStyle = "#1a2a3a";
                        ctx.strokeStyle = "#3a5a7a";
                        ctx.lineWidth = 1;
                        
                        ctx.beginPath();
                        this.roundRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, 6);
                        ctx.fill();
                        ctx.stroke();
                    }
                }
            };
            
            // Helper for rounded rectangles
            this.roundRect = function(ctx, x, y, width, height, radius) {
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
            };
            
            return r;
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
            
            // Find insertion index (before main buttons)
            const addButtonIdx = this.widgets.indexOf(this.addButton);
            let insertIdx = addButtonIdx;
            
            // Group header (custom draw)
            const headerWidget = this.addWidget("button", `▼ Group ${groupIndex}`, null, () => {
                this.toggleGroupCollapse(groupId);
            });
            headerWidget.type = "group_header";
            headerWidget.groupId = groupId;
            group.widgets.push(headerWidget);
            
            // Remove group button
            const removeBtn = this.addWidget("button", "✕ Remove Group", null, () => {
                this.removeGroup(groupId);
            });
            removeBtn.type = "group_remove";
            group.widgets.push(removeBtn);
            
            // Max Model strength
            const maxModelWidget = ComfyWidgets.FLOAT(this, "max_model", ["FLOAT", {default: 1.0, min: 0.0, max: 10.0, step: 0.01}], app);
            maxModelWidget.widget.name = `Max MODEL Strength`;
            maxModelWidget.widget.value = 1.0;
            maxModelWidget.widget.callback = () => {
                group.max_model = maxModelWidget.widget.value;
                this.updateStackData();
            };
            group.widgets.push(maxModelWidget.widget);
            
            // Max CLIP strength
            const maxClipWidget = ComfyWidgets.FLOAT(this, "max_clip", ["FLOAT", {default: 1.0, min: 0.0, max: 10.0, step: 0.01}], app);
            maxClipWidget.widget.name = `Max CLIP Strength`;
            maxClipWidget.widget.value = 1.0;
            maxClipWidget.widget.callback = () => {
                group.max_clip = maxClipWidget.widget.value;
                this.updateStackData();
            };
            group.widgets.push(maxClipWidget.widget);
            
            // Add LoRA to group button
            const addLoraBtn = this.addWidget("button", `➕ Add LoRA to Group ${groupIndex}`, null, () => {
                this.addLora(groupId);
            });
            addLoraBtn.type = "group_add_lora";
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
            this.updateSize();
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
            
            // Update group indices
            for (let i = 0; i < this.groups.length; i++) {
                this.groups[i].index = i + 1;
                // Update button labels
                for (const widget of this.groups[i].widgets) {
                    if (widget.type === "group_header") {
                        const collapsed = this.collapsedGroups.has(this.groups[i].id);
                        widget.name = `${collapsed ? '▶' : '▼'} Group ${i + 1}`;
                    } else if (widget.type === "group_add_lora") {
                        widget.name = `➕ Add LoRA to Group ${i + 1}`;
                    }
                }
            }
            
            this.updateStackData();
            this.updateSize();
        };
        
        /**
         * Toggle group collapse state
         */
        nodeType.prototype.toggleGroupCollapse = function(groupId) {
            const group = this.groups.find(g => g.id === groupId);
            if (!group) return;
            
            const collapsed = this.collapsedGroups.has(groupId);
            
            if (collapsed) {
                this.collapsedGroups.delete(groupId);
            } else {
                this.collapsedGroups.add(groupId);
            }
            
            // Update header button
            const headerWidget = group.widgets.find(w => w.type === "group_header");
            if (headerWidget) {
                headerWidget.name = `${collapsed ? '▼' : '▶'} Group ${group.index}`;
            }
            
            // Hide/show group widgets (except header)
            for (const widget of group.widgets) {
                if (widget.type !== "group_header") {
                    widget.computeSize = collapsed ? () => [0, -4] : undefined;
                }
            }
            
            // Hide/show group LoRAs
            const groupLoRAs = this.loras.filter(l => l.group_id === groupId);
            for (const lora of groupLoRAs) {
                for (const widget of lora.widgets) {
                    widget.computeSize = collapsed ? () => [0, -4] : undefined;
                }
            }
            
            this.updateSize();
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
                // Insert after group's add button
                const group = this.groups.find(g => g.id === groupId);
                if (!group) return;
                
                const addLoraBtn = group.widgets.find(w => w.type === "group_add_lora");
                insertIdx = this.widgets.indexOf(addLoraBtn) + 1;
                
                // Find last LoRA in this group
                const groupLoRAs = this.loras.filter(l => l.group_id === groupId);
                if (groupLoRAs.length > 0) {
                    const lastLora = groupLoRAs[groupLoRAs.length - 1];
                    const lastWidget = lastLora.widgets[lastLora.widgets.length - 1];
                    insertIdx = this.widgets.indexOf(lastWidget) + 1;
                }
            } else {
                // Insert at end
                insertIdx = this.widgets.length;
            }
            
            // LoRA selector
            const loraWidget = this.addWidget("combo", "LoRA", "None", (value) => {
                lora.name = value;
                this.updateStackData();
            }, { values: availableLoRAs });
            lora.widgets.push(loraWidget);
            
            // Preset selector
            const presetWidget = this.addWidget("combo", "Type/Preset", "Full", (value) => {
                lora.preset = value;
                this.updateStackData();
            }, { values: ["Full", "Character", "Style", "Concept", "Fix Hands"] });
            lora.widgets.push(presetWidget);
            
            if (groupId !== null) {
                // Grouped LoRA - lock controls
                
                // Lock Model checkbox
                const lockModelWidget = ComfyWidgets.BOOLEAN(this, "lock_model", ["BOOLEAN", {default: false}], app);
                lockModelWidget.widget.name = "Lock MODEL (0.0000)";
                lockModelWidget.widget.value = false;
                lockModelWidget.widget.callback = (value) => {
                    lora.lock_model = value;
                    // Show/hide locked value input
                    lockedModelValueWidget.computeSize = value ? undefined : () => [0, -4];
                    this.updateStackData();
                    this.updateSize();
                };
                lora.widgets.push(lockModelWidget.widget);
                
                // Locked Model value
                const lockedModelValueWidget = ComfyWidgets.FLOAT(this, "locked_model_value", ["FLOAT", {default: 0.0, min: 0.0, max: 10.0, step: 0.01}], app);
                lockedModelValueWidget.widget.name = "  Locked MODEL Value";
                lockedModelValueWidget.widget.value = 0.0;
                lockedModelValueWidget.widget.computeSize = () => [0, -4]; // Hidden by default
                lockedModelValueWidget.widget.callback = (value) => {
                    lora.locked_model_value = value;
                    this.updateStackData();
                };
                lora.widgets.push(lockedModelValueWidget.widget);
                
                // Lock CLIP checkbox
                const lockClipWidget = ComfyWidgets.BOOLEAN(this, "lock_clip", ["BOOLEAN", {default: false}], app);
                lockClipWidget.widget.name = "Lock CLIP (0.0000)";
                lockClipWidget.widget.value = false;
                lockClipWidget.widget.callback = (value) => {
                    lora.lock_clip = value;
                    // Show/hide locked value input
                    lockedClipValueWidget.computeSize = value ? undefined : () => [0, -4];
                    this.updateStackData();
                    this.updateSize();
                };
                lora.widgets.push(lockClipWidget.widget);
                
                // Locked CLIP value
                const lockedClipValueWidget = ComfyWidgets.FLOAT(this, "locked_clip_value", ["FLOAT", {default: 0.0, min: 0.0, max: 10.0, step: 0.01}], app);
                lockedClipValueWidget.widget.name = "  Locked CLIP Value";
                lockedClipValueWidget.widget.value = 0.0;
                lockedClipValueWidget.widget.computeSize = () => [0, -4]; // Hidden by default
                lockedClipValueWidget.widget.callback = (value) => {
                    lora.locked_clip_value = value;
                    this.updateStackData();
                };
                lora.widgets.push(lockedClipValueWidget.widget);
                
            } else {
                // Ungrouped LoRA - full randomization controls
                
                // MODEL strength
                const modelStrWidget = ComfyWidgets.FLOAT(this, "model_strength", ["FLOAT", {default: 1.0, min: 0.0, max: 10.0, step: 0.01}], app);
                modelStrWidget.widget.name = "MODEL Strength";
                modelStrWidget.widget.value = 1.0;
                modelStrWidget.widget.callback = (value) => {
                    lora.model_strength = value;
                    this.updateStackData();
                };
                lora.widgets.push(modelStrWidget.widget);
                
                // Random MODEL checkbox
                const randomModelWidget = ComfyWidgets.BOOLEAN(this, "random_model", ["BOOLEAN", {default: false}], app);
                randomModelWidget.widget.name = "Random MODEL";
                randomModelWidget.widget.value = false;
                randomModelWidget.widget.callback = (value) => {
                    lora.random_model = value;
                    // Show/hide min/max inputs
                    minModelWidget.computeSize = value ? undefined : () => [0, -4];
                    maxModelWidget.computeSize = value ? undefined : () => [0, -4];
                    this.updateStackData();
                    this.updateSize();
                };
                lora.widgets.push(randomModelWidget.widget);
                
                // Min MODEL
                const minModelWidget = ComfyWidgets.FLOAT(this, "min_model", ["FLOAT", {default: 0.0, min: 0.0, max: 10.0, step: 0.01}], app);
                minModelWidget.widget.name = "  Min MODEL";
                minModelWidget.widget.value = 0.0;
                minModelWidget.widget.computeSize = () => [0, -4]; // Hidden by default
                minModelWidget.widget.callback = (value) => {
                    lora.min_model = value;
                    this.updateStackData();
                };
                lora.widgets.push(minModelWidget.widget);
                
                // Max MODEL
                const maxModelWidget = ComfyWidgets.FLOAT(this, "max_model", ["FLOAT", {default: 1.0, min: 0.0, max: 10.0, step: 0.01}], app);
                maxModelWidget.widget.name = "  Max MODEL";
                maxModelWidget.widget.value = 1.0;
                maxModelWidget.widget.computeSize = () => [0, -4]; // Hidden by default
                maxModelWidget.widget.callback = (value) => {
                    lora.max_model = value;
                    this.updateStackData();
                };
                lora.widgets.push(maxModelWidget.widget);
                
                // CLIP strength
                const clipStrWidget = ComfyWidgets.FLOAT(this, "clip_strength", ["FLOAT", {default: 1.0, min: 0.0, max: 10.0, step: 0.01}], app);
                clipStrWidget.widget.name = "CLIP Strength";
                clipStrWidget.widget.value = 1.0;
                clipStrWidget.widget.callback = (value) => {
                    lora.clip_strength = value;
                    this.updateStackData();
                };
                lora.widgets.push(clipStrWidget.widget);
                
                // Random CLIP checkbox
                const randomClipWidget = ComfyWidgets.BOOLEAN(this, "random_clip", ["BOOLEAN", {default: false}], app);
                randomClipWidget.widget.name = "Random CLIP";
                randomClipWidget.widget.value = false;
                randomClipWidget.widget.callback = (value) => {
                    lora.random_clip = value;
                    // Show/hide min/max inputs
                    minClipWidget.computeSize = value ? undefined : () => [0, -4];
                    maxClipWidget.computeSize = value ? undefined : () => [0, -4];
                    this.updateStackData();
                    this.updateSize();
                };
                lora.widgets.push(randomClipWidget.widget);
                
                // Min CLIP
                const minClipWidget = ComfyWidgets.FLOAT(this, "min_clip", ["FLOAT", {default: 0.0, min: 0.0, max: 10.0, step: 0.01}], app);
                minClipWidget.widget.name = "  Min CLIP";
                minClipWidget.widget.value = 0.0;
                minClipWidget.widget.computeSize = () => [0, -4]; // Hidden by default
                minClipWidget.widget.callback = (value) => {
                    lora.min_clip = value;
                    this.updateStackData();
                };
                lora.widgets.push(minClipWidget.widget);
                
                // Max CLIP
                const maxClipWidget = ComfyWidgets.FLOAT(this, "max_clip", ["FLOAT", {default: 1.0, min: 0.0, max: 10.0, step: 0.01}], app);
                maxClipWidget.widget.name = "  Max CLIP";
                maxClipWidget.widget.value = 1.0;
                maxClipWidget.widget.computeSize = () => [0, -4]; // Hidden by default
                maxClipWidget.widget.callback = (value) => {
                    lora.max_clip = value;
                    this.updateStackData();
                };
                lora.widgets.push(maxClipWidget.widget);
            }
            
            // Remove button
            const removeBtn = this.addWidget("button", "✕ Remove LoRA", null, () => {
                this.removeLora(loraId);
            });
            removeBtn.type = "lora_remove";
            lora.widgets.push(removeBtn);
            
            // Move widgets to correct position
            for (const widget of lora.widgets) {
                const currentIdx = this.widgets.indexOf(widget);
                if (currentIdx !== insertIdx) {
                    this.widgets.splice(currentIdx, 1);
                    this.widgets.splice(insertIdx, 0, widget);
                }
                insertIdx++;
            }
            
            this.loras.push(lora);
            this.updateStackData();
            this.updateSize();
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
                this.updateSize();
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
         * Update node size based on visible widgets
         */
        nodeType.prototype.updateSize = function() {
            // Calculate height based on visible widgets
            let height = 80; // Base height
            
            for (const widget of this.widgets) {
                if (widget.computeSize) {
                    const size = widget.computeSize();
                    if (size && size[1]) {
                        height += Math.max(0, size[1] + 4);
                    }
                } else {
                    height += 30; // Default widget height
                }
            }
            
            // Keep current width, update height
            const currentSize = this.size;
            this.setSize([currentSize[0], Math.max(120, height)]);
        };
    }
});
