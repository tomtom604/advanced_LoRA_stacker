#!/usr/bin/env python3
"""
Test script for the TextConcatenator node
Tests concatenation and indexing functionality
"""

import sys

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

from advanced_lora_stacker import TextConcatenator


def test_basic_concatenation():
    """Test basic text concatenation"""
    print("Test 1: Basic Concatenation")
    print("-" * 60)
    
    node = TextConcatenator()
    
    # Test with 3 text inputs
    concatenated, indexed = node.concatenate_texts(
        delimiter=", ",
        index=0,
        text_1="Hello",
        text_2="World",
        text_3="Test"
    )
    
    print(f"Inputs: text_1='Hello', text_2='World', text_3='Test'")
    print(f"Delimiter: ', '")
    print(f"Concatenated: '{concatenated}'")
    print(f"Expected: 'Hello, World, Test'")
    print(f"Match: {concatenated == 'Hello, World, Test'}")
    print()


def test_custom_delimiter():
    """Test with custom delimiter"""
    print("Test 2: Custom Delimiter")
    print("-" * 60)
    
    node = TextConcatenator()
    
    # Test with newline delimiter
    concatenated, indexed = node.concatenate_texts(
        delimiter="\n",
        index=0,
        text_1="Line 1",
        text_2="Line 2",
        text_3="Line 3"
    )
    
    print(f"Inputs: text_1='Line 1', text_2='Line 2', text_3='Line 3'")
    print(f"Delimiter: '\\n'")
    print(f"Concatenated:\n{concatenated}")
    print(f"Expected:\nLine 1\nLine 2\nLine 3")
    print(f"Match: {concatenated == 'Line 1\nLine 2\nLine 3'}")
    print()


def test_indexing():
    """Test indexed output"""
    print("Test 3: Indexed Output")
    print("-" * 60)
    
    node = TextConcatenator()
    
    # Test different indices
    texts = {
        "text_1": "First",
        "text_2": "Second",
        "text_3": "Third",
        "text_4": "Fourth"
    }
    
    for i in range(4):
        _, indexed = node.concatenate_texts(
            delimiter=", ",
            index=i,
            **texts
        )
        expected = ["First", "Second", "Third", "Fourth"][i]
        print(f"Index {i}: '{indexed}' (expected: '{expected}', match: {indexed == expected})")
    
    # Test out of range index
    _, indexed = node.concatenate_texts(
        delimiter=", ",
        index=10,
        **texts
    )
    print(f"Index 10 (out of range): '{indexed}' (expected: '', match: {indexed == ''})")
    print()


def test_empty_inputs():
    """Test with no inputs or empty strings"""
    print("Test 4: Empty Inputs")
    print("-" * 60)
    
    node = TextConcatenator()
    
    # Test with no inputs
    concatenated, indexed = node.concatenate_texts(
        delimiter=", ",
        index=0
    )
    print(f"No inputs:")
    print(f"  Concatenated: '{concatenated}' (expected: '')")
    print(f"  Indexed: '{indexed}' (expected: '')")
    print(f"  Match: {concatenated == '' and indexed == ''}")
    
    # Test with empty strings
    concatenated, indexed = node.concatenate_texts(
        delimiter=", ",
        index=0,
        text_1="",
        text_2=""
    )
    print(f"Empty string inputs:")
    print(f"  Concatenated: '{concatenated}' (expected: '')")
    print(f"  Match: {concatenated == ''}")
    print()


def test_single_input():
    """Test with single input"""
    print("Test 5: Single Input")
    print("-" * 60)
    
    node = TextConcatenator()
    
    concatenated, indexed = node.concatenate_texts(
        delimiter=", ",
        index=0,
        text_1="Only One"
    )
    
    print(f"Input: text_1='Only One'")
    print(f"Concatenated: '{concatenated}' (expected: 'Only One')")
    print(f"Indexed: '{indexed}' (expected: 'Only One')")
    print(f"Match: {concatenated == 'Only One' and indexed == 'Only One'}")
    print()


def test_multiline_delimiter():
    """Test with multiline delimiter"""
    print("Test 6: Multiline Delimiter")
    print("-" * 60)
    
    node = TextConcatenator()
    
    # Test with separator line
    delimiter = "\n---\n"
    concatenated, indexed = node.concatenate_texts(
        delimiter=delimiter,
        index=0,
        text_1="Section 1",
        text_2="Section 2",
        text_3="Section 3"
    )
    
    print(f"Inputs: 'Section 1', 'Section 2', 'Section 3'")
    print(f"Delimiter: '\\n---\\n'")
    print(f"Concatenated:\n{concatenated}")
    expected = "Section 1\n---\nSection 2\n---\nSection 3"
    print(f"Match: {concatenated == expected}")
    print()


def test_ordering():
    """Test that inputs are ordered correctly"""
    print("Test 7: Input Ordering")
    print("-" * 60)
    
    node = TextConcatenator()
    
    # Test with unordered kwargs (should be sorted by number)
    concatenated, indexed = node.concatenate_texts(
        delimiter=" ",
        index=0,
        text_3="third",
        text_1="first",
        text_5="fifth",
        text_2="second",
        text_4="fourth"
    )
    
    print(f"Inputs (out of order): text_3='third', text_1='first', text_5='fifth', text_2='second', text_4='fourth'")
    print(f"Concatenated: '{concatenated}'")
    print(f"Expected: 'first second third fourth fifth'")
    print(f"Match: {concatenated == 'first second third fourth fifth'}")
    print()


def test_none_values():
    """Test handling of None values"""
    print("Test 8: None Values")
    print("-" * 60)
    
    node = TextConcatenator()
    
    # Test with None mixed in
    concatenated, indexed = node.concatenate_texts(
        delimiter=", ",
        index=0,
        text_1="First",
        text_2=None,
        text_3="Third"
    )
    
    print(f"Inputs: text_1='First', text_2=None, text_3='Third'")
    print(f"Concatenated: '{concatenated}' (expected: 'First, Third')")
    print(f"Match: {concatenated == 'First, Third'}")
    print()


def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("TextConcatenator - Tests")
    print("=" * 60)
    print()
    
    test_basic_concatenation()
    test_custom_delimiter()
    test_indexing()
    test_empty_inputs()
    test_single_input()
    test_multiline_delimiter()
    test_ordering()
    test_none_values()
    
    print("=" * 60)
    print("All tests completed!")
    print("=" * 60)


if __name__ == "__main__":
    run_all_tests()
