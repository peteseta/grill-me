
import os
from playwright.sync_api import sync_playwright, expect

def verify_interview_page(page):
    # 1. Go to Setup Page
    page.goto("http://localhost:3000")

    # 2. Fill out Setup form
    page.get_by_placeholder("e.g. Senior Frontend Engineer").fill("Senior React Engineer")

    # 3. Upload a fake resume
    # Create a dummy file first
    with open("dummy_resume.txt", "w") as f:
        f.write("This is a dummy resume.")

    # Upload
    # We need to find the input[type=file]
    page.locator("input[type='file']").set_input_files("dummy_resume.txt")

    # 4. Click Initialize Simulation
    page.get_by_role("button", name="Initialize Simulation").click()

    # 5. Wait for navigation to Interview Page
    # The button shows "Neural Analysis in Progress..." and waits 2500ms
    page.wait_for_url("**/interview/*")

    # 6. Verify Interview Page elements
    # Check for "Sophia" (Agent Name)
    expect(page.get_by_text("Sophia")).to_be_visible()

    # Check for "Senior Engineering Manager"
    expect(page.get_by_text("Senior Engineering Manager")).to_be_visible()

    # Check for "Real-time Transcript"
    expect(page.get_by_text("Real-time Transcript")).to_be_visible()

    # Check status. It should be CONNECTING or DISCONNECTED or CONNECTED.
    # Since we don't have a real Agent ID, it might fail to connect or stay in connecting.
    # But the UI should render.

    # Take screenshot
    page.screenshot(path="/home/jules/verification/interview_page.png")
    print("Screenshot taken at /home/jules/verification/interview_page.png")

if __name__ == "__main__":
    os.makedirs("/home/jules/verification", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_interview_page(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error_state.png")
        finally:
            browser.close()
