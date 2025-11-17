#!/usr/bin/env python3
"""
Test script for the random partitioning algorithm
Tests the stick-breaking method implementation
"""

import sys
import json

# Mock the ComfyUI imports since we're testing standalone
class MockFolderPaths:
    @staticmethod
    def get_full_path(folder, filename):
        return f"/mock/path/{folder}/{filename}"

class MockComfy:
    class sd:
        @staticmethod
        def load_lora_for_models(model, clip, lora, model_strength, clip_strength):
            return model, clip
    
    class utils:
        @staticmethod
        def load_torch_file(path, safe_load=True):
            return {}

sys.modules['folder_paths'] = MockFolderPaths
sys.modules['comfy'] = MockComfy
sys.modules['comfy.sd'] = MockComfy.sd
sys.modules['comfy.utils'] = MockComfy.utils

from advanced_lora_stacker import AdvancedLoraStacker


def test_basic_partitioning():
    """Test basic random partitioning without locks"""
    print("Test 1: Basic Partitioning (no locks)")
    print("-" * 60)
    
    node = AdvancedLoraStacker()
    
    # Test with 4 segments, total 1.0
    result = node.partition_strengths(1.0, 4, None, seed=12345)
    
    print(f"Total: 1.0, Segments: 4")
    print(f"Result: {result}")
    print(f"Sum: {sum(result)}")
    print(f"Sum equals 1.0: {abs(sum(result) - 1.0) < 0.0001}")
    print()


def test_locked_values():
    """Test partitioning with locked values"""
    print("Test 2: Partitioning with Locked Values")
    print("-" * 60)
    
    node = AdvancedLoraStacker()
    
    # Test with 4 segments, total 1.0, lock first at 0.3
    locked = {0: 0.3}
    result = node.partition_strengths(1.0, 4, locked, seed=12345)
    
    print(f"Total: 1.0, Segments: 4")
    print(f"Locked: index 0 = 0.3")
    print(f"Result: {result}")
    print(f"Sum: {sum(result)}")
    print(f"Locked value preserved: {result[0] == 0.3}")
    print(f"Sum equals 1.0: {abs(sum(result) - 1.0) < 0.0001}")
    print()


def test_multiple_locks():
    """Test partitioning with multiple locked values"""
    print("Test 3: Multiple Locked Values")
    print("-" * 60)
    
    node = AdvancedLoraStacker()
    
    # Test with 5 segments, total 1.0, lock indices 1 and 3
    locked = {1: 0.25, 3: 0.35}
    result = node.partition_strengths(1.0, 5, locked, seed=12345)
    
    print(f"Total: 1.0, Segments: 5")
    print(f"Locked: index 1 = 0.25, index 3 = 0.35")
    print(f"Result: {result}")
    print(f"Sum: {sum(result)}")
    print(f"Locked values preserved: {result[1] == 0.25 and result[3] == 0.35}")
    print(f"Sum equals 1.0: {abs(sum(result) - 1.0) < 0.0001}")
    print()


def test_seed_reproducibility():
    """Test that same seed produces same results"""
    print("Test 4: Seed Reproducibility")
    print("-" * 60)
    
    node = AdvancedLoraStacker()
    
    result1 = node.partition_strengths(1.0, 3, None, seed=99999)
    result2 = node.partition_strengths(1.0, 3, None, seed=99999)
    result3 = node.partition_strengths(1.0, 3, None, seed=11111)
    
    print(f"Seed 99999 (run 1): {result1}")
    print(f"Seed 99999 (run 2): {result2}")
    print(f"Seed 11111 (run 1): {result3}")
    print(f"Same seed produces same result: {result1 == result2}")
    print(f"Different seed produces different result: {result1 != result3}")
    print()


def test_edge_cases():
    """Test edge cases"""
    print("Test 5: Edge Cases")
    print("-" * 60)
    
    node = AdvancedLoraStacker()
    
    # Single segment
    result1 = node.partition_strengths(1.0, 1, None, seed=12345)
    print(f"Single segment: {result1}")
    print(f"Correct: {result1 == [1.0]}")
    print()
    
    # All locked
    locked = {0: 0.3, 1: 0.4, 2: 0.3}
    result2 = node.partition_strengths(1.0, 3, locked, seed=12345)
    print(f"All locked: {result2}")
    print(f"Correct: {result2 == [0.3, 0.4, 0.3]}")
    print()
    
    # Higher total
    result3 = node.partition_strengths(2.0, 4, None, seed=12345)
    print(f"Total 2.0 over 4 segments: {result3}")
    print(f"Sum equals 2.0: {abs(sum(result3) - 2.0) < 0.0001}")
    print()


def test_json_serialization():
    """Test JSON configuration format"""
    print("Test 6: JSON Configuration")
    print("-" * 60)
    
    # Sample configuration
    config = {
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
                "name": "test_lora.safetensors",
                "preset": "Character",
                "lock_model": False,
                "locked_model_value": 0.0,
                "lock_clip": True,
                "locked_clip_value": 0.5
            },
            {
                "id": 2,
                "group_id": None,
                "name": "style_lora.safetensors",
                "preset": "Style",
                "model_strength": 0.8,
                "clip_strength": 0.8,
                "random_model": True,
                "min_model": 0.5,
                "max_model": 1.0,
                "random_clip": False,
                "min_clip": 0.0,
                "max_clip": 1.0
            }
        ]
    }
    
    json_str = json.dumps(config, indent=2)
    print("Sample configuration:")
    print(json_str)
    
    # Verify it can be parsed back
    parsed = json.loads(json_str)
    print(f"\nSuccessfully serialized and deserialized: {parsed == config}")
    print()


def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("Advanced LoRA Stacker - Partitioning Tests")
    print("=" * 60)
    print()
    
    test_basic_partitioning()
    test_locked_values()
    test_multiple_locks()
    test_seed_reproducibility()
    test_edge_cases()
    test_json_serialization()
    
    print("=" * 60)
    print("All tests completed!")
    print("=" * 60)


if __name__ == "__main__":
    run_all_tests()
