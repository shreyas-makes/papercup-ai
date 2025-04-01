class CreateCreditTransactions < ActiveRecord::Migration[8.0]
  def change
    create_table :credit_transactions do |t|
      t.references :user, null: false, foreign_key: true
      t.integer :amount_cents, null: false
      t.string :transaction_type, null: false
      t.string :stripe_payment_id

      t.timestamps
    end
    
    add_index :credit_transactions, :transaction_type
    add_index :credit_transactions, :stripe_payment_id
  end
end
