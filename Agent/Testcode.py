# ==========================================================================
# Simple test script: checks if load_folder() and load_website() both work
# Run this BEFORE running the full mcq_generator.py pipeline
# ==========================================================================
from index import load_folder, load_website


def test_local_files():
    print("\n--- Testing load_folder (local files) ---")
    try:
        docs = load_folder("./Files")
        print(f"SUCCESS: Loaded {len(docs)} documents from ./Files")
        if docs:
            print("First document preview:")
            print(docs[0].page_content[:200])
            print("Metadata:", docs[0].metadata)
        else:
            print("WARNING: 0 documents found. Check that ./Files folder has supported files.")
    except Exception as e:
        print(f"FAILED: {e}")


def test_website(url: str):
    print(f"\n--- Testing load_website ({url}) ---")
    try:
        docs = load_website(url)
        print(f"SUCCESS: Loaded {len(docs)} document(s) from website")
        if docs:
            print("First 200 characters of content:")
            print(docs[0].page_content[:200])
            print("Metadata:", docs[0].metadata)
        else:
            print("WARNING: 0 documents returned.")
    except Exception as e:
        print(f"FAILED: {e}")


if __name__ == "__main__":
    # Test 1: local files
    test_local_files()

    # Test 2: website
    # Replace this URL with any site you want to test
    test_website("https://www.docker.com/resources/what-container/")