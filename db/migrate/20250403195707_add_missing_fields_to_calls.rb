class AddMissingFieldsToCalls < ActiveRecord::Migration[8.0]
  def change
    add_column :calls, :failure_reason, :string
    add_column :calls, :duration, :integer
    add_column :calls, :twilio_sid, :string
    add_column :calls, :end_time, :datetime
  end
end
