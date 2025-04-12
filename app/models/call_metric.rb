class CallMetric < ApplicationRecord
  belongs_to :call
  
  validates :jitter, :packet_loss, :latency, presence: true
  
  # Store raw WebRTC data as JSON
  store :raw_data, coder: JSON
  
  # Scope for metrics within a timeframe
  scope :in_timeframe, ->(start_date, end_date = nil) { 
    if end_date
      where(created_at: start_date..end_date) 
    else
      where('created_at >= ?', start_date)
    end
  }
  
  # Scope for metrics with poor quality
  scope :poor_quality, -> { where('jitter > ? OR packet_loss > ? OR latency > ?', 50, 5, 300) }
  
  # Return quality rating based on metrics
  def quality_rating
    CallQualityService.rate_quality(quality_score)
  end
  
  # Calculate quality score from current metrics
  def quality_score
    CallQualityService.calculate_quality_score(jitter, packet_loss, latency)
  end
end 