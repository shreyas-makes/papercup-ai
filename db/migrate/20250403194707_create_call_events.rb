class CreateCallEvents < ActiveRecord::Migration[8.0]
  def change
    create_table :call_events do |t|
      t.references :call, null: false, foreign_key: true
      t.string :event_type
      t.datetime :occurred_at
      t.jsonb :metadata

      t.timestamps
    end
  end
end
