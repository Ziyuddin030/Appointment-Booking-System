class Appointment < ApplicationRecord
  attr_accessor :time_zone
  belongs_to :user

  SLOT = 30

  validates :name, :email, :starts_at, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validate  :slot_alignment, :within_business_hours, :future_slot, :no_overlap

  scope :between, ->(from, to) { where(starts_at: from..to) }
  scope :upcoming, -> { where('starts_at >= ?', Time.current).order(starts_at: :asc) }

  def self.paginated_list(page: 1, per_page: 10)
    page = page.to_i.positive? ? page.to_i : 1
    per_page = per_page.to_i.positive? ? per_page.to_i : 10

    records = upcoming
      .offset((page - 1) * per_page)
      .limit(per_page)

    {
      page: page,
      per_page: per_page,
      total: upcoming.count,
      total_pages: (upcoming.count / per_page.to_f).ceil,
      appointments: records.map { |r| r.as_json(only: [:id, :name, :email, :phone, :reason, :starts_at]) }
    }
  end

  private


  def slot_alignment
    return if starts_at.blank?
    errors.add(:base, "must start on #{SLOT}-minute boundary") if starts_at.min % SLOT != 0
  end

  def within_business_hours
    return if starts_at.blank?

    # Convert offset like "+05:30" to a valid Rails timezone
    tz = resolve_time_zone(time_zone.presence || 'UTC')

    local_time = starts_at.in_time_zone(tz)

    if local_time.saturday? || local_time.sunday?
      errors.add(:base, 'must be on a weekday')
    elsif local_time.hour < 9 || (local_time.hour == 16 && local_time.min > 30) || local_time.hour > 16
      errors.add(:base, "must be within 09:00–17:00 (#{tz})")
    end
  end

  def future_slot
    return if starts_at.blank?
    if starts_at < Time.current
      errors.add(:base, 'cannot be in the past')
    end
  end

  def no_overlap
    return if starts_at.blank?
    if Appointment.where(starts_at: starts_at).where.not(id: id).exists?
      errors.add(:base, 'This time slot is already booked')
    end
  end

  private
    def resolve_time_zone(tz)
      return tz if ActiveSupport::TimeZone[tz]
      ActiveSupport::TimeZone.all.find { |z| z.formatted_offset == tz }&.name || 'UTC'
    end
end
