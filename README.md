# Papercup - WebRTC Calling Application

Papercup is a web application that allows users to make international calls using WebRTC technology. The application is built with Ruby on Rails and uses Stimulus.js for frontend interactivity.

## Features

- User authentication (login/registration)
- Credit package selection and purchase
- WebRTC calling functionality
- Call history tracking
- Real-time updates with ActionCable

## Tech Stack

- **Backend**: Ruby on Rails
- **Frontend**: Stimulus.js, Tailwind CSS
- **Real-time Communication**: ActionCable
- **WebRTC**: Twilio
- **Payment Processing**: Stripe
- **Database**: PostgreSQL

## Project Structure

### Frontend

- `app/javascript/controllers/`: Stimulus controllers
- `app/javascript/services/`: JavaScript services
- `app/javascript/channels/`: ActionCable channels
- `app/views/`: ERB templates

### Backend

- `app/controllers/`: Rails controllers
- `app/models/`: Rails models
- `app/services/`: Service objects
- `app/jobs/`: Background jobs

## API Services

The application uses the following API services:

1. **Authentication API**: Handles user login and registration
2. **Credits API**: Manages credit packages and purchases
3. **Calls API**: Handles call initiation and management
4. **WebRTC API**: Provides WebRTC tokens and configuration
5. **Stripe API**: Processes payments

## WebRTC Implementation

The WebRTC implementation includes:

- STUN/TURN server configuration
- Media stream handling
- Connection state management
- Error handling

## Real-time Updates

ActionCable is used for real-time updates:

- Call state changes
- ICE candidate exchange
- Call ending notifications

## Getting Started

### Prerequisites

- Ruby 3.0.0 or higher
- Rails 7.0.0 or higher
- Node.js 14.0.0 or higher
- PostgreSQL 12.0 or higher

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/papercup.git
   cd papercup
   ```

2. Install dependencies
   ```
   bundle install
   yarn install
   ```

3. Set up the database
   ```
   rails db:create db:migrate db:seed
   ```

4. Start the development server
   ```
   bin/dev
   ```

5. Visit `http://localhost:3000` in your browser

## Environment Variables

The following environment variables are required:

- `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `STRIPE_SECRET_KEY`: Stripe secret key
- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `TWILIO_API_KEY`: Twilio API key
- `TWILIO_API_SECRET`: Twilio API secret

## Testing

Run the test suite with:

```
bundle exec rspec
```

## Deployment

The application is configured for deployment on Hetzner Cloud and Hatchbox.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Development Environment Setup

This project requires specific tool versions managed by [`asdf`](https://asdf-vm.com/). Please ensure you have `asdf` installed and configured correctly before proceeding.

**Required Tool:**

*   Ruby 3.3.5

**Setup Steps:**

1.  **Install `asdf`:** Follow the [official asdf installation guide](https://asdf-vm.com/guide/getting-started.html#_1-install-dependencies).
2.  **Add Ruby Plugin:** `asdf plugin-add ruby https://github.com/asdf-vm/asdf-ruby.git`
3.  **Install Required Ruby Version:** Navigate to the project directory and run `asdf install`. This will read the `.tool-versions` file and install Ruby 3.3.5 if you don't have it.
4.  **Verify:** In the project directory, run `ruby -v`. It should output `ruby 3.3.5...`.

**IMPORTANT: Remove Conflicting Version Managers**

To avoid conflicts, please ensure you **remove or disable configurations for other Ruby version managers like RVM or rbenv** from your shell startup files (e.g., `~/.bashrc`, `~/.bash_profile`, `~/.zshrc`). Comment out or delete lines related to `rvm` or `rbenv` initialization. After editing, restart your terminal or source the configuration file (e.g., `source ~/.zshrc`).
