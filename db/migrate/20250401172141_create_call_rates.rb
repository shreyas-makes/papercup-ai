class CreateCallRates < ActiveRecord::Migration[8.0]
  def change
    create_table :call_rates do |t|
      t.string :country_code, null: false
      t.string :prefix, null: false
      t.integer :rate_per_min_cents, null: false

      t.timestamps
    end
    
    add_index :call_rates, :country_code
    add_index :call_rates, :prefix
    add_index :call_rates, [:country_code, :prefix], unique: true
  end
end
