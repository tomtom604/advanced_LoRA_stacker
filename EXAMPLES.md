# Advanced LoRA Stacker - Usage Examples

This document provides practical examples of how to use the Advanced LoRA Stacker node in various scenarios.

## Example 1: Basic Character Generation with Style

**Scenario**: Generate a character with a specific art style

**Setup**:
```
1. Add Group 1 - "Character Group"
   - Max MODEL: 1.0
   - Max CLIP: 1.0
   - Add LoRA: character_anime.safetensors
     - Type: Character
     - Lock MODEL: No
     - Lock CLIP: No
   
2. Add Ungrouped LoRA
   - LoRA: studio_ghibli_style.safetensors
   - Type: Style
   - MODEL Strength: 0.7
   - CLIP Strength: 0.7
```

**Expected Behavior**:
- Character LoRA gets full strength (1.0/1.0)
- Style LoRA applies at fixed 0.7/0.7

---

## Example 2: Multiple Character Features with Random Distribution

**Scenario**: Blend multiple character-related LoRAs with random weights

**Setup**:
```
1. Add Group 1 - "Character Features"
   - Max MODEL: 1.0
   - Max CLIP: 1.0
   
   Add LoRAs:
   - face_details.safetensors (Character preset)
   - hair_style.safetensors (Character preset)
   - clothing_details.safetensors (Character preset)
   - body_proportions.safetensors (Character preset)
```

**Expected Behavior**:
- Each run randomly distributes the 1.0 strength across all 4 LoRAs
- Example distribution: 0.23, 0.31, 0.19, 0.27
- Seed changes produce different blends
- Lock any that work well to preserve their strength

**Console Output Example**:
```
Group 1
  Max MODEL strength: 1.0000
  Max CLIP strength: 1.0000
  ✓ face_details.safetensors
    Type: Character
    MODEL: 0.2341  CLIP: 0.3124
  ✓ hair_style.safetensors
    Type: Character
    MODEL: 0.3156  CLIP: 0.2087
  ✓ clothing_details.safetensors
    Type: Character
    MODEL: 0.1892  CLIP: 0.2941
  ✓ body_proportions.safetensors
    Type: Character
    MODEL: 0.2611  CLIP: 0.1848
```

---

## Example 3: Style Mixing with Locked Base Style

**Scenario**: Keep one style as base, randomize additional styles

**Setup**:
```
1. Add Group 1 - "Mixed Styles"
   - Max MODEL: 1.2
   - Max CLIP: 1.2
   
   Add LoRAs:
   - base_art_style.safetensors (Style preset)
     - Lock MODEL: Yes (0.6)
     - Lock CLIP: Yes (0.6)
   
   - color_palette_1.safetensors (Style preset)
     - Lock MODEL: No
     - Lock CLIP: No
   
   - color_palette_2.safetensors (Style preset)
     - Lock MODEL: No
     - Lock CLIP: No
```

**Expected Behavior**:
- Base style locked at 0.6/0.6
- Remaining 0.6/0.6 randomly split between two color palettes
- Preserves consistent base while varying accents

---

## Example 4: Character + Style + Concept Workflow

**Scenario**: Complex composition with multiple LoRA types

**Setup**:
```
1. Add Group 1 - "Character"
   - Max MODEL: 0.9
   - Max CLIP: 0.9
   - character_main.safetensors (Character preset)

2. Add Group 2 - "Styles"
   - Max MODEL: 0.8
   - Max CLIP: 0.8
   - art_style_1.safetensors (Style preset)
   - art_style_2.safetensors (Style preset)

3. Add Group 3 - "Concepts"
   - Max MODEL: 0.6
   - Max CLIP: 0.6
   - lighting_concept.safetensors (Concept preset)
   - atmosphere_concept.safetensors (Concept preset)

4. Add Ungrouped LoRA
   - fix_hands.safetensors (Fix Hands preset)
   - MODEL Strength: 0.75
   - CLIP Strength: 0.75
```

**Expected Behavior**:
- Character gets full 0.9 strength
- Two styles randomly split 0.8 total
- Two concepts randomly split 0.6 total
- Hand fix applies consistently at 0.75

---

## Example 5: Style Exploration Mode

**Scenario**: Rapidly test different style combinations

**Setup**:
```
1. Add Group 1 - "Style Test"
   - Max MODEL: 1.0
   - Max CLIP: 1.0
   
   Add 6-8 different style LoRAs (all Style preset)
```

**Usage**:
1. Run with different seeds
2. Check console output for distributions
3. When you find a good combination, note the values
4. Lock those values in the UI
5. Continue experimenting with unlocked LoRAs

**Workflow**:
```
Generate → Review → Lock successful values → Regenerate → Repeat
```

---

## Example 6: Individual Randomization for Fine-tuning

**Scenario**: Find optimal strength for a specific LoRA

