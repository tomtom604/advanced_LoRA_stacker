/**
 * Text Concatenator - Dynamic Input Implementation
 * Provides infinite text inputs that auto-expand as connections are made
 */

import { app } from "../../scripts/app.js";

const TypeSlot = {
    Input: 1,
    Output: 2,
};

const TypeSlotEvent = {
    Connect: true,
    Disconnect: false,
};

const _ID = "TextConcatenator";
const _PREFIX = "text";
const _TYPE = "STRING";

app.registerExtension({
    name: 'advanced_lora_stacker.' + _ID,
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        // Skip if not our node
        if (nodeData.name !== _ID) {
            return;
        }

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = async function () {
            const me = onNodeCreated?.apply(this);
            // Start with a new dynamic input
            this.addInput(_PREFIX, _TYPE);
            // Ensure the new slot has proper appearance
            const slot = this.inputs[this.inputs.length - 1];
            if (slot) {
                slot.color_off = "#666";
            }
            return me;
        }

        const onConnectionsChange = nodeType.prototype.onConnectionsChange;
        nodeType.prototype.onConnectionsChange = function (slotType, slot_idx, event, link_info, node_slot) {
            const me = onConnectionsChange?.apply(this, arguments);

            if (slotType === TypeSlot.Input) {
                if (link_info && event === TypeSlotEvent.Connect) {
                    // Get the parent (left side node) from the link
                    const fromNode = this.graph._nodes.find(
                        (otherNode) => otherNode.id == link_info.origin_id
                    );

                    if (fromNode) {
                        // Make sure there is a parent for the link
                        const parent_link = fromNode.outputs[link_info.origin_slot];
                        if (parent_link) {
                            node_slot.type = parent_link.type;
                            node_slot.name = `${_PREFIX}_`;
                        }
                    }
                } else if (event === TypeSlotEvent.Disconnect) {
                    this.removeInput(slot_idx);
                }

                // Track each slot name so we can index the uniques
                let idx = 0;
                let slot_tracker = {};
                for (const slot of this.inputs) {
                    if (slot.link === null) {
                        try {
                            this.removeInput(idx);
                        } catch {
                            // Ignore errors when removing inputs
                        }
                        continue;
                    }
                    idx += 1;
                    const name = slot.name.split('_')[0];

                    // Correctly increment the count in slot_tracker
                    let count = (slot_tracker[name] || 0) + 1;
                    slot_tracker[name] = count;

                    // Update the slot name with the count
                    slot.name = `${name}_${count}`;
                }

                // Check that the last slot is a dynamic entry
                let last = this.inputs[this.inputs.length - 1];
                if (last === undefined || (last.name != _PREFIX || last.type != _TYPE)) {
                    this.addInput(_PREFIX, _TYPE);
                    // Set the unconnected slot to appear gray
                    last = this.inputs[this.inputs.length - 1];
                    if (last) {
                        last.color_off = "#666";
                    }
                }

                // Force the node to resize itself for the new/deleted connections
                this?.graph?.setDirtyCanvas(true);
                return me;
            }
        }
        return nodeType;
    },
});
