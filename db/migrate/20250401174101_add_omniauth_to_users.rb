class AddOmniauthToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :provider, :string
    add_column :users, :uid, :string
    add_column :users, :image, :string
    add_column :users, :name, :string
    add_column :users, :token, :string
    add_column :users, :refresh_token, :string
    add_column :users, :oauth_expires_at, :datetime
  end
end
