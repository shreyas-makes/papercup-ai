class AddTwilioSidToCalls < ActiveRecord::Migration[8.0]
  def change
    unless column_exists?(:calls, :twilio_sid)
      add_column :calls, :twilio_sid, :string
    end
    
    unless index_exists?(:calls, :twilio_sid)
      add_index :calls, :twilio_sid
    end
  end
end
