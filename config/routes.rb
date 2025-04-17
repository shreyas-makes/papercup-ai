Rails.application.routes.draw do
  namespace :api do
    get "stripe_webhooks/create"
    post 'stripe_webhooks', to: 'stripe_webhooks#create'
    get "credits/create"
    get "credits/show"
    resources :credits, only: [:index, :show] do
      collection do
        get :balance
        post :create_checkout_session
        post :webhook
      end
    end
    # Removing auto-generated routes
    # get "calls/create"
    # get "calls/update"
    # get "calls/show"
    # get "calls/index"

    resources :calls, only: [:index, :show] do
      resources :metrics, only: [:create], controller: 'call_metrics'
    end
    
    resources :analytics, only: [:index] do
      collection do
        get :call_volume
        get :call_quality
        get :destinations
      end
    end
  end
  ActiveAdmin.routes(self)

  root 'dialer#index'

  # Devise routes with OmniAuth callbacks
  devise_for :users,
    path: '',  # This makes routes like /login instead of /users/login
    path_names: { 
      sign_in: 'login',
      sign_up: 'signup'
    },
    controllers: {
      omniauth_callbacks: 'users/omniauth_callbacks',
      registrations: 'registrations',
      sessions: 'users/sessions'
    }
  
  # Custom logout route
  get 'logout', to: 'pages#logout', as: 'logout'

  # Session management
  get 'session/token', to: 'sessions#token'
  delete 'session', to: 'sessions#destroy'

  # API routes
  namespace :api, defaults: { format: :json } do
    post 'stripe_webhooks', to: 'stripe_webhooks#create'
    
    resources :credits, only: [:index, :show] do
      collection do
        get :balance
        post :create_checkout_session
        post :webhook
      end
    end

    resources :sessions, only: [:create, :destroy] do
      collection do
        get :check
      end
    end

    # Call management API endpoints
    resources :calls, only: [:index, :show, :create, :update] do
      member do
        post :terminate
      end
      
      collection do
        get :history
        post :status_callback
        post :webhook
        get :webhook # Allow GET for TwiML webhooks
        # Add route for direct Twilio status check
        get :twilio_status, defaults: { format: 'json' }
      end
    end

    resources :analytics, only: [:index] do
      collection do
        get :call_volume
        get :call_quality
        get :destinations
      end
    end

    # Authentication endpoints
    namespace :v1 do
      resources :auth, only: [:create] do
        collection do
          post :login, to: 'auth#create'
        end
      end
      post 'auth/login_from_session', to: 'auth#login_from_session'
      delete 'auth/logout', to: 'auth#destroy'
      get 'auth/me', to: 'auth#me'
    end

    # WebRTC token endpoint
    namespace :webrtc do
      post :token
      get :test_connection
    end
  end

  # Main app routes
  get 'subscribe', to: 'subscribe#index'
  resources :dashboard, only: [:index]
  resources :account, only: %i[index update] do
    get :stop_impersonating, on: :collection
  end
  resources :billing_portal, only: [:new, :create]
  resources :blog_posts, controller: :blog_posts, path: "blog", param: :slug

  # static pages
  pages = %w[
    privacy terms
  ]

  pages.each do |page|
    get "/#{page}", to: "pages##{page}", as: page.gsub('-', '_').to_s
  end

  # admin panels
  authenticated :user, lambda(&:admin?) do
    # insert sidekiq etc
    mount Split::Dashboard, at: 'admin/split'
  end

  # Dialer and calling routes
  resources :dialer, only: [:index]
  get 'dialer/test', to: 'dialer#test', as: 'dialer_test'
  get 'dialer/test_webrtc', to: 'dialer#test_webrtc', as: 'dialer_test_webrtc'
  resources :credits, only: [:index] do
    collection do
      get :success
      get :cancel
      post :create_checkout_session
    end
  end
  resources :call_history, only: [:index]
  
  # Notifications test page
  resources :notifications, only: [:index]

  # Static pages
  get 'privacy', to: 'pages#privacy'
  get 'terms', to: 'pages#terms'

  # Admin routes
  namespace :admin do
    resources :analytics, only: [:index] do
      collection do
        get :call_volume
        get :call_quality
        get :revenue
        get :destinations
        get :users
      end
    end
    
    resources :calls, only: [:index, :show]
  end

  # User routes
  get 'user/analytics', to: 'users#analytics', as: :user_analytics
  
  # Define additional routes for Twilio callbacks
  # This ensures the webhook URLs used in InitiateCallJob are defined
  # The issue was the missing webhook_url helper
  namespace :api do
    resources :calls, only: [] do
      collection do
        # These routes match the URLs used in the InitiateCallJob
        get :webhook, defaults: { format: 'xml' }
        post :webhook, defaults: { format: 'xml' }
        post :status_callback, defaults: { format: 'json' }
        # Add route for direct Twilio status check
        get :twilio_status, defaults: { format: 'json' }
      end
    end
  end
end
