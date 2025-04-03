class CallEvent < ApplicationRecord
  belongs_to :call
  
  # Validations
  validates :event_type, :occurred_at, presence: true
  
  # Default metadata to empty hash
  attribute :metadata, :jsonb, default: {}
  
  # Scopes
  scope :chronological, -> { order(occurred_at: :asc) }
  scope :by_type, ->(type) { where(event_type: type) }
  
  # Common event types
  EVENT_TYPES = [
    'initiated',
    'ringing', 
    'answered', 
    'in_progress', 
    'completed', 
    'terminated', 
    'failed'
  ]
  
  validates :event_type, inclusion: { in: EVENT_TYPES }, allow_nil: false
end
