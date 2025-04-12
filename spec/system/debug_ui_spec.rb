require 'rails_helper'

RSpec.describe "Debug UI Elements", type: :system, js: true do
  before do
    driven_by(:selenium_chrome_headless)
  end
  
  it "captures login page elements", skip: "Debug test - only run manually" do
    visit new_user_session_path
    
    # Print all form fields for debugging
    puts "\nFORM FIELDS:"
    all('input, select, textarea').each do |el|
      begin
        puts "  - Type: #{el.tag_name}, Name: #{el['name']}, ID: #{el['id']}, Placeholder: #{el['placeholder']}"
      rescue => e
        puts "  - Error inspecting element: #{e.message}"
      end
    end
    
    # Print all buttons
    puts "\nBUTTONS:"
    all('button, input[type="submit"]').each do |el|
      begin
        puts "  - Type: #{el.tag_name}, Text: #{el.text}, Value: #{el['value']}"
      rescue => e
        puts "  - Error inspecting element: #{e.message}"
      end
    end
    
    # Save a screenshot
    save_debug_screenshot("login_page.png")
    
    expect(true).to eq(true) # Always pass
  end
  
  it "captures registration page elements", skip: "Debug test - only run manually" do
    visit new_user_registration_path
    
    # Print all form fields for debugging
    puts "\nFORM FIELDS:"
    all('input, select, textarea').each do |el|
      begin
        puts "  - Type: #{el.tag_name}, Name: #{el['name']}, ID: #{el['id']}, Placeholder: #{el['placeholder']}"
      rescue => e
        puts "  - Error inspecting element: #{e.message}"
      end
    end
    
    # Print all buttons
    puts "\nBUTTONS:"
    all('button, input[type="submit"]').each do |el|
      begin
        puts "  - Type: #{el.tag_name}, Text: #{el.text}, Value: #{el['value']}"
      rescue => e
        puts "  - Error inspecting element: #{e.message}"
      end
    end
    
    # Save a screenshot
    save_debug_screenshot("registration_page.png")
    
    expect(true).to eq(true) # Always pass
  end
end 