**Setup**:
```
1. Add Ungrouped LoRA
   - detail_enhancer.safetensors (Concept preset)
   - Random MODEL: Yes
     - Min MODEL: 0.3
     - Max MODEL: 0.9
   - Random CLIP: Yes
     - Min CLIP: 0.4
     - Max CLIP: 1.0
```

**Usage**:
1. Generate 10-20 images with different seeds
2. Note which strength ranges work best
3. Narrow the min/max range
4. Repeat until you find the sweet spot
5. Disable randomization and set fixed value

---

## Example 7: Seasonal Variations

**Scenario**: Create seasonal variants of the same scene

**Setup**:
```
1. Add Group 1 - "Base Scene"
   - Max MODEL: 1.0
   - Max CLIP: 1.0
   - scene_composition.safetensors (Concept preset)
     - Lock MODEL: Yes (1.0)
     - Lock CLIP: Yes (1.0)

2. Add Group 2 - "Seasonal"
   - Max MODEL: 0.7
   - Max CLIP: 0.7
   - spring_colors.safetensors (Style preset)
   - summer_lighting.safetensors (Style preset)
   - autumn_palette.safetensors (Style preset)
   - winter_atmosphere.safetensors (Style preset)
```

**Expected Behavior**:
- Scene composition remains constant
- Each generation randomly blends seasonal elements
- Different moods each run while maintaining scene structure

---

## Example 8: Progressive Strength Testing

**Scenario**: Test how different strength levels affect output

**Setup**:
```
Iteration 1:
- Group 1: Max MODEL 0.5, Max CLIP 0.5
- 3 style LoRAs

Iteration 2:
- Group 1: Max MODEL 0.8, Max CLIP 0.8
- Same 3 style LoRAs

Iteration 3:
- Group 1: Max MODEL 1.2, Max CLIP 1.2
- Same 3 style LoRAs
```

**Usage**:
- Keep same seed across iterations
- Observe how total strength affects distribution
- Find optimal total strength for your use case

---

## Tips for Effective Use

### Group Management
- **Use groups for related LoRAs**: Keep character features together, styles together
- **Set appropriate max values**: Lower for subtle effects, higher for strong presence
- **Lock key elements**: Preserve what works while exploring variations

### Random Exploration
- **Start with wide ranges**: Narrow down as you find what works
- **Use consistent seeds**: Test same distribution with different prompts
- **Monitor console output**: Track which combinations produce best results

### Performance Optimization
- **Collapse unused groups**: Reduces UI clutter
- **Remove LoRAs you're not using**: Keeps configuration clean
- **Use presets appropriately**: Character for people, Style for artistic effects, etc.

### Troubleshooting
- **Strengths sum to max**: Verify in console that locked + random = max
- **Preset not effective**: Try different block ranges for your specific model
- **Random not changing**: Check that seed is updating between runs

---

## Advanced Techniques

### Technique 1: Cascading Groups
Create multiple groups with decreasing max strengths to prioritize certain LoRAs:
- Group 1 (Priority): Max 1.0
- Group 2 (Secondary): Max 0.6
- Group 3 (Subtle): Max 0.3

### Technique 2: Paired Locking
Lock complementary LoRAs at specific ratios:
- Face details: Locked at 0.6
- Body details: Locked at 0.4
- Let other features randomize around these anchors

### Technique 3: Seed-based Presets
Save workflows with specific seeds that produced good results:
- Seed 12345: Balanced character features
- Seed 67890: Emphasized style elements
- Seed 24680: Dramatic lighting

### Technique 4: A/B Testing
Create two identical setups with different group configurations:
- Test which organization produces better results
- Compare grouped vs ungrouped approaches
- Find optimal max strength values

---

## Common Workflows

### Portrait Photography Style
```
Group 1: Character (0.9)
- face_details.safetensors
- skin_texture.safetensors

Group 2: Lighting (0.7)
- studio_lighting.safetensors
- soft_shadows.safetensors

Ungrouped:
- fix_hands.safetensors (0.6)
- photo_realism.safetensors (0.8)
```

### Anime Artwork
```
Group 1: Character (1.0)
- anime_face.safetensors
- anime_body.safetensors

Group 2: Style (0.8)
- anime_lineart.safetensors
- color_vibrant.safetensors
- cel_shading.safetensors

Ungrouped:
- background_blur.safetensors (Random: 0.3-0.7)
```

### Concept Art
```
Group 1: Base (1.0)
- concept_art_style.safetensors (Locked: 0.7)
- detail_level.safetensors

Group 2: Atmosphere (0.8)
- lighting_dramatic.safetensors
- color_mood.safetensors
- depth_layers.safetensors

Ungrouped:
- fix_hands.safetensors (0.5)
```

---

## Conclusion

The Advanced LoRA Stacker provides immense flexibility for LoRA management. Start simple, experiment with randomization, lock successful combinations, and build complex workflows as you discover what works best for your specific use case.

Remember: The console output is your friend - it shows exactly what values were used, making it easy to reproduce successful results!
