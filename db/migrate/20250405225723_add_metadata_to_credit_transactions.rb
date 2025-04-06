class AddMetadataToCreditTransactions < ActiveRecord::Migration[8.0]
  def change
    add_column :credit_transactions, :metadata, :jsonb
  end
end
