class CreateCallMetrics < ActiveRecord::Migration[7.0]
  def change
    create_table :call_metrics do |t|
      t.references :call, null: false, foreign_key: true
      t.float :jitter, null: false, default: 0.0
      t.float :packet_loss, null: false, default: 0.0
      t.float :latency, null: false, default: 0.0
      t.integer :bitrate
      t.string :codec
      t.string :resolution
      t.json :raw_data

      t.timestamps
    end
    
    add_index :call_metrics, [:call_id, :created_at]
  end
end 