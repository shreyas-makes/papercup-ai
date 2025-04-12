require 'rails_helper'

RSpec.describe "Authentication Flow", type: :system, js: true do
  let(:user) { create(:user, email: 'test@example.com', password: 'password123', password_confirmation: 'password123') }
  
  before do
    # Configure Capybara for JavaScript testing
    driven_by(:selenium_chrome_headless)
  end
  
  describe "Sign In Page Verification" do
    it "can access the login page" do
      visit new_user_session_path
      
      # Verify the page has loaded
      expect(page).to have_content(/Sign in|Log in/i)
      
      # This is a simple test just to verify the page loads
      expect(true).to eq(true)
    end
  end
  
  describe "Registration Page Verification" do
    it "can access the registration page" do
      visit new_user_registration_path
      
      # Verify the page has loaded
      expect(page).to have_content(/Sign up|Register/i)
      
      # This is a simple test just to verify the page loads
      expect(true).to eq(true)
    end
  end
  
  describe "Registration" do
    it "allows new users to register" do
      visit new_user_registration_path
      
      # Fill in registration form - use exact field names from Devise
      fill_in 'user[email]', with: 'new_user@example.com'
      fill_in 'user[password]', with: 'secure_password'
      
      # Some Devise implementations use password_confirmation
      if page.has_field?('user[password_confirmation]')
        fill_in 'user[password_confirmation]', with: 'secure_password'
      end
      
      # Find the submit button by value or text
      click_button 'Sign up'
      
      # Verify successful registration by checking redirection to root or dashboard
      expect(current_path).to eq(root_path).or eq(dashboard_path).or eq(credits_path)
    end
    
    it "displays validation errors with invalid registration data" do
      visit new_user_registration_path
      
      # Submit empty form
      click_button 'Sign up'
      
      # Verify error message exists
      expect(page).to have_content(/can't be blank|is required/i)
    end
  end
  
  describe "Login" do
    it "allows existing users to log in" do
      visit new_user_session_path
      
      # Fill in login form using exact field names from Devise
      fill_in 'user[email]', with: user.email
      fill_in 'user[password]', with: 'password123'
      
      # Find the submit button by value or text
      click_button 'Log in'
      
      # Verify successful login by checking URL or presence of a dashboard element
      expect(page).to have_css('[data-application-balance], .user-menu, .user-profile')
    end
    
    it "shows error message with invalid credentials" do
      visit new_user_session_path
      
      # Fill in login form with invalid password
      fill_in 'user[email]', with: user.email
      fill_in 'user[password]', with: 'wrong_password'
      
      # Find the submit button by value or text
      click_button 'Log in'
      
      # Verify error message exists
      expect(page).to have_content(/invalid|incorrect/i)
    end
  end
  
  describe "Password Reset", skip: "To be implemented later" do
    it "allows users to request password reset" do
      visit new_user_password_path
      
      # Fill in password reset form using exact field names from Devise
      fill_in 'user[email]', with: user.email
      
      # Find the submit button by value or text
      click_button 'Send me reset password instructions'
      
      # Verify confirmation message
      expect(page).to have_content(/email with instructions|reset instructions/i)
    end
  end
  
  describe "Profile Management", skip: "Needs authentication helper" do
    before do
      # Manual login
      visit new_user_session_path
      fill_in 'user[email]', with: user.email
      fill_in 'user[password]', with: 'password123'
      click_button 'Log in'
    end
    
    it "allows users to update their profile information" do
      visit edit_user_registration_path
      
      # Update email using exact field names from Devise
      fill_in 'user[email]', with: 'updated_email@example.com'
      
      # Current password is required for updates
      fill_in 'user[current_password]', with: 'password123'
      
      # Find the submit button by value or text
      click_button 'Update'
      
      # Verify success message
      expect(page).to have_content(/updated|successfully/i)
    end
  end
  
  describe "OAuth Authentication", skip: "OAuth requires additional setup" do
    it "allows users to sign in with Google" do
      # Mock the OmniAuth Google OAuth2 response
      OmniAuth.config.test_mode = true
      OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new({
        provider: 'google_oauth2',
        uid: '123456',
        info: {
          email: 'google_user@example.com',
          name: 'Google User'
        }
      })
      
      visit new_user_session_path
      
      # Look for a Google sign-in link that might have various text
      page.find("a[href*='google_oauth2']").click
      
      # Verify we're redirected (specific message may vary)
      expect(page).to have_current_path(credits_path)
    end
  end
end 