require 'rails_helper'

RSpec.describe "Credits Purchase Flow", type: :system, js: true do
  let(:user) { create(:user, email: 'test@example.com', password: 'password') }
  let!(:starter_package) { create(:credit_package, name: 'Starter', identifier: 'starter', amount_cents: 5000, price_cents: 1000) }
  let!(:standard_package) { create(:credit_package, name: 'Standard', identifier: 'standard', amount_cents: 15000, price_cents: 2500) }
  
  before do
    # Configure Capybara for JavaScript testing
    driven_by(:selenium_chrome_headless)
    
    # Mock Stripe
    stripe_checkout_session = instance_double(Stripe::Checkout::Session, id: 'cs_test_123')
    stripe_checkout_service = instance_double(StripeCheckoutService)
    
    allow(StripeCheckoutService).to receive(:new).and_return(stripe_checkout_service)
    allow(stripe_checkout_service).to receive(:create_session).and_return(stripe_checkout_session)
    
    # Set up Stripe redirect mock
    allow_any_instance_of(Stripe::Checkout::Session).to receive(:url).and_return('https://checkout.stripe.com/test-session')
    
    # Sign in the user
    sign_in user
  end
  
  it "allows a user to purchase credit packages" do
    visit credits_path
    
    # Verify the page has loaded with credit packages
    expect(page).to have_content('Choose Your Credit Package')
    expect(page).to have_content('Starter')
    expect(page).to have_content('Standard')
    
    # Click on the standard package
    within "div[data-package-name='Standard']" do
      expect(page).to have_content('$25.00')
      expect(page).to have_content('$150.00 in calling credits')
      
      click_button 'Select Package'
    end
    
    # In a real test, we would now be redirected to Stripe
    # Since we're mocking, we can verify the request was made correctly
    
    expect(StripeCheckoutService).to have_received(:new).with(user, standard_package)
    expect(page).to have_content('Redirecting to checkout')
  end
  
  it "shows login modal for unauthenticated users" do
    sign_out user
    
    visit credits_path
    
    # Click on a package
    click_button 'Select Package', match: :first
    
    # Login modal should appear
    expect(page).to have_content('Sign In')
    expect(page).to have_field('Email')
    expect(page).to have_field('Password')
    
    # Fill in credentials and submit
    within "#login-modal" do
      fill_in 'Email', with: user.email
      fill_in 'Password', with: 'password'
      click_button 'Sign In'
    end
    
    # After login, should continue with package selection
    expect(page).to have_content('Redirecting to checkout')
  end
end 