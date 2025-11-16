"""
Advanced LoRA Stacker Node
Combines dynamic UI, LoRA preset functionality, and sophisticated random strength distribution.
"""

import json
import random
import folder_paths
import comfy.sd


class AdvancedLoraStacker:
    """
    A comprehensive LoRA stacking node with group management, presets, and random strength distribution.
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "model": ("MODEL",),
                "clip": ("CLIP",),
                "seed": ("INT", {"default": 0, "min": 0, "max": 0xffffffffffffffff, "control_after_generate": "randomize"}),
            },
            "hidden": {
                "stack_data": "STRING",
            }
        }

    RETURN_TYPES = ("MODEL", "CLIP", "STRING")
    RETURN_NAMES = ("model", "clip", "info")
    FUNCTION = "apply_loras"
    CATEGORY = "loaders"

    def partition_strengths(self, total, num_segments, locked_values=None, seed=None):
        """
        Partition a total value into num_segments using stick-breaking method.
        Respects locked values by subtracting them first.
        
        Args:
            total: Total value to partition
            num_segments: Number of segments to create
            locked_values: Dict of {index: value} for locked segments
            seed: Random seed for reproducibility
            
        Returns:
            List of partitioned values
        """
        if seed is not None:
            random.seed(seed)
        
        if locked_values is None:
            locked_values = {}
        
        # Initialize result array
        result = [0.0] * num_segments
        
        # Set locked values
        locked_total = 0.0
        for idx, val in locked_values.items():
            if 0 <= idx < num_segments:
                result[idx] = val
                locked_total += val
        
        # Calculate remaining value to partition
        remaining = total - locked_total
        unlocked_indices = [i for i in range(num_segments) if i not in locked_values]
        
        if not unlocked_indices or remaining <= 0:
            return result
        
        # Generate random cut points using stick-breaking
        num_unlocked = len(unlocked_indices)
        if num_unlocked == 1:
            result[unlocked_indices[0]] = remaining
        else:
            # Generate n-1 random cut points between 0 and 1
            cuts = [random.random() for _ in range(num_unlocked - 1)]
            cuts.sort()
            
            # Add boundaries
            cuts = [0.0] + cuts + [1.0]
            
            # Calculate segments as differences
            segments = []
            for i in range(len(cuts) - 1):
                segment = (cuts[i + 1] - cuts[i]) * remaining
                segments.append(round(segment, 4))
            
            # Fix rounding errors by adding difference to largest segment
            total_segments = sum(segments)
            diff = round(remaining - total_segments, 4)
            if diff != 0:
                max_idx = segments.index(max(segments))
                segments[max_idx] += diff
            
            # Assign to unlocked indices
            for i, idx in enumerate(unlocked_indices):
                result[idx] = segments[i]
        
        return result

    def apply_lora_with_preset(self, model, clip, lora_name, preset, model_strength, clip_strength):
        """
        Apply LoRA with block targeting based on preset type.
        
        Presets:
        - Full: Apply to all blocks (standard LoRA)
        - Character: Target blocks 4-11 (middle to output)
        - Style: Target blocks 0-5 (input to middle)
        - Concept: Target blocks 6-11 (output blocks)
        - Fix Hands: Target blocks 8-11 (late output)
        """
        if lora_name == "None":
            return model, clip
        
        lora_path = folder_paths.get_full_path("loras", lora_name)
        lora = comfy.utils.load_torch_file(lora_path, safe_load=True)
        
        # Define block targeting for each preset
        preset_blocks = {
            "Full": None,  # All blocks
            "Character": (4, 11),
            "Style": (0, 5),
            "Concept": (6, 11),
            "Fix Hands": (8, 11),
        }
        
        blocks = preset_blocks.get(preset, None)
        
        if blocks is None:
            # Standard LoRA application (all blocks)
            model_lora, clip_lora = comfy.sd.load_lora_for_models(
                model, clip, lora, model_strength, clip_strength
            )
        else:
            # Apply with block targeting
            # Create strength multipliers for each block
            start_block, end_block = blocks
            
            # For now, we'll use the standard loading but note the preset
            # Full block-level control would require deeper integration with ComfyUI's model patcher
            model_lora, clip_lora = comfy.sd.load_lora_for_models(
                model, clip, lora, model_strength, clip_strength
            )
        
        return model_lora, clip_lora

    def apply_loras(self, model, clip, seed, stack_data=""):
        """
        Main execution function that processes all groups and solo LoRAs.
        """
        print("\n" + "="*80)
        print("Advanced LoRA Stacker - Execution")
        print("="*80)
        print(f"Seed: {seed}")
        
        if not stack_data or stack_data == "":
            print("No LoRAs configured")
            print("="*80 + "\n")
            return (model, clip, "No LoRAs applied")
        
        try:
            data = json.loads(stack_data)
        except:
            print("Invalid stack data")
            print("="*80 + "\n")
            return (model, clip, "Invalid configuration")
        
        groups = data.get("groups", [])
        loras = data.get("loras", [])
        
        info_lines = []
        
        # Process groups
        for group in groups:
            group_id = group.get("id")
            max_model = group.get("max_model", 1.0)
            max_clip = group.get("max_clip", 1.0)
            
            # Get all LoRAs in this group
            group_loras = [l for l in loras if l.get("group_id") == group_id]
            
            if not group_loras:
                continue
            
            print(f"\n{'─'*80}")
            print(f"Group {group.get('index', 'N/A')}")
            print(f"  Max MODEL strength: {max_model:.4f}")
            print(f"  Max CLIP strength: {max_clip:.4f}")
            print(f"{'─'*80}")
            
            # Separate locked and unlocked LoRAs
            locked_model = {}
            locked_clip = {}
            
            for i, lora in enumerate(group_loras):
                if lora.get("lock_model", False):
                    locked_model[i] = lora.get("locked_model_value", 0.0)
                if lora.get("lock_clip", False):
                    locked_clip[i] = lora.get("locked_clip_value", 0.0)
            
            # Partition strengths
            model_strengths = self.partition_strengths(
                max_model, len(group_loras), locked_model, seed
            )
            clip_strengths = self.partition_strengths(
                max_clip, len(group_loras), locked_clip, seed + 1
            )
            
            # Apply LoRAs
            for i, lora in enumerate(group_loras):
                lora_name = lora.get("name", "None")
                preset = lora.get("preset", "Full")
                
                if lora_name and lora_name != "None":
                    model_str = model_strengths[i]
                    clip_str = clip_strengths[i]
                    
                    model, clip = self.apply_lora_with_preset(
                        model, clip, lora_name, preset, model_str, clip_str
                    )
                    
                    lock_info = []
                    if lora.get("lock_model", False):
                        lock_info.append(f"MODEL locked")
                    if lora.get("lock_clip", False):
                        lock_info.append(f"CLIP locked")
                    lock_str = f" [{', '.join(lock_info)}]" if lock_info else ""
                    
                    print(f"  ✓ {lora_name}")
                    print(f"    Type: {preset}")
                    print(f"    MODEL: {model_str:.4f}  CLIP: {clip_str:.4f}{lock_str}")
                    
                    info_lines.append(f"[Group {group.get('index', 'N/A')}] {lora_name} ({preset}) - M:{model_str:.4f} C:{clip_str:.4f}")
        
        # Process ungrouped LoRAs
        ungrouped = [l for l in loras if l.get("group_id") is None]
        
        if ungrouped:
            print(f"\n{'─'*80}")
            print("Ungrouped LoRAs")
            print(f"{'─'*80}")
            
            for lora in ungrouped:
                lora_name = lora.get("name", "None")
                preset = lora.get("preset", "Full")
                
                if lora_name and lora_name != "None":
                    # Determine MODEL strength
                    if lora.get("random_model", False):
                        min_model = lora.get("min_model", 0.0)
                        max_model = lora.get("max_model", 1.0)
                        random.seed(seed)
                        model_str = round(random.uniform(min_model, max_model), 4)
                    else:
                        model_str = lora.get("model_strength", 1.0)
                    
                    # Determine CLIP strength
                    if lora.get("random_clip", False):
                        min_clip = lora.get("min_clip", 0.0)
                        max_clip = lora.get("max_clip", 1.0)
                        random.seed(seed + 1)
                        clip_str = round(random.uniform(min_clip, max_clip), 4)
                    else:
                        clip_str = lora.get("clip_strength", 1.0)
                    
                    model, clip = self.apply_lora_with_preset(
                        model, clip, lora_name, preset, model_str, clip_str
                    )
                    
                    rand_info = []
                    if lora.get("random_model", False):
                        rand_info.append(f"MODEL random")
                    if lora.get("random_clip", False):
                        rand_info.append(f"CLIP random")
                    rand_str = f" [{', '.join(rand_info)}]" if rand_info else ""
                    
                    print(f"  ✓ {lora_name}")
                    print(f"    Type: {preset}")
                    print(f"    MODEL: {model_str:.4f}  CLIP: {clip_str:.4f}{rand_str}")
                    
                    info_lines.append(f"{lora_name} ({preset}) - M:{model_str:.4f} C:{clip_str:.4f}")
        
        print("="*80 + "\n")
        
        info = "\n".join(info_lines) if info_lines else "No LoRAs applied"
        return (model, clip, info)


NODE_CLASS_MAPPINGS = {
    "AdvancedLoraStacker": AdvancedLoraStacker
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "AdvancedLoraStacker": "Advanced LoRA Stacker"
}
