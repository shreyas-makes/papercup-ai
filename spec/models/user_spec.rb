require 'rails_helper'

RSpec.describe User, type: :model do
  subject { build(:user) }

  it 'has a valid factory' do
    expect(subject).to be_valid
  end

  describe 'ActiveModel validations' do
    it { expect(subject).to validate_presence_of(:email) }
    it { expect(subject).to validate_uniqueness_of(:email) }
    it { expect(subject).to validate_numericality_of(:credit_balance).is_greater_than_or_equal_to(0) }
  end

  # Associations
  it { should have_many(:calls).dependent(:nullify) }
  it { should have_many(:credit_transactions).dependent(:nullify) }
  
  # Money-Rails integration
  it "monetizes credit_balance" do
    user = User.new(credit_balance_cents: 1000)
    expect(user.credit_balance.cents).to eq(1000)
    expect(user.credit_balance.currency).to eq(Money::Currency.new("USD"))
  end
  
  describe ".from_omniauth" do
    before do
      # Skip Stripe customer creation in tests
      allow_any_instance_of(User).to receive(:setup_stripe_customer).and_return(true)
    end
    
    let(:auth) do
      OmniAuth::AuthHash.new({
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
    
    context "when user doesn't exist" do
      it "creates a new user with OAuth data" do
        expect {
          User.from_omniauth(auth)
        }.to change(User, :count).by(1)
        
        user = User.last
        expect(user.email).to eq('test@example.com')
        expect(user.name).to eq('Test User')
        expect(user.provider).to eq('google_oauth2')
        expect(user.uid).to eq('123456789')
      end
    end
    
    context "when user already exists" do
      let!(:existing_user) do
        User.create!(
          email: 'test@example.com',
          password: 'password123',
          provider: 'google_oauth2',
          uid: '123456789',
          name: 'Existing User'
        )
      end
      
      it "returns the existing user" do
        expect {
          user = User.from_omniauth(auth)
          expect(user).to eq(existing_user)
        }.not_to change(User, :count)
      end
      
      it "does not update the existing user's attributes" do
        user = User.from_omniauth(auth)
        # The name in the auth hash is 'Test User' but the existing user's name is 'Existing User'
        expect(user.name).to eq('Existing User')
      end
    end
  end

  describe "#jwt_token" do
    it "returns a JWT token with the user ID" do
      user = User.create!(email: 'test@example.com', password: 'password123')
      allow(JwtService).to receive(:encode).with({user_id: user.id}).and_return('mock.jwt.token')
      
      expect(user.jwt_token).to eq('mock.jwt.token')
      expect(JwtService).to have_received(:encode).with({user_id: user.id})
    end
  end
end
