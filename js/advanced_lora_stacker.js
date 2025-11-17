/**
 * Advanced LoRA Stacker - Native Widget Implementation
 * Redesigned to use ComfyUI's native widgets with minimal JavaScript
 * 
 * Key Design Principles:
 * - Use VISIBLE native ComfyUI widgets (no canvas rendering)
 * - Keep JavaScript minimal (only for dynamic add/remove and LoRA list)
 * - Let ComfyUI handle all rendering and interactions
 * - Use native widget layout (vertical stacking with horizontal alignment via names)
 */

import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";

// Store reference to available LoRAs
let availableLoRAs = ["None"];

/**
 * Fetch available LoRAs from ComfyUI
 */
async function fetchLoraList() {
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
            
            // Initialize node data structures
            this.groups = [];
            this.loras = [];
            this.nextGroupId = 1;
            this.nextLoraId = 1;
            
            // Find the hidden stack_data widget
            this.stackDataWidget = this.widgets.find(w => w.name === "stack_data");
            if (!this.stackDataWidget) {
                // Create hidden widget if not exists
                this.stackDataWidget = this.addWidget("text", "stack_data", "", () => {});
                this.stackDataWidget.type = "hidden";
            }
            
            // Add control buttons at the bottom
            this.addWidget("button", "➕ Add LoRA", null, () => {
                this.addLora(null);
            });
            
            this.addWidget("button", "➕ Add Group", null, () => {
                this.addGroup();
            });
            
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
                widgets: [],
                collapsed: false
            };
            
            // Group header/title (using text widget as visual separator)
            const headerWidget = this.addWidget("text", `═══ GROUP ${groupIndex} ═══`, "", null, {multiline: false});
            headerWidget.disabled = true; // Make read-only
            group.widgets.push(headerWidget);
            
            // Collapse button
            const collapseBtn = this.addWidget("button", "▼ Collapse", null, () => {
                group.collapsed = !group.collapsed;
                collapseBtn.name = group.collapsed ? "▶ Expand" : "▼ Collapse";
                
                // Hide/show group contents
                for (const widget of group.widgets) {
                    if (widget !== headerWidget && widget !== collapseBtn && widget !== removeBtn) {
                        widget.type = group.collapsed ? "hidden" : widget.originalType || widget.type;
                    }
                }
                
                // Hide/show LoRAs in this group
                const groupLoras = this.loras.filter(l => l.group_id === groupId);
                for (const lora of groupLoras) {
                    for (const widget of lora.widgets) {
                        widget.type = group.collapsed ? "hidden" : widget.originalType || widget.type;
                    }
                }
                
                this.setDirtyCanvas(true, true);
            });
            group.widgets.push(collapseBtn);
            
            // Remove group button
            const removeBtn = this.addWidget("button", "✕ Remove Group", null, () => {
                this.removeGroup(groupId);
            });
            group.widgets.push(removeBtn);
            
            // Max Model strength (using short names for horizontal alignment)
            const maxModelWidget = this.addWidget("number", "Max MODEL", 1.0, (value) => {
                group.max_model = value;
                this.updateStackData();
            }, {min: 0.0, max: 10.0, step: 0.01, precision: 2});
            group.widgets.push(maxModelWidget);
            
            // Max CLIP strength
            const maxClipWidget = this.addWidget("number", "Max CLIP", 1.0, (value) => {
                group.max_clip = value;
                this.updateStackData();
            }, {min: 0.0, max: 10.0, step: 0.01, precision: 2});
            group.widgets.push(maxClipWidget);
            
            // Add LoRA to group button
            const addLoraBtn = this.addWidget("button", `➕ Add LoRA to Group ${groupIndex}`, null, () => {
                this.addLora(groupId);
            });
            group.widgets.push(addLoraBtn);
            
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
            
            // Update group indices
            for (let i = 0; i < this.groups.length; i++) {
                this.groups[i].index = i + 1;
                // Update header text
                const headerWidget = this.groups[i].widgets[0];
                if (headerWidget) {
                    headerWidget.name = `═══ GROUP ${i + 1} ═══`;
                }
                // Update add button text
                const addBtn = this.groups[i].widgets.find(w => w.name.includes('Add LoRA to Group'));
                if (addBtn) {
                    addBtn.name = `➕ Add LoRA to Group ${i + 1}`;
                }
            }
            
            this.updateStackData();
            this.setSize(this.computeSize());
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
            
            // Visual separator
            const separator = this.addWidget("text", "───────────", "", null, {multiline: false});
            separator.disabled = true;
            separator.originalType = "text";
            lora.widgets.push(separator);
            
            // LoRA selector
            const loraWidget = this.addWidget("combo", groupId ? "  LoRA" : "LoRA", "None", (value) => {
                lora.name = value;
                this.updateStackData();
            }, {values: availableLoRAs});
            loraWidget.originalType = "combo";
            lora.widgets.push(loraWidget);
            
            // Preset selector
            const presetWidget = this.addWidget("combo", groupId ? "  Type" : "Type", "Full", (value) => {
                lora.preset = value;
                this.updateStackData();
            }, {values: ["Full", "Character", "Style", "Concept", "Fix Hands"]});
            presetWidget.originalType = "combo";
            lora.widgets.push(presetWidget);
            
            if (groupId !== null) {
                // ===== GROUPED LORA - LOCK CONTROLS =====
                
                lora.lock_model = false;
                lora.locked_model_value = 0.0;
                lora.lock_clip = false;
                lora.locked_clip_value = 0.0;
                
                // MODEL lock toggle
                const lockModelWidget = this.addWidget("toggle", "  Lock MODEL", false, (value) => {
                    lora.lock_model = value;
                    // Show/hide locked value input
                    if (value) {
                        lockedModelValueWidget.type = lockedModelValueWidget.originalType;
                    } else {
                        lockedModelValueWidget.type = "hidden";
                    }
                    this.updateStackData();
                    this.setSize(this.computeSize());
                }, {});
                lockModelWidget.originalType = "toggle";
                lora.widgets.push(lockModelWidget);
                
                // Locked Model value input
                const lockedModelValueWidget = this.addWidget("number", "    Value", 0.0, (value) => {
                    lora.locked_model_value = value;
                    this.updateStackData();
                }, {min: 0.0, max: 10.0, step: 0.01, precision: 2});
                lockedModelValueWidget.type = "hidden"; // Hidden by default
                lockedModelValueWidget.originalType = "number";
                lora.widgets.push(lockedModelValueWidget);
                
                // CLIP lock toggle
                const lockClipWidget = this.addWidget("toggle", "  Lock CLIP", false, (value) => {
                    lora.lock_clip = value;
                    // Show/hide locked value input
                    if (value) {
                        lockedClipValueWidget.type = lockedClipValueWidget.originalType;
                    } else {
                        lockedClipValueWidget.type = "hidden";
                    }
                    this.updateStackData();
                    this.setSize(this.computeSize());
                }, {});
                lockClipWidget.originalType = "toggle";
                lora.widgets.push(lockClipWidget);
                
                // Locked CLIP value input
                const lockedClipValueWidget = this.addWidget("number", "    Value", 0.0, (value) => {
                    lora.locked_clip_value = value;
                    this.updateStackData();
                }, {min: 0.0, max: 10.0, step: 0.01, precision: 2});
                lockedClipValueWidget.type = "hidden"; // Hidden by default
                lockedClipValueWidget.originalType = "number";
                lora.widgets.push(lockedClipValueWidget);
                
            } else {
                // ===== UNGROUPED LORA - DIRECT STRENGTH CONTROLS =====
                
                lora.model_strength = 1.0;
                lora.clip_strength = 1.0;
                lora.random_model = false;
                lora.min_model = 0.0;
                lora.max_model = 1.0;
                lora.random_clip = false;
                lora.min_clip = 0.0;
                lora.max_clip = 1.0;
                
                // MODEL strength
                const modelStrWidget = this.addWidget("number", "MODEL Str", 1.0, (value) => {
                    lora.model_strength = value;
                    this.updateStackData();
                }, {min: 0.0, max: 10.0, step: 0.01, precision: 2});
                modelStrWidget.originalType = "number";
                lora.widgets.push(modelStrWidget);
                
                // Random MODEL toggle
                const randomModelWidget = this.addWidget("toggle", "  Random", false, (value) => {
                    lora.random_model = value;
                    // Show/hide min/max inputs
                    if (value) {
                        minModelWidget.type = minModelWidget.originalType;
                        maxModelWidget.type = maxModelWidget.originalType;
                    } else {
                        minModelWidget.type = "hidden";
                        maxModelWidget.type = "hidden";
                    }
                    this.updateStackData();
                    this.setSize(this.computeSize());
                }, {});
                randomModelWidget.originalType = "toggle";
                lora.widgets.push(randomModelWidget);
                
                // Min MODEL
                const minModelWidget = this.addWidget("number", "    Min", 0.0, (value) => {
                    lora.min_model = value;
                    this.updateStackData();
                }, {min: 0.0, max: 10.0, step: 0.01, precision: 2});
                minModelWidget.type = "hidden"; // Hidden by default
                minModelWidget.originalType = "number";
                lora.widgets.push(minModelWidget);
                
                // Max MODEL
                const maxModelWidget = this.addWidget("number", "    Max", 1.0, (value) => {
                    lora.max_model = value;
                    this.updateStackData();
                }, {min: 0.0, max: 10.0, step: 0.01, precision: 2});
                maxModelWidget.type = "hidden"; // Hidden by default
                maxModelWidget.originalType = "number";
                lora.widgets.push(maxModelWidget);
                
                // CLIP strength
                const clipStrWidget = this.addWidget("number", "CLIP Str", 1.0, (value) => {
                    lora.clip_strength = value;
                    this.updateStackData();
                }, {min: 0.0, max: 10.0, step: 0.01, precision: 2});
                clipStrWidget.originalType = "number";
                lora.widgets.push(clipStrWidget);
                
                // Random CLIP toggle
                const randomClipWidget = this.addWidget("toggle", "  Random", false, (value) => {
                    lora.random_clip = value;
                    // Show/hide min/max inputs
                    if (value) {
                        minClipWidget.type = minClipWidget.originalType;
                        maxClipWidget.type = maxClipWidget.originalType;
                    } else {
                        minClipWidget.type = "hidden";
                        maxClipWidget.type = "hidden";
                    }
                    this.updateStackData();
                    this.setSize(this.computeSize());
                }, {});
                randomClipWidget.originalType = "toggle";
                lora.widgets.push(randomClipWidget);
                
                // Min CLIP
                const minClipWidget = this.addWidget("number", "    Min", 0.0, (value) => {
                    lora.min_clip = value;
                    this.updateStackData();
                }, {min: 0.0, max: 10.0, step: 0.01, precision: 2});
                minClipWidget.type = "hidden"; // Hidden by default
                minClipWidget.originalType = "number";
                lora.widgets.push(minClipWidget);
                
                // Max CLIP
                const maxClipWidget = this.addWidget("number", "    Max", 1.0, (value) => {
                    lora.max_clip = value;
                    this.updateStackData();
                }, {min: 0.0, max: 10.0, step: 0.01, precision: 2});
                maxClipWidget.type = "hidden"; // Hidden by default
                maxClipWidget.originalType = "number";
                lora.widgets.push(maxClipWidget);
            }
            
            // Remove button (at the end)
            const removeBtn = this.addWidget("button", "✕ Remove", null, () => {
                this.removeLora(loraId);
            });
            removeBtn.originalType = "button";
            lora.widgets.push(removeBtn);
            
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
    }
});
