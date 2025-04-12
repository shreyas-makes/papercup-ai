require 'rails_helper'

RSpec.describe "Call Flow", type: :system, js: true do
  let(:user) { create(:user, email: 'test@example.com', password: 'password123', password_confirmation: 'password123', credit_balance_cents: 10000) }
  
  before do
    # Configure Capybara for JavaScript testing
    driven_by(:selenium_chrome_headless)
    
    # Mock WebRTC setup - only setup if JwtService is already defined
    if defined?(JwtService)
      webrtc_token = 'test_webrtc_token_123'
      allow_any_instance_of(JwtService).to receive(:generate_webrtc_token).and_return(webrtc_token)
    end
    
    # Sign in the user using exact Devise field names
    visit new_user_session_path
    fill_in 'user[email]', with: user.email
    fill_in 'user[password]', with: 'password123'
    click_button 'Log in'
  end
  
  it "allows user to access the dialer" do
    # Visit the root path which should have the dialer
    visit root_path
    
    # Verify the page has loaded with something that looks like a dialer
    expect(page).to have_css('input[type="tel"]').or have_field(type: 'tel')
    
    # Success if we can see a button that might be used to initiate a call
    expect(page).to have_button.or have_css('button')
  end
end 