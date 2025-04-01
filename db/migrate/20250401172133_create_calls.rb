class CreateCalls < ActiveRecord::Migration[8.0]
  def change
    create_table :calls do |t|
      t.references :user, null: false, foreign_key: true
      t.string :phone_number, null: false
      t.string :country_code, null: false
      t.datetime :start_time
      t.integer :duration_seconds, default: 0
      t.string :status, default: "pending"
      t.integer :cost_cents, default: 0, null: false

      t.timestamps
    end
    
    add_index :calls, :phone_number
    add_index :calls, :country_code
    add_index :calls, :status
    add_index :calls, :start_time
  end
end
