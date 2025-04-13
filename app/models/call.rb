class Call < ApplicationRecord
  belongs_to :user
  has_many :call_metrics, dependent: :destroy

  # Money-Rails integration
  monetize :cost_cents, as: "cost"

  # Validations
  validates :phone_number, :country_code, :status, presence: true

  # Call statuses
  enum :status, {
    pending: 'pending',
    initiated: 'initiated',
    ringing: 'ringing',
    connecting: 'connecting',
    in_progress: 'in_progress',
    completed: 'completed',
    dropped: 'dropped',
    failed: 'failed',
    terminated: 'terminated'
  }

  # Alias methods to map between column names and expected method names
  def started_at
    start_time
  end

  def started_at=(time)
    self.start_time = time
  end

  def ended_at
    end_time
  end

  def ended_at=(time)
    self.end_time = time
  end

  # Duration in seconds
  def duration
    return 0 unless started_at
    (ended_at || Time.current) - started_at
  end

  # Call's destination info
  def destination_info
    # Returning a placeholder - implement based on your actual data model
    {
      country: phone_number&.country_code,
      region: phone_number&.region,
      formatted_number: phone_number&.formatted
    }
  end

  # Get overall call quality
  def quality_rating
    metrics = call_metrics.order(created_at: :asc)
    return :unknown if metrics.empty?
    
    CallQualityService.analyze_call(self)[:quality]
  end

  # Scopes
  scope :recent, -> { order(created_at: :desc).limit(100) }
  scope :successful, -> { where(status: 'completed') }
  scope :by_country, ->(country_code) { where(country_code: country_code) }
  scope :daily_volume, -> { successful.group("DATE(created_at)").count }
  scope :completed, -> { where(status: 'completed') }
  scope :dropped, -> { where(status: 'dropped') }
  scope :in_timeframe, ->(start_date, end_date = nil) { 
    if end_date
      where(created_at: start_date..end_date) 
    else
      where('created_at >= ?', start_date)
    end
  }
end
