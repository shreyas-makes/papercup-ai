require 'rails_helper'

RSpec.feature "Google Authentication", type: :feature do
  background do
    # Set up OmniAuth mock
    OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new({
      provider: 'google_oauth2',
      uid: '123456789',
      info: {
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://lh3.googleusercontent.com/test/photo.jpg'
      },
      credentials: {
        token: 'mock_token',
        expires_at: Time.now.to_i + 3600
      }
    })
  end

  scenario "User signs up with Google" do
    visit new_user_registration_path
    
    # Test sign in with Google
    click_button "Sign up with Google"
    
    # Verify the user was created
    expect(User.find_by(email: 'test@example.com')).to be_present
    
    # Verify user was signed in
    expect(page).to have_content("Successfully authenticated")
    expect(page).to have_current_path(dashboard_index_path)
  end
  
  scenario "User signs in with Google" do
    # Pre-create a user with Google provider
    User.create!(
      email: 'test@example.com',
      password: 'password123',
      provider: 'google_oauth2',
      uid: '123456789'
    )
    
    visit new_user_session_path
    
    # Test sign in with Google
    click_button "Sign in with Google"
    
    # Verify user was signed in
    expect(page).to have_content("Successfully authenticated")
    expect(page).to have_current_path(dashboard_index_path)
  end
  
  scenario "User fails authentication with Google" do
    OmniAuth.config.mock_auth[:google_oauth2] = :invalid_credentials
    
    visit new_user_session_path
    
    # Test sign in with Google
    click_button "Sign in with Google"
    
    # Verify failure message
    expect(page).to have_content("Authentication failed")
    expect(page).to have_current_path(root_path)
  end
end 