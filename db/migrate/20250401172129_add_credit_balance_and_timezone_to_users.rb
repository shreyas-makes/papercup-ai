class AddCreditBalanceAndTimezoneToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :credit_balance_cents, :integer, default: 0, null: false
    add_column :users, :timezone, :string, default: "UTC"
    
    add_index :users, :credit_balance_cents
  end
end
